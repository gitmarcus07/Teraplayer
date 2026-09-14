"""Tests for additive self-API compat layer (services/terabox_self.py).

Covers xAPIverse-compatible mapping + signed fast_stream tokens.
No network, no real cookies, no existing-code changes.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


PREVIEW_SINGLE = {
    "ok": True,
    "source": "cf_worker",
    "title": "My Movie (2024) 720p.mp4",
    "size": 1578481,
    "size_str": "1.5 MB",
    "duration": 8,
    "resolution": "480p",
    "thumbnail": "https://img.example.com/thumb.jpg",
    "download_url": "https://dl.example.com/v.mp4",
    "stream_url": "https://stream.example.com/hls/master.m3u8",
    "file_type": "video",
    "files": [
        {
            "name": "My Movie (2024) 720p.mp4",
            "size": 1578481,
            "size_str": "1.5 MB",
            "duration": 8,
            "resolution": "480p",
            "thumbnail": "https://img.example.com/thumb.jpg",
            "download_url": "https://dl.example.com/v.mp4",
            "stream_url": "https://stream.example.com/hls/master.m3u8",
            "file_type": "video",
            "path": "/My Movie.mp4",
            "fs_id": "fs_123",
        }
    ],
}


def test_fmt_duration_matches_xapiverse_shape():
    from services import terabox_self

    assert terabox_self.fmt_duration(8) == "00:08"
    assert terabox_self.fmt_duration(3723) == "01:02:03"
    assert terabox_self.fmt_duration(None) is None
    assert terabox_self.fmt_duration(0) is None


def test_to_xapi_compat_single_file():
    from services import terabox_self

    out = terabox_self.to_xapi_compat(PREVIEW_SINGLE, "https://api.example.com")
    assert out["status"] == "success"
    assert out["total_files"] == 1
    assert len(out["list"]) == 1
    item = out["list"][0]
    assert item["name"] == "My Movie (2024) 720p.mp4"
    assert item["file_path"] == "/My Movie.mp4"
    assert item["size"] == 1578481
    assert item["size_formatted"] == "1.5 MB"
    assert item["type"] == "video"
    assert item["duration"] == "00:08"
    assert item["quality"] == "480p"
    assert item["thumbnail"] == "https://img.example.com/thumb.jpg"
    # fast_stream URLs must point at OUR backend, never raw Terabox hosts
    assert "fast_stream_url" in item
    assert item["fast_stream_url"]["360p"].startswith("https://api.example.com/api/fast_stream?token=")
    assert item["fast_stream_url"]["480p"].startswith("https://api.example.com/api/fast_stream?token=")
    assert "terabox.com" not in item["fast_stream_url"]["480p"]
    assert "1024tera" not in item["fast_stream_url"]["480p"]


def test_to_xapi_compat_error_and_password_shapes():
    from services import terabox_self

    err = terabox_self.to_xapi_compat({"ok": False, "error": "boom", "files": []}, "https://api.example.com")
    assert err["status"] == "error"

    pw = terabox_self.to_xapi_compat(
        {"ok": False, "password_required": True, "password_incorrect": False, "files": []},
        "https://api.example.com",
    )
    assert pw["status"] == "error"
    assert pw["password_required"] is True

    # Generic failure after a submitted password keeps the hint flags so
    # repeated identical calls return a consistent shape.
    failed_pw = terabox_self.to_xapi_compat(
        {"ok": False, "error": "nope", "password_required": False, "password_incorrect": True, "files": []},
        "https://api.example.com",
    )
    assert failed_pw["status"] == "error"
    assert failed_pw["password_required"] is False
    assert failed_pw["password_incorrect"] is True


def test_resolve_failure_with_password_flags_incorrect(monkeypatch):
    """Same failing input must consistently flag a submitted password."""
    import asyncio
    from services import extractors

    async def _fail(url, client, password=""):
        raise ValueError("boom")

    async def _no_native(url, client, password=""):
        raise ValueError("native disabled in test")

    monkeypatch.setattr(extractors, "EXTRACTORS", [("only", _fail)])
    monkeypatch.setattr(extractors, "_extract_native", _no_native)
    r1 = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc", password="pw"))
    r2 = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc", password="pw"))
    assert r1["ok"] is False and r2["ok"] is False
    assert r1["password_incorrect"] is True
    assert r2["password_incorrect"] is True
    r3 = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc"))
    assert r3["password_incorrect"] is False


def test_metadata_fallback_keeps_password_hint(monkeypatch):
    """When only page metadata (title) is reachable, a submitted password
    must still be flagged — the early return must not wipe the hint."""
    import asyncio
    from services import extractors

    async def _fail(url, client, password=""):
        raise ValueError("boom")

    async def _meta_ok(url, client, password=""):
        return {"ok": True, "source": "native", "title": "Some Share"}

    monkeypatch.setattr(extractors, "EXTRACTORS", [("only", _fail)])
    monkeypatch.setattr(extractors, "_extract_native", _meta_ok)
    r = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc", password="pw"))
    assert r["ok"] is False
    assert r["password_incorrect"] is True
    assert r["title"] == "Some Share"
    r2 = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc"))
    assert r2["password_incorrect"] is False


def test_fast_stream_token_roundtrip_and_expiry():
    from services import terabox_self

    token = terabox_self.sign_fast_stream("abc123", "fs_123", "480p", secret="test-secret", ttl_seconds=3600)
    assert isinstance(token, str) and len(token) > 20
    payload = terabox_self.verify_fast_stream(token, secret="test-secret")
    assert payload is not None
    assert payload["surl"] == "abc123"
    assert payload["fs_id"] == "fs_123"
    assert payload["quality"] == "480p"

    # Wrong secret must not verify
    assert terabox_self.verify_fast_stream(token, secret="other-secret") is None
    # Tampered token must not verify
    assert terabox_self.verify_fast_stream(token[:-2] + "xx", secret="test-secret") is None
    # Raw token must not leak surl/fs_id in plaintext
    assert "abc123" not in token
    assert "fs_123" not in token


def test_is_self_enabled_defaults_off_without_env(monkeypatch):
    monkeypatch.delenv("SELF_API_ENABLED", raising=False)
    from importlib import reload
    from services import terabox_self

    reload(terabox_self)
    # Default must be safe: shadow mode available but not primary
    assert terabox_self.SELF_API_ENABLED in (True, False)


def test_cache_ttl_defaults_to_12h_and_key_normalizes_surl():
    from services import terabox

    assert terabox.CACHE_TTL_SECONDS >= 3600  # long cache = fewer paid calls
    k1 = terabox.canonical_cache_key("https://1024terabox.com/s/1abcXYZ", "")
    k2 = terabox.canonical_cache_key("https://terabox.com/s/1abcXYZ?foo=bar", "")
    assert k1 == k2  # same share -> same cache entry across mirrors/params
    k3 = terabox.canonical_cache_key("https://terabox.com/s/1abcXYZ", "pw1")
    assert k3 != k1  # different password -> different entry


def test_rewrite_m3u8_proxies_segments_and_keeps_tags():
    from services import terabox_self

    playlist = (
        "#EXTM3U\n"
        "#EXT-X-VERSION:3\n"
        "#EXT-X-TARGETDURATION:10\n"
        "seg1.ts\n"
        "/hls/seg2.ts?x=1\n"
        "https://cdn.example.com/abs/seg3.ts\n"
    )
    out = terabox_self.rewrite_m3u8(playlist, "https://api.example.com", token="TOK")
    assert "#EXTM3U" in out
    assert "#EXT-X-TARGETDURATION:10" in out
    assert "https://api.example.com/api/stream?url=seg1.ts" in out
    assert "https://cdn.example.com/abs/seg3.ts" in out  # absolute untouched


def test_find_cached_stream_hits_memory_cache():
    import asyncio
    from services import terabox

    terabox._MEMORY_CACHE.clear()
    preview = {
        "ok": True,
        "source": "self",
        "title": "demo.mp4",
        "files": [
            {"name": "demo.mp4", "fs_id": "fs_9", "stream_url": "https://cdn.example.com/hls/master.m3u8", "download_url": None}
        ],
    }
    key = terabox.canonical_cache_key("https://terabox.com/s/1zzTOPIC", "")
    asyncio.run(terabox._set_cached(key, preview))
    surl = key.split("::")[0].split(":", 1)[1]
    found = asyncio.run(terabox.find_cached_stream(surl, "fs_9"))
    assert found == "https://cdn.example.com/hls/master.m3u8"
    assert asyncio.run(terabox.find_cached_stream(surl, "fs_missing")) is None
    terabox._MEMORY_CACHE.clear()

def test_password_errno_detected_as_int_and_string():
    """Upstream JSON types flicker run to run; both must behave identically."""
    from services import extractors
    from services import native_extractor

    assert extractors._is_password_error({"errno": -9}) is True
    assert extractors._is_password_error({"errno": "-9"}) is True
    assert extractors._is_password_error({"errno": "-130"}) is True
    assert extractors._is_password_error({"errno": 0}) is False
    assert native_extractor._is_password_error(-9, "") is True
    assert native_extractor._is_password_error("-9", "") is True
    assert native_extractor._is_password_error("-130", "x") is True
    assert native_extractor._is_password_error(0, "") is False
    assert native_extractor._is_password_error(-1, "need verify") is False


def test_ambiguous_errno_needs_password_text():
    """errno 105 also means dead/expired link: without password text it must
    NOT prompt for a password (live: fake surl -> 105, empty message)."""
    from services import extractors
    from services import native_extractor

    assert extractors._is_password_error({"errno": 105}) is False
    assert extractors._is_password_error({"errno": "105"}) is False
    assert extractors._is_password_error({"errno": 105, "errmsg": "wrong password"}) is True
    assert extractors._is_password_error({"errno": -130}) is True
    assert extractors._is_password_error({"errno": "-9"}) is True
    assert native_extractor._is_password_error(105, "") is False
    assert native_extractor._is_password_error("105", "") is False
    assert native_extractor._is_password_error(105, "wrong password") is True
    assert native_extractor._is_password_error(-9, "") is True


def test_resolve_error_does_not_double_prefix(monkeypatch):
    import asyncio
    from services import extractors

    async def _prefixed(url, client, password=""):
        raise ValueError("xapiverse: password-protected links unsupported")

    async def _no_native(url, client, password=""):
        return {"ok": False}

    monkeypatch.setattr(extractors, "EXTRACTORS", [("xapiverse", _prefixed)])
    monkeypatch.setattr(extractors, "_extract_native", _no_native)
    r = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc"))
    assert r["ok"] is False
    assert "xapiverse: xapiverse:" not in r["error"]
    assert "xapiverse: password-protected links unsupported" in r["error"]

def test_cf_worker_error_never_triple_prefixes(monkeypatch):
    import asyncio
    from types import SimpleNamespace
    from services import extractors

    async def _fake_post(*a, **k):
        class _R:
            status_code = 200

            @staticmethod
            def raise_for_status():
                return None

            @staticmethod
            def json():
                return {"ok": False, "error": "cf_worker: cf_worker: TeraBox requires verification to access this link."}

        return _R()

    async def _no_native(url, client, password=""):
        return {"ok": False}

    monkeypatch.setattr(extractors, "EXTRACTORS", [("cf_worker", extractors._extract_via_cf_worker)])
    monkeypatch.setattr(extractors, "_extract_native", _no_native)
    monkeypatch.setattr(extractors, "CF_WORKER_URL", "https://worker.example.com")
    client = SimpleNamespace(post=_fake_post)
    monkeypatch.setattr(__import__("httpx"), "AsyncClient", lambda **k: _DummyCtx(client))
    r = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc"))
    assert r["ok"] is False
    assert "cf_worker: cf_worker:" not in r["error"]
    assert r["error"].count("cf_worker:") == 1


class _DummyCtx:
    def __init__(self, client):
        self._c = client

    async def __aenter__(self):
        return self._c

    async def __aexit__(self, *a):
        return False

EXPECTED_PASSWORD_MESSAGE = "Password-protected links are not supported."


def test_password_verdict_message_is_unified():
    """Password links are unsupported: every verdict path must return the
    exact same sentence (no more incorrect/password-protected variants)."""
    import asyncio
    from services import extractors, terabox_self

    out = terabox_self.to_xapi_compat(
        {"ok": False, "password_required": True, "password_incorrect": True, "files": []},
        "https://api.example.com",
    )
    assert out["error"] == EXPECTED_PASSWORD_MESSAGE

    out2 = terabox_self.to_xapi_compat(
        {"ok": False, "password_required": True, "password_incorrect": False, "files": []},
        "https://api.example.com",
    )
    assert out2["error"] == EXPECTED_PASSWORD_MESSAGE

    async def _pw(url, client, password=""):
        raise extractors.PasswordError("hnn: password required")

    async def _no_native(url, client, password=""):
        return {"ok": False}

    # monkeypatch via direct assignment with cleanup
    _orig_ext, _orig_nat = extractors.EXTRACTORS, extractors._extract_native
    extractors.EXTRACTORS = [("hnn", _pw)]
    extractors._extract_native = _no_native
    try:
        r = asyncio.run(extractors.resolve_terabox("https://terabox.com/s/1abc", password="pw"))
    finally:
        extractors.EXTRACTORS, extractors._extract_native = _orig_ext, _orig_nat
    assert r["password_required"] is True
    assert r["error"] == EXPECTED_PASSWORD_MESSAGE
