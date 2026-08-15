"""Tests for the xAPIverse fallback extractor (services/xapiverse.py).

Covers:
- Missing API key: fail fast, never make a request
- Success: maps the xAPIverse payload into the normalized preview shape
- stream_url selection: prefers fast_stream_url["480p"], then "360p",
  then top-level stream_url
- normal_dlink is NEVER used as download_url or stream_url
- Non-success status, empty list, malformed JSON, invalid response type
- HTTP errors and timeouts become generic, URL/token-free errors
- Fallback chain position and graceful fall-through

All HTTP traffic is mocked — no real xAPIverse credits are consumed.
"""
from __future__ import annotations

import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services import extractors
from services import xapiverse
from services.extractors import resolve_terabox

API_URL = "https://xapiverse.com/api/terabox"

SAMPLE_SUCCESS = {
    "status": "success",
    "total_files": 1,
    "total_folders": 0,
    "list": [
        {
            "fs_id": "fs_123",
            "name": "My Movie (2024) 720p.mp4",
            "file_path": "/My Movie.mp4",
            "size": 1578481,
            "size_formatted": "1.51 MB",
            "type": "video",
            "is_dir": "0",
            "duration": "00:08",
            "quality": "480p",
            "normal_dlink": "https://dummy-dl.example.com/file.mp4?sign=SECRETTOKEN",
            "stream_url": "https://stream.example.com/hls/master.m3u8",
            "fast_stream_url": {
                "360p": "https://stream.example.com/hls/360p.m3u8?token=AAA",
                "480p": "https://stream.example.com/hls/480p.m3u8?token=BBB",
            },
            "subtitle_url": "https://subs.example.com/1.vtt",
            "thumbnail": "https://img.example.com/thumb.jpg",
            "folder": "root",
        }
    ],
}


def _resp(status, json_data=None, content=None):
    request = httpx.Request("POST", API_URL)
    if json_data is not None:
        return httpx.Response(status, json=json_data, request=request)
    return httpx.Response(status, content=content or b"", request=request)


def _make_client(post_result=None, post_raise=None):
    if post_raise is not None:
        mock_post = AsyncMock(side_effect=post_raise)
    else:
        mock_post = AsyncMock(return_value=post_result)
    return SimpleNamespace(post=mock_post)


def run_async(coro):
    import asyncio
    try:
        asyncio.get_running_loop()
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    except RuntimeError:
        return asyncio.run(coro)


class TestMissingApiKey:
    def test_raises_without_key_and_never_requests(self, monkeypatch):
        monkeypatch.setattr(xapiverse, "XAPIVERSE_API_KEY", "")
        client = _make_client(post_result=_resp(200, json_data=SAMPLE_SUCCESS))
        with pytest.raises(ValueError, match="not configured"):
            run_async(
                xapiverse.extract_via_xapiverse("https://terabox.com/s/1abc", client, "")
            )
        client.post.assert_not_called()

    def test_is_configured(self, monkeypatch):
        monkeypatch.setattr(xapiverse, "XAPIVERSE_API_KEY", "fake-key")
        assert xapiverse.is_configured() is True
        monkeypatch.setattr(xapiverse, "XAPIVERSE_API_KEY", "")
        assert xapiverse.is_configured() is False


