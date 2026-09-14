"""Local API tests for additive self-API routes (shadow mode).

- POST /api/terabox -> xAPIverse-compatible JSON, no paid calls
- GET /api/terabox/health -> safe diagnostics
- GET /api/fast_stream?token=... -> 401 on bad token, never 500

Uses FastAPI TestClient with monkeypatched resolver (no network, no credits).
Existing /api/preview behaviour must stay untouched.
"""
from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient  # noqa: E402

import server  # noqa: E402
from services import terabox_self  # noqa: E402


FAKE_PREVIEW = {
    "ok": True,
    "source": "cf_worker",
    "title": "demo.mp4",
    "size": 100,
    "size_str": "100 B",
    "duration": 65,
    "resolution": "480p",
    "thumbnail": None,
    "download_url": "https://dl.example.com/demo.mp4",
    "stream_url": "https://stream.example.com/master.m3u8",
    "file_type": "video",
    "files": [
        {
            "name": "demo.mp4",
            "size": 100,
            "size_str": "100 B",
            "duration": 65,
            "resolution": "480p",
            "thumbnail": None,
            "download_url": "https://dl.example.com/demo.mp4",
            "stream_url": "https://stream.example.com/master.m3u8",
            "file_type": "video",
            "path": "/demo.mp4",
            "fs_id": "fs_1",
        }
    ],
}


@pytest.fixture(scope="module", autouse=True)
def _clean_load():
    server.db = None
    yield


@pytest.fixture(scope="module")
def client():
    return TestClient(server.app)


def _patch_resolver(monkeypatch, preview=None):
    async def _fake_preview(url, password=""):
        return dict(preview if preview is not None else FAKE_PREVIEW)

    monkeypatch.setattr(server, "get_preview", _fake_preview)


class TestSelfTeraboxEndpoint:
    def test_returns_xapiverse_compat_shape(self, client, monkeypatch):
        _patch_resolver(monkeypatch)
        r = client.post("/api/terabox", json={"url": "https://terabox.com/s/1abc"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "success"
        assert data["total_files"] == 1
        assert data["list"][0]["name"] == "demo.mp4"
        assert "fast_stream_url" in data["list"][0]

    def test_rejects_non_terabox_url_without_upstream(self, client):
        r = client.post("/api/terabox", json={"url": "https://google.com"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "error"

    def test_rejects_empty_url(self, client):
        r = client.post("/api/terabox", json={"url": ""})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "error"

    def test_password_shape_propagates(self, client, monkeypatch):
        _patch_resolver(monkeypatch, {"ok": False, "password_required": True, "password_incorrect": False, "files": []})
        r = client.post("/api/terabox", json={"url": "https://terabox.com/s/1abc"})
        assert r.status_code == 200, r.text
        assert r.json()["password_required"] is True


class TestSelfHealthEndpoint:
    def test_health_never_leaks_secrets(self, client):
        r = client.get("/api/terabox/health")
        assert r.status_code == 200, r.text
        body = r.text
        assert "ndus" not in body.lower()
        data = r.json()
        assert data["ok"] is True
        assert data["primary"] == "self"


class TestFastStreamEndpoint:
    def test_bad_token_is_401_not_500(self, client):
        r = client.get("/api/fast_stream", params={"token": "garbage"})
        assert r.status_code == 401, r.text

    def test_missing_token_is_401_or_422_not_500(self, client):
        r = client.get("/api/fast_stream")
        assert r.status_code in (401, 422), r.text
