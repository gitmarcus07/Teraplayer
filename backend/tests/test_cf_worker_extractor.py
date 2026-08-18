"""Tests for the self-hosted Cloudflare Worker extractor.

Covers:
- _extract_via_cf_worker with monkeypatched httpx responses
- Fallback chain: cf_worker is tried first, then hnn
- Graceful skip when TERABOX_WORKER_URL is unset
- Password error propagation

Note: teradl and savetube extractors are disabled because their upstream
APIs changed. The test assertions reflect only active extractors.
"""
from __future__ import annotations

import os
import sys
from unittest.mock import AsyncMock
from types import SimpleNamespace

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services import extractors
from services.extractors import PasswordError, resolve_terabox


class TestCfWorkerExtractor:
    def test_cf_worker_skipped_when_url_unset(self, monkeypatch):
        monkeypatch.setattr(extractors, "CF_WORKER_URL", "")
        with pytest.raises(ValueError, match="TERABOX_WORKER_URL not configured"):
            run_async(
                extractors._extract_via_cf_worker(
                    "https://terabox.com/s/1abc",
                    None,
                    "",
                )
            )

    def _make_client(self, response_data, status=200):
        resp = _make_resp(status, response_data)
        mock_post = AsyncMock(return_value=resp)
        return SimpleNamespace(post=mock_post)

    def test_cf_worker_success(self, monkeypatch):
        monkeypatch.setattr(extractors, "CF_WORKER_URL", "https://test-worker.workers.dev")

        mock_response = {
            "ok": True,
            "source": "cf_worker",
            "title": "test_video.mp4",
            "size": 1048576,
            "size_str": "1.0 MB",
            "download_url": "https://dl.example.com/video.mp4",
            "stream_url": "https://dl.example.com/video.mp4",
            "file_type": "video",
            "files": [
                {
                    "name": "test_video.mp4",
                    "size": 1048576,
                    "download_url": "https://dl.example.com/video.mp4",
                    "stream_url": "https://dl.example.com/video.mp4",
                    "file_type": "video",
                }
            ],
        }

        client = self._make_client(mock_response)
        result = run_async(
            extractors._extract_via_cf_worker(
                "https://terabox.com/s/1abc",
                client,
                "",
            )
        )
        assert result["ok"] is True
        assert result["source"] == "cf_worker"
        assert result["download_url"] == "https://dl.example.com/video.mp4"
        client.post.assert_called_once()
        call_kwargs = client.post.call_args.kwargs
        assert call_kwargs["json"]["url"] == "https://terabox.com/s/1abc"
        assert call_kwargs["json"]["password"] == ""

    def test_cf_worker_password_required(self, monkeypatch):
        monkeypatch.setattr(extractors, "CF_WORKER_URL", "https://test-worker.workers.dev")

        mock_response = {
            "ok": False,
            "source": "cf_worker",
            "error": "This link is password protected.",
            "password_required": True,
            "password_incorrect": False,
        }

        client = self._make_client(mock_response)
        with pytest.raises(PasswordError, match="password"):
            run_async(
                extractors._extract_via_cf_worker(
                    "https://terabox.com/s/1abc",
                    client,
                    "",
                )
            )

    def test_cf_worker_not_ok_raises_value_error(self, monkeypatch):
        monkeypatch.setattr(extractors, "CF_WORKER_URL", "https://test-worker.workers.dev")

        mock_response = {
            "ok": False,
            "source": "cf_worker",
            "error": "Could not fetch TeraBox share page",
        }

        client = self._make_client(mock_response)
        with pytest.raises(ValueError, match="cf_worker"):
            run_async(
                extractors._extract_via_cf_worker(
                    "https://terabox.com/s/1abc",
                    client,
                    "",
                )
            )

    def test_cf_worker_missing_dlink_raises_value_error(self, monkeypatch):
        monkeypatch.setattr(extractors, "CF_WORKER_URL", "https://test-worker.workers.dev")

        mock_response = {
            "ok": True,
            "source": "cf_worker",
            "title": "test.mp4",
        }

        client = self._make_client(mock_response)
        with pytest.raises(ValueError, match="no direct link"):
            run_async(
                extractors._extract_via_cf_worker(
                    "https://terabox.com/s/1abc",
                    client,
                    "",
                )
            )

    def test_cf_worker_passes_password(self, monkeypatch):
        monkeypatch.setattr(extractors, "CF_WORKER_URL", "https://test-worker.workers.dev")

        client = self._make_client({
            "ok": True,
            "download_url": "https://dl.example.com/v.mp4",
            "stream_url": "https://dl.example.com/v.mp4",
            "file_type": "video",
            "files": [],
        })
        result = run_async(
            extractors._extract_via_cf_worker(
                "https://terabox.com/s/1abc",
                client,
                "secret123",
            )
        )
        assert result["ok"] is True
        assert client.post.call_args.kwargs["json"]["password"] == "secret123"


