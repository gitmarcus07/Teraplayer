"""TeraPlayer iteration 2 backend API tests.

Covers:
- Auth endpoints (session exchange, me, logout)
- Optional password field on preview/watch/download/folder
- password_required boolean in response
- History/Favorites scoping by user_id when Bearer token provided
- MongoDB rate limiter (burst -> 429, TTL index existence)
"""
from __future__ import annotations

import os
import time
import uuid
import subprocess
import json as _json

import pytest
import requests
from pymongo import MongoClient

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    _candidates = [
        "/app/frontend/.env",
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env"),
        os.path.join(os.getcwd(), "..", "frontend", ".env"),
    ]
    for _env in _candidates:
        if os.path.exists(_env):
            for line in open(_env):
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].strip().strip('"')
                    break
            if BASE_URL:
                break

assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

# Backend Mongo (same DB the app uses)
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def client() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def session_id() -> str:
    return f"TEST_iter2_{uuid.uuid4().hex[:10]}"


@pytest.fixture(scope="session")
def mongo():
    mc = MongoClient(MONGO_URL)
    db = mc[DB_NAME]
    yield db
    mc.close()


@pytest.fixture(scope="session")
def seeded_user(mongo):
    """Seed a user + user_session in Mongo. Returns (user_id, session_token)."""
    from datetime import datetime, timezone, timedelta
    user_id = f"TEST_user_{uuid.uuid4().hex[:10]}"
    session_token = f"TEST_token_{uuid.uuid4().hex[:16]}"
    email = f"TEST_iter2_{uuid.uuid4().hex[:6]}@example.com"
    now = datetime.now(timezone.utc)
    mongo.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": "Test User",
        "picture": "https://via.placeholder.com/150",
        "created_at": now.isoformat(),
    })
    mongo.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat(),
    })
    yield user_id, session_token
    # Cleanup
    mongo.users.delete_many({"user_id": user_id})
    mongo.user_sessions.delete_many({"session_token": session_token})
    mongo.history.delete_many({"user_id": user_id})
    mongo.favorites.delete_many({"user_id": user_id})


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_health(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------------------------------------------------------------------------
# Preview with optional password
# ---------------------------------------------------------------------------


class TestPreviewPassword:
    def test_preview_rejects_non_terabox(self, client):
        r = client.post(f"{API}/preview", json={"url": "https://google.com"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is False
        assert "TeraBox" in (data.get("error") or "") or "terabox" in (data.get("error") or "").lower()

    def test_preview_password_none(self, client):
        r = client.post(f"{API}/preview", json={"url": "https://google.com", "password": None}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is False

    def test_preview_password_omitted(self, client):
        r = client.post(f"{API}/preview", json={"url": "https://google.com"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is False

    def test_preview_password_string(self, client):
        r = client.post(f"{API}/preview", json={"url": "https://google.com", "password": "secret123"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is False

    def test_preview_dead_terabox_returns_password_required_field(self, client):
        r = client.post(
            f"{API}/preview",
            json={"url": "https://terabox.com/s/1invalidLink000"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is False
        # password_required must be a boolean field present in response
        assert "password_required" in data
        assert isinstance(data["password_required"], bool)

    @pytest.mark.parametrize("endpoint", ["watch", "download", "folder"])
    def test_alias_endpoints_accept_password(self, client, endpoint):
        r = client.post(
            f"{API}/{endpoint}",
            json={"url": "https://notterabox.example.com/foo", "password": "abc"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is False
        assert isinstance(data.get("error"), str) and data["error"]


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------


class TestAuth:
    def test_auth_me_without_cookie_401(self, client):
        # Use raw session (no cookies) to guarantee no leftover state
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_auth_me_with_invalid_bearer_returns_401(self):
        r = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": "Bearer fake-invalid-token-xyz"},
            timeout=10,
        )
        assert r.status_code == 401

    def test_auth_session_endpoint_removed(self, client):
        """The old /api/auth/session endpoint has been removed for native auth."""
        r = client.post(
            f"{API}/auth/session",
            json={"session_id": "bogus-session-id-xyz"},
            timeout=10,
        )
        # Endpoint no longer exists — must be 404, must NOT be 500.
        assert r.status_code == 404, r.text

    def test_auth_logout_idempotent_no_session(self, client):
        # No cookies attached
        r = requests.post(f"{API}/auth/logout", timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_auth_me_with_valid_seeded_session(self, seeded_user):
        _, token = seeded_user
        r = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("email", "").startswith("TEST_iter2_")


# ---------------------------------------------------------------------------
# History flows (anonymous, invalid bearer, authenticated)
# ---------------------------------------------------------------------------


class TestHistoryAnonymous:
    def test_history_create_get_delete(self, client, session_id):
        payload = {
            "session_id": session_id,
            "url": "https://terabox.com/s/1TEST_hist_iter2",
            "title": "TEST History Iter2",
        }
        r = client.post(f"{API}/history", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["url"] == payload["url"]
        hist_id = created["id"]

        r = client.get(f"{API}/history", params={"session_id": session_id}, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert any(it["id"] == hist_id for it in items)

        r = client.delete(
            f"{API}/history/{hist_id}", params={"session_id": session_id}, timeout=15
        )
        assert r.status_code == 200
        assert r.json().get("deleted") == 1


class TestHistoryInvalidBearer:
    def test_invalid_bearer_falls_back_to_session(self, session_id):
        """A bogus Bearer token should be treated as anonymous — no crash."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer totally-bogus-token-123",
        }
        payload = {
            "session_id": session_id + "_badtok",
            "url": "https://terabox.com/s/1TEST_hist_badtok",
            "title": "TEST Bad Token",
        }
        r = requests.post(f"{API}/history", json=payload, headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        # Because bogus bearer -> anonymous, entry should be stored under session_id
        assert created["session_id"] == payload["session_id"]

        r = requests.get(
            f"{API}/history",
            params={"session_id": payload["session_id"]},
            headers=headers,
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json()
        assert any(it["url"] == payload["url"] for it in items)

        # Cleanup
        requests.delete(
            f"{API}/history",
            params={"session_id": payload["session_id"]},
            timeout=15,
        )


class TestHistoryAuthenticated:
    def test_history_user_scoped(self, seeded_user):
        user_id, token = seeded_user
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        payload = {
            "session_id": "IGNORED_when_authed",
            "url": f"https://terabox.com/s/1TEST_auth_{uuid.uuid4().hex[:6]}",
            "title": "TEST Authed Hist",
        }
        r = requests.post(f"{API}/history", json=payload, headers=headers, timeout=15)
        assert r.status_code == 200, r.text

        # GET without session_id but with token -> should return user's data
        r = requests.get(f"{API}/history", headers=headers, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert any(it["url"] == payload["url"] for it in items)

        # Cross-device: same token from a "different device" (fresh session) still returns items
        r2 = requests.get(f"{API}/history", headers=headers, timeout=15)
        assert r2.status_code == 200
        assert any(it["url"] == payload["url"] for it in r2.json())

        # Anonymous request with the "IGNORED" session_id should NOT return this item
        r_anon = requests.get(
            f"{API}/history",
            params={"session_id": "IGNORED_when_authed"},
            timeout=15,
        )
        assert r_anon.status_code == 200
        assert not any(it["url"] == payload["url"] for it in r_anon.json())


class TestFavoritesAuthenticated:
    def test_favorites_user_scoped_and_idempotent(self, seeded_user):
        _, token = seeded_user
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        payload = {
            "session_id": "IGNORED_when_authed",
            "url": f"https://terabox.com/s/1TEST_fav_{uuid.uuid4().hex[:6]}",
            "title": "TEST Authed Fav",
        }
        r1 = requests.post(f"{API}/favorites", json=payload, headers=headers, timeout=15)
        assert r1.status_code == 200, r1.text
        first_id = r1.json()["id"]

        # Idempotent
        r2 = requests.post(f"{API}/favorites", json=payload, headers=headers, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["id"] == first_id

        # GET returns user's fav
        r = requests.get(f"{API}/favorites", headers=headers, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert any(it["url"] == payload["url"] for it in items)


# ---------------------------------------------------------------------------
# Rate limiter (Mongo-backed, TTL)
# ---------------------------------------------------------------------------


class TestRateLimit:
    def test_burst_returns_429_no_500(self, client):
        statuses = []
        for _ in range(65):
            try:
                r = client.post(
                    f"{API}/preview",
                    json={"url": "https://notterabox.example.com/burst"},
                    timeout=15,
                )
                statuses.append(r.status_code)
            except requests.RequestException:
                statuses.append(0)
        # No 500 crashes
        assert not any(s >= 500 and s < 600 for s in statuses), f"500-class: {statuses}"
        # We should see at least one 429 (limit is 60/min)
        assert 429 in statuses, f"Expected 429 in {statuses[-15:]}"

    def test_rate_limits_collection_has_ttl_index(self, mongo):
        # Ensure the collection exists and has a TTL on created_at
        indexes = list(mongo.rate_limits.list_indexes())
        ttl_index = next(
            (idx for idx in indexes if idx.get("expireAfterSeconds") is not None),
            None,
        )
        assert ttl_index is not None, f"No TTL index on rate_limits. Indexes: {indexes}"
        assert "created_at" in ttl_index["key"], f"TTL not on created_at: {ttl_index}"
