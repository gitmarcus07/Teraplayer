"""TeraPlayer iteration 3 – bug fix verification for password heuristic.

Covers:
 - BUG#1: Non-TeraBox / dead-link URLs must NOT falsely trigger password_required
 - BUG#2: password_incorrect is present in every response schema
 - BUG#3: Bare 'pwd' substring in extractor error must NOT be interpreted as password
 - Consistency across /api/preview, /api/watch, /api/download, /api/folder
 - URL sanitization: inline "Password:xxx" and "pwd=xxx" parsed by parse_share_input
 - Unit-level: extractors._is_password_error + resolve_terabox with monkeypatched hnn
"""
from __future__ import annotations

import asyncio
import os
import sys
import pytest
import requests

# Make backend importable (supports both Docker and local paths)
_backend_path = os.path.join(os.path.dirname(__file__), "..")
if os.path.exists(_backend_path):
    sys.path.insert(0, _backend_path)
else:
    sys.path.insert(0, "/app/backend")

from services import extractors, terabox  # noqa: E402
from services.extractors import PasswordError, _is_password_error, resolve_terabox  # noqa: E402
from services.terabox import parse_share_input  # noqa: E402

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

if not BASE_URL:
    BASE_URL = ""
API = f"{BASE_URL}/api"
_API_ENABLED = bool(BASE_URL)


# ---------------------------------------------------------------------------
# Unit tests: parse_share_input
# ---------------------------------------------------------------------------


class TestParseShareInput:
    def test_plain_url(self):
        u, p = parse_share_input("https://terabox.com/s/1abc")
        assert u == "https://terabox.com/s/1abc"
        assert p == ""

    def test_password_colon(self):
        u, p = parse_share_input("https://terabox.com/s/1abc Password:xyz")
        assert u == "https://terabox.com/s/1abc"
        assert p == "xyz"

    def test_password_case_insensitive(self):
        u, p = parse_share_input("https://terabox.com/s/1abc password: hello")
        assert u == "https://terabox.com/s/1abc"
        assert p == "hello"

    def test_pwd_equals(self):
        u, p = parse_share_input("https://terabox.com/s/1abc pwd=hello")
        assert u == "https://terabox.com/s/1abc"
        assert p == "hello"

    def test_pipe_password(self):
        u, p = parse_share_input("https://terabox.com/s/1abc|mypwd")
        assert u == "https://terabox.com/s/1abc"
        assert p == "mypwd"

    def test_pass_keyword(self):
        u, p = parse_share_input("https://terabox.com/s/1abc pass 12345")
        assert u == "https://terabox.com/s/1abc"
        assert p == "12345"


# ---------------------------------------------------------------------------
# Unit tests: _is_password_error heuristic
# ---------------------------------------------------------------------------


class TestPasswordErrorDetection:
    def test_errno_minus_9_triggers(self):
        assert _is_password_error({"errno": -9}) is True

    def test_errno_105_triggers(self):
        # 105 is AMBIGUOUS (also returned for dead links): needs password text.
        assert _is_password_error({"errno": 105}) is False
        assert _is_password_error({"errno": 105, "errmsg": "wrong password"}) is True

    def test_string_wrong_password_triggers(self):
        assert _is_password_error("wrong password") is True

    def test_string_incorrect_password_triggers(self):
        assert _is_password_error({"errmsg": "incorrect password"}) is True

    def test_bare_pwd_does_not_trigger(self):
        # Previously, any dict containing 'pwd' as a key would trigger.
        # New heuristic must ONLY flag known phrases / errnos.
        assert _is_password_error({"errno": 0, "pwd": ""}) is False

    def test_bare_password_key_does_not_trigger(self):
        assert _is_password_error({"errno": 0, "password": ""}) is False

    def test_generic_error_does_not_trigger(self):
        assert _is_password_error({"errno": -1, "errmsg": "share link expired"}) is False

    def test_random_dict_does_not_trigger(self):
        assert _is_password_error({"errno": -6, "info": "link not found"}) is False


# ---------------------------------------------------------------------------
# Unit tests: orchestrator resolve_terabox with monkeypatched extractors
# ---------------------------------------------------------------------------


def _make_stub(exc):
    async def _stub(url, client, password=""):
        raise exc
    return _stub