class TestFallbackChain:
    def test_cf_worker_is_in_chain(self):
        names = [name for name, _ in extractors.EXTRACTORS]
        # xAPIverse is the primary extractor; playwright/cf_worker remain fallbacks
        assert names[0] == "xapiverse", f"Expected xapiverse first, got {names}"
        assert "cf_worker" in names
        assert "hnn" in names
        assert "teradl" in names
        assert "savetube" not in names, "savetube extractor is disabled — DNS no longer resolves"

    def test_falls_through_when_cf_worker_fails(self, monkeypatch):
        async def _cf_stub(url, client, password=""):
            raise ValueError("cf_worker: timeout")

        async def _hnn_stub(url, client, password=""):
            return {
                "ok": True,
                "source": "hnn",
                "title": "from_hnn.mp4",
                "download_url": "https://hnn-dl.example.com/video.mp4",
                "stream_url": "https://hnn-dl.example.com/video.mp4",
                "file_type": "video",
                "files": [],
            }

        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("cf_worker", _cf_stub),
            ("hnn", _hnn_stub),
        ])
        result = run_async(resolve_terabox("https://terabox.com/s/1abc"))
        assert result["ok"] is True
        assert result["source"] == "hnn"
        assert result["title"] == "from_hnn.mp4"

    def test_all_extractors_fail_returns_error(self, monkeypatch):
        async def _always_fail(url, client, password=""):
            raise ValueError("extractor failed")

        names = [n for n, _ in extractors.EXTRACTORS]
        monkeypatch.setattr(extractors, "EXTRACTORS", [(n, _always_fail) for n in names])

        result = run_async(resolve_terabox("https://terabox.com/s/1deadlink"))
        assert result["ok"] is False
        assert isinstance(result.get("error"), str)

    def test_password_error_propagated(self, monkeypatch):
        async def _cf_stub(url, client, password=""):
            raise PasswordError("password required")

        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("cf_worker", _cf_stub),
        ])
        result = run_async(resolve_terabox("https://terabox.com/s/1abc", password=""))
        assert result["ok"] is False
        assert result["password_required"] is True
        assert result["password_incorrect"] is False

    def test_password_incorrect_with_password(self, monkeypatch):
        async def _cf_stub(url, client, password=""):
            raise PasswordError("wrong password")

        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("cf_worker", _cf_stub),
        ])
        result = run_async(resolve_terabox("https://terabox.com/s/1abc", password="wrongpass"))
        assert result["ok"] is False
        assert result["password_required"] is True
        assert result["password_incorrect"] is True

    def test_password_required_survives_primary_extractor_failure(self, monkeypatch):
        """The primary (xapiverse) extractor signalling password protection must
        propagate to the final response even when every other extractor fails."""
        async def _xap_stub(url, client, password=""):
            raise PasswordError("xapiverse: password required")

        async def _hnn_stub(url, client, password=""):
            raise ValueError("hnn: 403 Forbidden")

        async def _teradl_stub(url, client, password=""):
            raise ValueError("teradl error: No files found")

        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("xapiverse", _xap_stub),
            ("hnn", _hnn_stub),
            ("teradl", _teradl_stub),
        ])
        result = run_async(resolve_terabox("https://terabox.com/s/1abc"))
        assert result["ok"] is False
        assert result["password_required"] is True
        assert result["password_incorrect"] is False
        assert "Password required" in result.get("title", "")


class TestTeradlPassword:
    def _client(self, payload):
        resp = _make_resp(200, payload)
        mock_get = AsyncMock(return_value=resp)
        return SimpleNamespace(get=mock_get)

    def test_status_error_with_password_phrase_raises_password_error(self, monkeypatch):
        client = self._client({"status": "error", "message": "This link is password protected. Enter the password."})
        with pytest.raises(PasswordError, match="password"):
            run_async(
                extractors._extract_via_teradl("https://terabox.com/s/1abc", client, "")
            )

    def test_status_error_without_password_phrase_raises_value_error(self, monkeypatch):
        client = self._client({"status": "error", "message": "No files found"})
        with pytest.raises(ValueError, match="teradl error"):
            run_async(
                extractors._extract_via_teradl("https://terabox.com/s/1abc", client, "")
            )


class TestCfWorkerPasswordSignalFallback:
    def test_worker_password_phrase_without_flag_raises_password_error(self, monkeypatch):
        """Older worker responses may omit password_required but still carry a
        definitive password phrase — treat them as password protection."""
        monkeypatch.setattr(extractors, "CF_WORKER_URL", "https://test-worker.workers.dev")
        resp = _make_resp(200, {"ok": False, "error": "This link is password protected."})
        mock_post = AsyncMock(return_value=resp)
        with pytest.raises(PasswordError, match="password"):
            run_async(
                extractors._extract_via_cf_worker(
                    "https://terabox.com/s/1abc",
                    SimpleNamespace(post=mock_post),
                    "",
                )
            )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_resp(status, json_data):
    class MockResp:
        status_code = status
        def raise_for_status(self):
            pass
        def json(self):
            return json_data
    return MockResp()


def run_async(coro):
    import asyncio
    try:
        asyncio.get_running_loop()
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    except RuntimeError:
        return asyncio.run(coro)