class TestSuccessfulMapping:
    def _extract(self, monkeypatch, payload):
        monkeypatch.setattr(xapiverse, "XAPIVERSE_API_KEY", "test-api-key")
        client = _make_client(post_result=_resp(200, json_data=payload))
        result = run_async(
            xapiverse.extract_via_xapiverse("https://terabox.com/s/1abc", client, "")
        )
        return result, client

    def test_success_maps_to_preview_shape(self, monkeypatch):
        result, client = self._extract(monkeypatch, SAMPLE_SUCCESS)

        assert result["ok"] is True
        assert result["source"] == "xapiverse"
        assert result["title"] == "My Movie (2024) 720p.mp4"
        assert result["size"] == 1578481
        assert result["size_str"] == "1.51 MB"
        assert result["duration"] == 8
        assert result["resolution"] == "480p"
        assert result["thumbnail"] == "https://img.example.com/thumb.jpg"
        assert result["file_type"] == "video"

        # stream_url must prefer fast_stream_url["480p"]
        assert result["stream_url"] == "https://stream.example.com/hls/480p.m3u8?token=BBB"

        # normal_dlink must never be surfaced (errno=400141 "need verify")
        assert result["download_url"] is None

        files = result["files"]
        assert len(files) == 1
        assert files[0]["name"] == "My Movie (2024) 720p.mp4"
        assert files[0]["size"] == 1578481
        assert files[0]["size_str"] == "1.51 MB"
        assert files[0]["duration"] == 8
        assert files[0]["resolution"] == "480p"
        assert files[0]["thumbnail"] == "https://img.example.com/thumb.jpg"
        assert files[0]["file_type"] == "video"
        assert files[0]["download_url"] is None
        assert files[0]["stream_url"] == "https://stream.example.com/hls/480p.m3u8?token=BBB"

    def test_request_body_and_headers(self, monkeypatch):
        monkeypatch.setattr(xapiverse, "XAPIVERSE_API_KEY", "test-api-key")
        client = _make_client(post_result=_resp(200, json_data=SAMPLE_SUCCESS))
        run_async(
            xapiverse.extract_via_xapiverse("https://terabox.com/s/1abc", client, "")
        )
        kwargs = client.post.call_args.kwargs
        assert kwargs["json"] == {"url": "https://terabox.com/s/1abc"}
        assert kwargs["headers"]["xAPIverse-Key"] == "test-api-key"
        assert kwargs["headers"]["Content-Type"] == "application/json"
        assert kwargs["timeout"] == xapiverse.XAPIVERSE_TIMEOUT

    def test_falls_back_to_360p_when_no_480p(self, monkeypatch):
        payload = {
            "status": "success",
            "list": [
                {
                    "name": "a.mp4",
                    "size": 100,
                    "size_formatted": "100 B",
                    "type": "video",
                    "quality": "360p",
                    "fast_stream_url": {"360p": "https://stream.example.com/hls/360p.m3u8?token=AAA"},
                }
            ],
        }
        result, _ = self._extract(monkeypatch, payload)
        assert result["stream_url"] == "https://stream.example.com/hls/360p.m3u8?token=AAA"
        assert result["resolution"] == "360p"

    def test_falls_back_to_top_level_stream_url(self, monkeypatch):
        payload = {
            "status": "success",
            "list": [
                {
                    "name": "a.mp4",
                    "size": 100,
                    "size_formatted": "100 B",
                    "type": "video",
                    "quality": "720p",
                    "stream_url": "https://stream.example.com/hls/master.m3u8?token=CCC",
                }
            ],
        }
        result, _ = self._extract(monkeypatch, payload)
        assert result["stream_url"] == "https://stream.example.com/hls/master.m3u8?token=CCC"
        assert result["download_url"] is None

    def test_normal_dlink_alone_is_rejected(self, monkeypatch):
        payload = {
            "status": "success",
            "list": [
                {
                    "name": "a.mp4",
                    "size": 100,
                    "size_formatted": "100 B",
                    "type": "video",
                    "normal_dlink": "https://dummy-dl.example.com/file.mp4?sign=TOKEN",
                }
            ],
        }
        with pytest.raises(ValueError, match="no stream URL"):
            self._extract(monkeypatch, payload)

    def test_duration_parsing(self, monkeypatch):
        result, _ = self._extract(monkeypatch, {
            "status": "success",
            "list": [
                {
                    "name": "a.mp4",
                    "size": 100,
                    "size_formatted": "100 B",
                    "duration": "01:02:03",
                    "stream_url": "https://stream.example.com/hls/master.m3u8",
                }
            ],
        })
        assert result["duration"] == 3723

    def test_missing_optional_metadata_is_none(self, monkeypatch):
        result, _ = self._extract(monkeypatch, {
            "status": "success",
            "list": [
                {"name": "a", "size": 0, "stream_url": "https://stream.example.com/hls/master.m3u8"}
            ],
        })
        assert result["size"] is None
        assert result["size_str"] is None
        assert result["duration"] is None
        assert result["resolution"] is None
        assert result["thumbnail"] is None
        assert result["file_type"] is None
        assert result["download_url"] is None


