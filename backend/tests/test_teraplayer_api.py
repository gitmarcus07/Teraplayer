"""TeraPlayer backend API tests.

Tests hit the public REACT_APP_BACKEND_URL so we validate what the frontend
actually sees (via k8s ingress). Third-party TeraBox extractors may be down –
we only assert that the API responds with well-formed JSON (never 500).
"""
from __future__ import annotations

import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback: read from frontend/.env (supports Linux /app/... and local relative paths)
    _candidates = [
        "/app/frontend/.env",                                          # Docker/Linux
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env"),  # relative to this file
        os.path.join(os.getcwd(), "..", "frontend", ".env"),          # relative to CWD
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
    return f"TEST_{uuid.uuid4().hex[:10]}"


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_health(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") is True
        assert data.get("service") == "teraplayer"


# ---------------------------------------------------------------------------
# Preview / Watch / Download / Folder validation
# ---------------------------------------------------------------------------


class TestPreviewValidation:
    def test_preview_rejects_non_terabox(self, client):
        r = client.post(f"{API}/preview", json={"url": "https://google.com"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is False
        assert isinstance(data.get("error"), str)
        assert "TeraBox" in data["error"] or "terabox" in data["error"].lower()

    def test_preview_dead_terabox_url_no_crash(self, client):
        r = client.post(
            f"{API}/preview",
            json={"url": "https://terabox.com/s/1invalidLink000"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is False
        assert isinstance(data.get("error"), str) and len(data["error"]) > 0

    @pytest.mark.parametrize("endpoint", ["watch", "download", "folder"])
    def test_alias_endpoints_shape(self, client, endpoint):
        r = client.post(
            f"{API}/{endpoint}",
            json={"url": "https://notterabox.example.com/foo"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is False
        assert isinstance(data.get("error"), str) and data["error"]

    def test_preview_missing_url_field(self, client):
        r = client.post(f"{API}/preview", json={}, timeout=10)
        # Pydantic validation -> 422
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Stream
# ---------------------------------------------------------------------------


class TestStream:
    def test_stream_missing_url(self, client):
        r = client.get(f"{API}/stream", timeout=10)
        # FastAPI missing required query -> 422
        assert r.status_code in (400, 422)

    def test_stream_malformed_url(self, client):
        r = client.get(f"{API}/stream", params={"url": "not-a-url"}, timeout=10)
        assert r.status_code == 400

    def test_stream_invalid_upstream(self, client):
        # A valid-looking but unresolvable URL should return 502 or an error, never 500 crash
        r = client.get(
            f"{API}/stream",
            params={"url": "https://this-domain-does-not-exist-xyz-987654.example/foo.mp4"},
            timeout=30,
            allow_redirects=False,
        )
        assert r.status_code in (400, 502, 504), r.status_code


# ---------------------------------------------------------------------------
# History CRUD (with persistence check)
# ---------------------------------------------------------------------------


class TestHistory:
    def test_history_create_get_delete_flow(self, client, session_id):
        # CREATE
        payload = {
            "session_id": session_id,
            "url": "https://terabox.com/s/1TEST_hist_001",
            "title": "TEST History Item",
            "thumbnail": "https://picsum.photos/200",
            "size_str": "42.0 MB",
            "file_type": "video",
        }
        r = client.post(f"{API}/history", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["session_id"] == session_id
        assert created["url"] == payload["url"]
        assert created["title"] == "TEST History Item"
        assert "id" in created and isinstance(created["id"], str)
        hist_id = created["id"]

        # GET - persistence across HTTP calls
        r = client.get(f"{API}/history", params={"session_id": session_id}, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert any(it["id"] == hist_id for it in items)

        # DELETE single
        r = client.delete(
            f"{API}/history/{hist_id}", params={"session_id": session_id}, timeout=15
        )
        assert r.status_code == 200
        assert r.json().get("deleted") == 1

        # Verify removal
        r = client.get(f"{API}/history", params={"session_id": session_id}, timeout=15)
        assert not any(it["id"] == hist_id for it in r.json())

    def test_history_clear_all(self, client, session_id):
        # Add 2 items
        for i in range(2):
            client.post(
                f"{API}/history",
                json={
                    "session_id": session_id,
                    "url": f"https://terabox.com/s/1TEST_clear_{i}",
                    "title": f"TEST clear {i}",
                },
                timeout=15,
            )
        r = client.delete(f"{API}/history", params={"session_id": session_id}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("deleted") >= 2

        r = client.get(f"{API}/history", params={"session_id": session_id}, timeout=15)
        assert r.json() == []


# ---------------------------------------------------------------------------
# Favorites CRUD (idempotent)
# ---------------------------------------------------------------------------


class TestFavorites:
    def test_favorites_flow_idempotent(self, client, session_id):
        payload = {
            "session_id": session_id,
            "url": "https://terabox.com/s/1TEST_fav_001",
            "title": "TEST Favorite Item",
        }
        r1 = client.post(f"{API}/favorites", json=payload, timeout=15)
        assert r1.status_code == 200
        first = r1.json()

        # Idempotency: posting same session_id+url should return same entry
        r2 = client.post(f"{API}/favorites", json=payload, timeout=15)
        assert r2.status_code == 200
        second = r2.json()
        assert first["id"] == second["id"], "Favorites must be idempotent"

        # GET
        r = client.get(f"{API}/favorites", params={"session_id": session_id}, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert any(it["id"] == first["id"] for it in items)
        assert sum(1 for it in items if it["url"] == payload["url"]) == 1

        # DELETE
        r = client.delete(
            f"{API}/favorites/{first['id']}",
            params={"session_id": session_id},
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json().get("deleted") == 1


# ---------------------------------------------------------------------------
# Rate limit sanity: rapid calls must not 500
# ---------------------------------------------------------------------------


class TestRateLimit:
    def test_rapid_calls_no_500(self, client):
        statuses = []
        for _ in range(15):
            r = client.get(f"{API}/health", timeout=10)
            statuses.append(r.status_code)
        # Health has no rate limit, but ensure no 5xx anywhere
        assert all(s < 500 for s in statuses), statuses