class TestResolveOrchestrator:
    def test_password_error_no_password_sent(self, monkeypatch):
        """When PasswordError raised and no password provided:
        password_required=True, password_incorrect=False."""
        monkeypatch.setattr(extractors, "_extract_via_hnn", _make_stub(PasswordError("hnn: {errno:-9}")))
        # Also stub other extractors to raise generic errors so orchestrator lands on password state
        monkeypatch.setattr(extractors, "_extract_via_teradl", _make_stub(ValueError("teradl down")))
        monkeypatch.setattr(extractors, "_extract_via_wdzone", _make_stub(ValueError("wdzone down")))
        # Rebuild EXTRACTORS list to pick up patched refs
        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("hnn", extractors._extract_via_hnn),
            ("teradl", extractors._extract_via_teradl),
            ("wdzone", extractors._extract_via_wdzone),
        ])
        result = asyncio.run(resolve_terabox("https://terabox.com/s/1abc", password=""))
        assert result["ok"] is False
        assert result["password_required"] is True
        assert result["password_incorrect"] is False

    def test_password_error_with_password_sent(self, monkeypatch):
        """When PasswordError raised AND password was passed:
        password_required=True, password_incorrect=True."""
        monkeypatch.setattr(extractors, "_extract_via_hnn", _make_stub(PasswordError("hnn: {errno:-9}")))
        monkeypatch.setattr(extractors, "_extract_via_teradl", _make_stub(ValueError("teradl down")))
        monkeypatch.setattr(extractors, "_extract_via_wdzone", _make_stub(ValueError("wdzone down")))
        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("hnn", extractors._extract_via_hnn),
            ("teradl", extractors._extract_via_teradl),
            ("wdzone", extractors._extract_via_wdzone),
        ])
        result = asyncio.run(resolve_terabox("https://terabox.com/s/1abc", password="wrongpass"))
        assert result["ok"] is False
        assert result["password_required"] is True
        assert result["password_incorrect"] is True

    def test_generic_error_no_false_positive(self, monkeypatch):
        """When all extractors fail with generic (non-password) errors,
        password_required MUST be False even though the error string might
        contain the substring 'pwd' or 'password' via extractor JSON."""
        # Simulate an hnn response error whose ValueError text contains 'pwd'
        # as a JSON field key (this used to false-trigger the heuristic).
        monkeypatch.setattr(extractors, "_extract_via_hnn",
                            _make_stub(ValueError("hnn error: {'errno': -6, 'pwd': ''}")))
        monkeypatch.setattr(extractors, "_extract_via_teradl", _make_stub(ValueError("teradl empty response")))
        monkeypatch.setattr(extractors, "_extract_via_wdzone", _make_stub(ValueError("wdzone empty")))
        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("hnn", extractors._extract_via_hnn),
            ("teradl", extractors._extract_via_teradl),
            ("wdzone", extractors._extract_via_wdzone),
        ])
        result = asyncio.run(resolve_terabox("https://terabox.com/s/1abcdef0123456", password=""))
        assert result["ok"] is False
        assert result["password_required"] is False
        assert result["password_incorrect"] is False


# ---------------------------------------------------------------------------
# API integration tests – exercised through the running FastAPI service
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def http() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.mark.skipif(not _API_ENABLED, reason="REACT_APP_BACKEND_URL not set")
class TestPreviewNoFalsePasswordFlag:
    """BUG#1: garbage / dead / non-terabox URLs must NEVER trigger password_required."""

    def test_non_terabox_url(self, http):
        r = http.post(f"{API}/preview", json={"url": "https://google.com"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert d.get("password_required") is False
        assert d.get("password_incorrect") is False

    def test_invalid_share_short_link(self, http):
        r = http.post(
            f"{API}/preview",
            json={"url": "https://terabox.com/s/1invalidLink000"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        # Critical: even though extractors return errors mentioning 'pwd' in payloads,
        # the sanitized heuristic must NOT flag this.
        assert d.get("password_required") is False, f"False positive password_required: {d}"
        assert d.get("password_incorrect") is False

    def test_wellformed_dead_link(self, http):
        r = http.post(
            f"{API}/preview",
            json={"url": "https://terabox.com/s/1abcdef0123456"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert d.get("password_required") is False, f"False positive password_required: {d}"
        assert d.get("password_incorrect") is False


@pytest.mark.skipif(not _API_ENABLED, reason="REACT_APP_BACKEND_URL not set")
class TestResponseSchema:
    """BUG#2: PreviewResponse always has password_incorrect field."""

    @pytest.mark.parametrize("endpoint", ["preview", "watch", "download", "folder"])
    def test_password_incorrect_field_present(self, http, endpoint):
        r = http.post(f"{API}/{endpoint}", json={"url": "https://google.com"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "password_required" in d
        assert "password_incorrect" in d
        assert isinstance(d["password_required"], bool)
        assert isinstance(d["password_incorrect"], bool)


@pytest.mark.skipif(not _API_ENABLED, reason="REACT_APP_BACKEND_URL not set")
class TestUrlSanitizationAPI:
    """BONUS: inline password in URL text is parsed server-side."""

    def test_inline_password_colon(self, http):
        r = http.post(
            f"{API}/preview",
            json={"url": "https://terabox.com/s/1abc Password:xyz"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        # Link is dead – ok=false but must NOT crash and must NOT flag password_required
        assert d["ok"] is False
        assert d.get("password_required") is False
        assert d.get("password_incorrect") is False

    def test_inline_pwd_equals(self, http):
        r = http.post(
            f"{API}/preview",
            json={"url": "https://terabox.com/s/1abc pwd=hello"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert d.get("password_required") is False
        assert d.get("password_incorrect") is False
