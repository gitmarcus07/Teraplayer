"""Native TeraPlayer authentication tests.

Covers the bcrypt-backed signup/login/me/logout flows end-to-end against a
running backend server. Uses unique uuid-prefixed emails so tests are
parallel-safe under pytest-xdist.
"""
from __future__ import annotations

import os
import uuid

import pytest
import requests
from pymongo import MongoClient
from unittest.mock import patch

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    _candidates = [
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

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Set env vars before importing server module for in-process Google auth tests
os.environ.setdefault("MONGO_URL", MONGO_URL)
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")

# In-process test client for Google auth tests (requires mock patching in same process)
from starlette.testclient import TestClient as _StarletteTestClient
import server as _server_module
_ASGI_APP = _server_module.app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def client() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def asgi_client():
    """In-process ASGI test client for Google auth tests (supports mock patching)."""
    with _StarletteTestClient(_ASGI_APP) as c:
        yield c


@pytest.fixture
def unique_email():
    return f"nat_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture
def mongo():
    mc = MongoClient(MONGO_URL)
    db = mc[DB_NAME]
    yield db
    mc.close()


@pytest.fixture
def cleanup_user(mongo):
    """Track registered test users so they are removed after each test."""
    emails = []
    yield emails
    for email in emails:
        user = mongo.users.find_one({"email": email}, {"_id": 0, "user_id": 1})
        if user:
            mongo.users.delete_one({"user_id": user["user_id"]})
            mongo.user_sessions.delete_many({"user_id": user["user_id"]})


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_backend_online(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------------------------------------------------------------------------
# Signup
# ---------------------------------------------------------------------------


class TestSignup:
    def test_signup_success(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        payload = {
            "email": unique_email,
            "password": "SecurePass123!",
            "name": "Test User",
        }
        r = client.post(f"{API}/auth/signup", json=payload, timeout=30)
        assert r.status_code == 200, r.text

        data = r.json()
        assert "user" in data
        assert "session_token" in data
        assert data["user"]["email"] == unique_email.lower()
        assert data["user"]["name"] == "Test User"
        assert "password_hash" not in data["user"]
        assert len(data["session_token"]) > 10

        # Cookie should be set
        assert "session_token" in r.cookies or "Set-Cookie" in r.headers

    def test_signup_without_name(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        payload = {
            "email": unique_email,
            "password": "SecurePass123!",
        }
        r = client.post(f"{API}/auth/signup", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["user"]["email"] == unique_email.lower()

    def test_signup_duplicate_email(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        payload = {
            "email": unique_email,
            "password": "SecurePass123!",
            "name": "Test User",
        }
        r1 = client.post(f"{API}/auth/signup", json=payload, timeout=30)
        assert r1.status_code == 200, r1.text

        # Same email again — different case should also be rejected
        payload2 = {
            "email": unique_email.upper(),
            "password": "AnotherPass456!",
        }
        r2 = client.post(f"{API}/auth/signup", json=payload2, timeout=30)
        assert r2.status_code == 409, r2.text
        assert "already" in r2.json().get("detail", "").lower()

    def test_signup_missing_email(self, client):
        r = client.post(
            f"{API}/auth/signup",
            json={"password": "SecurePass123!"},
            timeout=30,
        )
        assert r.status_code in (400, 422)

    def test_signup_weak_payload(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        r = client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": ""},
            timeout=30,
        )
        assert r.status_code in (400, 422)


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


class TestLogin:
    def test_login_success(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        password = "MySecret123!"
        signup_r = client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": password, "name": "Login Test"},
            timeout=30,
        )
        assert signup_r.status_code == 200, signup_r.text

        login_r = client.post(
            f"{API}/auth/login",
            json={"email": unique_email, "password": password},
            timeout=30,
        )
        assert login_r.status_code == 200, login_r.text
        data = login_r.json()
        assert data["user"]["email"] == unique_email.lower()
        assert "session_token" in data
        assert data["session_token"] != signup_r.json()["session_token"]

    def test_login_wrong_password(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        password = "CorrectPassword123!"
        client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": password, "name": "Login Fail"},
            timeout=30,
        )

        r = client.post(
            f"{API}/auth/login",
            json={"email": unique_email, "password": "WrongPassword!"},
            timeout=30,
        )
        assert r.status_code == 401, r.text
        assert "invalid" in r.json().get("detail", "").lower()

    def test_login_nonexistent_email(self, client):
        r = client.post(
            f"{API}/auth/login",
            json={"email": f"no_such_user_{uuid.uuid4().hex[:6]}@example.com", "password": "whatever"},
            timeout=30,
        )
        assert r.status_code == 401, r.text

    def test_login_email_case_insensitive(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        password = "CaseInsensitive123!"
        client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": password, "name": "Case Test"},
            timeout=30,
        )
        r = client.post(
            f"{API}/auth/login",
            json={"email": unique_email.upper(), "password": password},
            timeout=30,
        )
        assert r.status_code == 200, r.text


# ---------------------------------------------------------------------------
# /auth/me — session introspection
# ---------------------------------------------------------------------------


class TestAuthMe:
    def test_me_without_session_returns_401(self, client):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_with_invalid_bearer_returns_401(self):
        r = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": "Bearer fake-invalid-token-xyz"},
            timeout=10,
        )
        assert r.status_code == 401

    def test_me_with_valid_token(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        password = "ValidToken123!"
        signup_r = client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": password, "name": "Me Test"},
            timeout=30,
        )
        token = signup_r.json()["session_token"]

        r = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Me Test"
        assert "password_hash" not in data


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------


class TestLogout:
    def test_logout_invalidates_session(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        password = "LogoutTest123!"
        signup_r = client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": password, "name": "Logout Test"},
            timeout=30,
        )
        token = signup_r.json()["session_token"]

        # Before logout: /auth/me works
        r_before = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r_before.status_code == 200

        # Logout
        r_logout = requests.post(
            f"{API}/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r_logout.status_code == 200, r_logout.text
        assert r_logout.json().get("ok") is True

        # After logout: /auth/me returns 401
        r_after = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r_after.status_code == 401

    def test_logout_without_session_is_ok(self):
        r = requests.post(f"{API}/auth/logout", timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------------------------------------------------------------------------
# Session persistence across requests
# ---------------------------------------------------------------------------


class TestSessionPersistence:
    def test_session_survives_across_requests(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        password = "Persistence123!"
        signup_r = client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": password, "name": "Persist"},
            timeout=30,
        )
        token = signup_r.json()["session_token"]

        # Multiple sequential calls with same token
        for _ in range(3):
            r = requests.get(
                f"{API}/auth/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            assert r.status_code == 200, r.text
            assert r.json()["email"] == unique_email.lower()

    def test_token_format_is_url_safe(self, client, unique_email, cleanup_user):
        cleanup_user.append(unique_email)
        r = client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": "TokenFormat123!", "name": "Format"},
            timeout=30,
        )
        token = r.json()["session_token"]
        # token should be URL-safe (no weird chars) and reasonably long
        assert len(token) >= 20
        assert "/" not in token or token.count("/") < 5


# ---------------------------------------------------------------------------
# Anonymous usage (no auth, session_id-based)
# ---------------------------------------------------------------------------


class TestAnonymousUsage:
    def test_history_without_auth(self, client):
        """Anonymous users can still use history via session_id."""
        session_id = f"ANON_{uuid.uuid4().hex[:10]}"
        payload = {
            "session_id": session_id,
            "url": "https://terabox.com/s/1anon_test_history",
            "title": "Anonymous History Item",
        }
        r = client.post(f"{API}/history", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["session_id"] == session_id
        assert created["url"] == payload["url"]

        r_get = client.get(
            f"{API}/history",
            params={"session_id": session_id},
            timeout=15,
        )
        assert r_get.status_code == 200
        items = r_get.json()
        assert any(it["url"] == payload["url"] for it in items)

        # Cleanup
        client.delete(
            f"{API}/history",
            params={"session_id": session_id},
            timeout=15,
        )

    def test_history_with_invalid_bearer_falls_back_to_session(self, client):
        """A bogus Bearer token should not crash — falls back to anonymous session."""
        session_id = f"ANON_BAD_{uuid.uuid4().hex[:10]}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer totally-bogus-token-999",
        }
        payload = {
            "session_id": session_id,
            "url": "https://terabox.com/s/1anon_bad_token",
            "title": "Bad Token Hist",
        }
        r = requests.post(f"{API}/history", json=payload, headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["session_id"] == session_id

        # Cleanup
        requests.delete(
            f"{API}/history",
            params={"session_id": session_id},
            timeout=15,
        )

    def test_favorites_without_auth(self, client):
        """Anonymous users can still save favorites via session_id."""
        session_id = f"ANON_FAV_{uuid.uuid4().hex[:10]}"
        payload = {
            "session_id": session_id,
            "url": "https://terabox.com/s/1anon_test_favorite",
            "title": "Anonymous Favorite",
        }
        r = client.post(f"{API}/favorites", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["session_id"] == session_id

        r_get = client.get(
            f"{API}/favorites",
            params={"session_id": session_id},
            timeout=15,
        )
        assert r_get.status_code == 200
        assert any(it["url"] == payload["url"] for it in r_get.json())

        # Cleanup
        client.delete(
            f"{API}/favorites/{created['id']}",
            params={"session_id": session_id},
            timeout=15,
        )

    def test_preview_works_without_auth(self, client):
        """Anonymous users can still extract TeraBox links."""
        r = client.post(
            f"{API}/preview",
            json={"url": "https://google.com"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is False
        assert isinstance(data.get("error"), str)


# ---------------------------------------------------------------------------
# Password hashing verification (direct DB check)
# ---------------------------------------------------------------------------


class TestPasswordHashing:
    def test_password_is_hashed_in_db(self, client, unique_email, cleanup_user, mongo):
        cleanup_user.append(unique_email)
        r = client.post(
            f"{API}/auth/signup",
            json={"email": unique_email, "password": "PlainText123!", "name": "Hash Check"},
            timeout=30,
        )
        assert r.status_code == 200, r.text

        user_doc = mongo.users.find_one({"email": unique_email}, {"_id": 0})
        assert user_doc is not None
        stored_hash = user_doc.get("password_hash", "")
        # Must NOT be plaintext
        assert stored_hash != "PlainText123!"
        # bcrypt hashes start with $2b$ or $2a$
        assert stored_hash.startswith("$2"), f"Hash should be bcrypt: {stored_hash[:10]}"
        # Must NOT contain the plaintext password
        assert "PlainText123!" not in stored_hash


# ---------------------------------------------------------------------------
# Google authentication (mocked token verification)
# ---------------------------------------------------------------------------


def _google_info(sub="google_sub_12345", email=None, name="Google User", picture="https://lh3.googleusercontent.com/u/0/photo.jpg"):
    """Build a fake Google ID token claims dict matching what verify_oauth2_token returns."""
    return {
        "sub": sub,
        "email": email or f"google_{uuid.uuid4().hex[:8]}@gmail.com",
        "email_verified": True,
        "name": name,
        "picture": picture,
        "iss": "https://accounts.google.com",
        "aud": "test-google-client-id",
        "exp": 9999999999,
        "iat": 1000000000,
    }


class TestGoogleAuth:
    def test_google_signup_new_user(self, asgi_client, cleanup_user, mongo):
        """A new Google user is created with google_id and auth_provider."""
        email = f"google_{uuid.uuid4().hex[:8]}@gmail.com"
        cleanup_user.append(email)
        info = _google_info(email=email)

        with patch("services.auth.verify_google_token", return_value=info):
            r = asgi_client.post(
                "/api/auth/google",
                json={"credential": "fake-google-credential"},
                timeout=30,
            )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"] == email
        assert data["user"]["name"] == "Google User"
        assert data["user"].get("google_id") == info["sub"]
        assert "password_hash" not in data["user"]
        assert len(data["session_token"]) > 10

        # Verify in DB that the user was created correctly
        user_doc = mongo.users.find_one({"email": email}, {"_id": 0})
        assert user_doc["google_id"] == info["sub"]
        assert user_doc["auth_provider"] == "google"
        assert "password_hash" not in user_doc

    def test_google_login_existing_user(self, asgi_client, cleanup_user):
        """A Google user who already exists is logged in (not re-created)."""
        email = f"google_{uuid.uuid4().hex[:8]}@gmail.com"
        cleanup_user.append(email)
        info = _google_info(email=email)
        sub = info["sub"]

        # First login — creates the user
        with patch("services.auth.verify_google_token", return_value=info):
            r1 = asgi_client.post(
                "/api/auth/google",
                json={"credential": "fake-google-credential"},
                timeout=30,
            )
        assert r1.status_code == 200, r1.text
        token1 = r1.json()["session_token"]

        # Second login — should find existing user
        with patch("services.auth.verify_google_token", return_value=info):
            r2 = asgi_client.post(
                "/api/auth/google",
                json={"credential": "fake-google-credential"},
                timeout=30,
            )
        assert r2.status_code == 200, r2.text
        token2 = r2.json()["session_token"]
        assert token2 != token1, "New login should create a new session token"
        assert r2.json()["user"]["google_id"] == sub

    def test_google_invalid_token_rejected(self, asgi_client):
        """An invalid Google token returns 401."""
        with patch("services.auth.verify_google_token", side_effect=ValueError("Invalid token")):
            r = asgi_client.post(
                "/api/auth/google",
                json={"credential": "invalid-credential"},
                timeout=30,
            )
        assert r.status_code == 401, r.text
        assert "Invalid" in r.json().get("detail", "")

    def test_google_expired_token_rejected(self, asgi_client):
        """An expired Google token returns 401."""
        with patch("services.auth.verify_google_token", side_effect=ValueError("Token expired")):
            r = asgi_client.post(
                "/api/auth/google",
                json={"credential": "expired-credential"},
                timeout=30,
            )
        assert r.status_code == 401, r.text

    def test_google_wrong_audience_rejected(self, asgi_client):
        """A token with wrong audience is rejected by verification."""
        with patch("services.auth.verify_google_token", side_effect=ValueError("Wrong audience")):
            r = asgi_client.post(
                "/api/auth/google",
                json={"credential": "wrong-audience-credential"},
                timeout=30,
            )
        assert r.status_code == 401, r.text

    def test_google_email_conflict_with_local_account(self, asgi_client, unique_email, cleanup_user):
        """Google login with an email that matches a local/password account returns 409."""
        cleanup_user.append(unique_email)
        # Create a local account first (via in-process client)
        local_r = asgi_client.post(
            "/api/auth/signup",
            json={"email": unique_email, "password": "LocalPass123!", "name": "Local User"},
            timeout=30,
        )
        assert local_r.status_code == 200, local_r.text

        # Now try Google login with same email
        info = _google_info(email=unique_email)
        with patch("services.auth.verify_google_token", return_value=info):
            r = asgi_client.post(
                "/api/auth/google",
                json={"credential": "fake-google-credential"},
                timeout=30,
            )
        assert r.status_code == 409, r.text
        assert "already exists" in r.json().get("detail", "").lower()

    def test_google_user_receives_session(self, asgi_client, cleanup_user):
        """A Google-authenticated user gets a normal session and /auth/me works."""
        email = f"google_{uuid.uuid4().hex[:8]}@gmail.com"
        cleanup_user.append(email)
        info = _google_info(email=email)

        with patch("services.auth.verify_google_token", return_value=info):
            r = asgi_client.post(
                "/api/auth/google",
                json={"credential": "fake-google-credential"},
                timeout=30,
            )
        assert r.status_code == 200, r.text
        token = r.json()["session_token"]

        # /auth/me should work with the token (via asgi_client to use same mocked context)
        r_me = asgi_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r_me.status_code == 200, r_me.text
        me_data = r_me.json()
        assert me_data["email"] == email
        assert me_data["google_id"] == info["sub"]

    def test_google_logout_invalidates_session(self, asgi_client, cleanup_user):
        """Logout invalidates a Google-created session."""
        email = f"google_{uuid.uuid4().hex[:8]}@gmail.com"
        cleanup_user.append(email)
        info = _google_info(email=email)

        with patch("services.auth.verify_google_token", return_value=info):
            r = asgi_client.post(
                "/api/auth/google",
                json={"credential": "fake-google-credential"},
                timeout=30,
            )
        token = r.json()["session_token"]

        # Before logout: /auth/me works
        r_before = asgi_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r_before.status_code == 200

        # Logout
        r_logout = asgi_client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r_logout.status_code == 200

        # After logout: /auth/me returns 401
        r_after = asgi_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r_after.status_code == 401
