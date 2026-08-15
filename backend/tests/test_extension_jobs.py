"""Tests for the browser-extension extraction bridge.

Covers services/extension_jobs.py and the /api/extension/* routes using the
in-memory job fallback (no MongoDB required). Does not hit the network.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import services.extension_jobs as jobs  # noqa: E402
from services.extension_jobs import (  # noqa: E402
    JobNotFoundError,
    InvalidTokenError,
    PreviewValidationError,
    MAX_FILES,
)

VALID_PREVIEW = {
    "ok": True,
    "source": "extension",
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


def run_async(coro):
    try:
        asyncio.get_running_loop()
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    except RuntimeError:
        return asyncio.run(coro)


@pytest.fixture(autouse=True)
def fresh_job_store(monkeypatch):
    """Reset the in-memory store and DB handle before each test."""
    jobs._MEMORY_JOBS.clear()
    monkeypatch.setattr(jobs, "_db", None)
    yield


class TestCreateJob:
    def test_create_returns_token_and_never_secret(self):
        result = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        assert result["job_id"].startswith("ext_")
        assert isinstance(result["submit_token"], str) and len(result["submit_token"]) == 64
        assert result["status"] == "pending"
        # HMAC secret must never leak into the public response
        assert jobs._hmac_secret() not in str(result)

    def test_create_canonicalizes_url(self):
        result = run_async(jobs.create_job("https://1024terabox.com/sharing/link?surl=abc123"))
        assert "terabox.com/sharing/link?surl=abc123" in result["terabox_url"]

    def test_token_verifies_for_its_job_only(self):
        a = run_async(jobs.create_job("https://terabox.com/s/1aaa"))
        b = run_async(jobs.create_job("https://terabox.com/s/1bbb"))
        assert jobs.verify_submit_token(a["job_id"], a["submit_token"]) is True
        assert jobs.verify_submit_token(b["job_id"], b["submit_token"]) is True
        # Cross-job tokens must not validate
        assert jobs.verify_submit_token(a["job_id"], b["submit_token"]) is False
        assert jobs.verify_submit_token(a["job_id"], "") is False


class TestSubmitJob:
    def test_submit_with_valid_token(self):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        result = run_async(jobs.submit_job(job["job_id"], job["submit_token"], VALID_PREVIEW))
        assert result["status"] == "done"
        assert result["preview"]["title"] == "test_video.mp4"

        fetched = run_async(jobs.get_job(job["job_id"]))
        assert fetched["status"] == "done"
        assert fetched["preview"]["ok"] is True

    def test_submit_rejects_invalid_token(self):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        with pytest.raises(InvalidTokenError):
            run_async(jobs.submit_job(job["job_id"], "deadbeef", VALID_PREVIEW))

    def test_submit_rejects_unknown_job(self):
        with pytest.raises(JobNotFoundError):
            run_async(jobs.submit_job("ext_doesnotexist", "x" * 64, VALID_PREVIEW))

    def test_submit_rejects_missing_password_exposure(self):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc", password="sekret"))
        result = run_async(jobs.submit_job(job["job_id"], job["submit_token"], VALID_PREVIEW))
        fetched = run_async(jobs.get_job(job["job_id"]))
        assert "sekret" not in str(result)
        assert "sekret" not in str(fetched)

    def test_submit_rejects_non_dict_preview(self):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        with pytest.raises(PreviewValidationError):
            run_async(jobs.submit_job(job["job_id"], job["submit_token"], "not-a-dict"))

    def test_submit_rejects_invalid_preview_schema(self):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        bad = dict(VALID_PREVIEW)
        bad["ok"] = "not-a-bool"
        with pytest.raises(PreviewValidationError):
            run_async(jobs.submit_job(job["job_id"], job["submit_token"], bad))

    def test_submit_rejects_too_many_files(self):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        too_many = dict(VALID_PREVIEW)
        too_many["files"] = [
            {"name": f"f{i}.mp4", "download_url": "https://dl.example.com/a.mp4"} for i in range(MAX_FILES + 1)
        ]
        with pytest.raises(PreviewValidationError, match="too many files"):
            run_async(jobs.submit_job(job["job_id"], job["submit_token"], too_many))


class TestGetJob:
    def test_get_missing_returns_none(self):
        assert run_async(jobs.get_job("ext_nope")) is None

    def test_pending_job_has_no_preview(self):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        fetched = run_async(jobs.get_job(job["job_id"]))
        assert fetched["status"] == "pending"
        assert fetched["preview"] is None

    def test_expired_job_returns_none(self, monkeypatch):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        # Simulate a job that outlived its TTL
        jobs._MEMORY_JOBS[job["job_id"]] = (time.time() - 1, jobs._MEMORY_JOBS[job["job_id"]][1])
        assert run_async(jobs.get_job(job["job_id"])) is None

    def test_expired_job_cannot_be_submitted(self, monkeypatch):
        job = run_async(jobs.create_job("https://terabox.com/s/1abc"))
        jobs._MEMORY_JOBS[job["job_id"]] = (time.time() - 1, jobs._MEMORY_JOBS[job["job_id"]][1])
        with pytest.raises(JobNotFoundError):
            run_async(jobs.submit_job(job["job_id"], job["submit_token"], VALID_PREVIEW))