class TestFailureHandling:
    def _assert_error(self, client, match, monkeypatch):
        monkeypatch.setattr(xapiverse, "XAPIVERSE_API_KEY", "test-api-key")
        with pytest.raises(ValueError, match=match):
            run_async(
                xapiverse.extract_via_xapiverse("https://terabox.com/s/1abc", client, "")
            )

    def test_non_success_status(self, monkeypatch):
        payload = {"status": "error", "message": "invalid share url"}
        self._assert_error(_make_client(post_result=_resp(200, json_data=payload)), "non-success", monkeypatch)

    def test_empty_list(self, monkeypatch):
        payload = {"status": "success", "total_files": 0, "list": []}
        self._assert_error(_make_client(post_result=_resp(200, json_data=payload)), "empty list", monkeypatch)

    def test_list_not_a_list(self, monkeypatch):
        payload = {"status": "success", "list": {"oops": 1}}
        self._assert_error(_make_client(post_result=_resp(200, json_data=payload)), "empty list", monkeypatch)

    def test_invalid_response_type(self, monkeypatch):
        self._assert_error(_make_client(post_result=_resp(200, json_data=["not", "a", "dict"])), "invalid response type", monkeypatch)

    def test_malformed_json(self, monkeypatch):
        self._assert_error(_make_client(post_result=_resp(200, content=b"not-json")), "malformed JSON", monkeypatch)

    def test_http_error(self, monkeypatch):
        self._assert_error(_make_client(post_result=_resp(500, content=b"{}")), r"HTTP 500", monkeypatch)

    def test_http_error_4xx(self, monkeypatch):
        self._assert_error(_make_client(post_result=_resp(401, content=b"{}")), r"HTTP 401", monkeypatch)

    def test_timeout(self, monkeypatch):
        exc = httpx.ReadTimeout("timed out")
        self._assert_error(_make_client(post_raise=exc), "request timed out", monkeypatch)

    def test_network_failure(self, monkeypatch):
        exc = httpx.ConnectError("connection refused")
        self._assert_error(_make_client(post_raise=exc), "request failed", monkeypatch)


class TestNoSensitiveLeaks:
    def test_error_messages_never_contain_urls_key_or_tokens(self, monkeypatch):
        monkeypatch.setattr(xapiverse, "XAPIVERSE_API_KEY", "super-secret-key-123")

        payloads = [
            ("non-success", _make_client(post_result=_resp(200, json_data={"status": "error"}))),
            ("empty list", _make_client(post_result=_resp(200, json_data={"status": "success", "list": []}))),
            ("HTTP 500", _make_client(post_result=_resp(500, content=b"{}"))),
            ("HTTP 401", _make_client(post_result=_resp(401, content=b"{}"))),
            ("timeout", _make_client(post_raise=httpx.ReadTimeout("timed out"))),
            ("network", _make_client(post_raise=httpx.ConnectError("refused"))),
        ]
        for _label, client in payloads:
            try:
                run_async(
                    xapiverse.extract_via_xapiverse(
                        "https://terabox.com/s/1supersecret", client, ""
                    )
                )
                raise AssertionError("expected ValueError")
            except ValueError as exc:
                msg = str(exc)
                assert "super-secret-key-123" not in msg
                assert "xapiverse.com" not in msg
                assert "https://" not in msg
                assert "1supersecret" not in msg


class TestFallbackChain:
    def test_xapiverse_position_in_chain(self):
        names = [name for name, _ in extractors.EXTRACTORS]
        # xAPIverse is the PRIMARY extractor (no personal cookie required)
        assert names[0] == "xapiverse"
        assert "playwright" in names
        assert "cf_worker" in names
        assert "hnn" in names
        assert "teradl" in names

    def test_chain_falls_through_to_xapiverse(self, monkeypatch):
        async def _cf_stub(url, client, password=""):
            raise ValueError("cf_worker: timeout")

        async def _xap_stub(url, client, password=""):
            return {
                "ok": True,
                "source": "xapiverse",
                "title": "from_xap.mp4",
                "download_url": None,
                "stream_url": "https://stream.example.com/hls/480p.m3u8",
                "file_type": "video",
                "files": [],
            }

        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("cf_worker", _cf_stub),
            ("xapiverse", _xap_stub),
        ])
        result = run_async(resolve_terabox("https://terabox.com/s/1abc"))
        assert result["ok"] is True
        assert result["source"] == "xapiverse"
        assert result["title"] == "from_xap.mp4"

    def test_missing_key_does_not_break_chain(self, monkeypatch):
        async def _xap_stub(url, client, password=""):
            raise ValueError("xapiverse: XAPIVERSE_API_KEY not configured")

        async def _hnn_stub(url, client, password=""):
            return {
                "ok": True,
                "source": "hnn",
                "title": "from_hnn.mp4",
                "download_url": "https://hnn-dl.example.com/v.mp4",
                "stream_url": "https://hnn-dl.example.com/v.mp4",
                "file_type": "video",
                "files": [],
            }

        monkeypatch.setattr(extractors, "EXTRACTORS", [
            ("xapiverse", _xap_stub),
            ("hnn", _hnn_stub),
        ])
        result = run_async(resolve_terabox("https://terabox.com/s/1abc"))
        assert result["ok"] is True
        assert result["source"] == "hnn"