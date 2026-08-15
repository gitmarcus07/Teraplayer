"""Local API tests for the /api/extension/* routes.

Uses FastAPI's TestClient against the real FastAPI app with the in-memory job
store (MongoDB not configured). No network access required.
"""
from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient  # noqa: E402

import services.extension_jobs as jobs  # noqa: E402
import server  # noqa: E402

VALID_PREVIEW = {
    "ok": True,
    "source": "extension",
    "title": "local_video.mp4",
    "size": 2048,
    "download_url": "https://dl.example.com/local_video.mp4",
    "stream_url": "https://dl.example.com/local_video.mp4",
    "file_type": "video",
    "files": [],
}


@pytest.fixture(scope="module", autouse=True)
def _clean_load():
    # Run against the in-memory job store and without MongoDB-backed rate
    # limiting (no live database in tests). The .env may set MONGO_URL which
    # would otherwise create a motor client tied to the wrong event loop.
    server.db = None
    jobs._db = None
    yield
    jobs._MEMORY_JOBS.clear()


@pytest.fixture(scope="module")
def client():
    return TestClient(server.app)


class TestExtensionCreateEndpoint:
    def test_create_valid_url(self, client):
        r = client.post("/api/extension/create", json={"url": "https://terabox.com/s/1abc"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["job_id"].startswith("ext_")
        assert len(data["submit_token"]) == 64
        assert "terabox.com/sharing/link" in data["terabox_url"]

    def test_create_rejects_non_terabox_url(self, client):
        r = client.post("/api/extension/create", json={"url": "https://google.com"})
        assert r.status_code == 400, r.text
        assert "TeraBox" in r.json()["detail"]

    def test_create_rejects_missing_url(self, client):
        r = client.post("/api/extension/create", json={})
        # Pydantic validation -> 422
        assert r.status_code == 422


class TestExtensionSubmitEndpoint:
    def test_happy_path(self, client):
        created = client.post("/api/extension/create", json={"url": "https://terabox.com/s/1xyz"}).json()
        r = client.post(
            "/api/extension/submit",
            json={
                "job_id": created["job_id"],
                "token": created["submit_token"],
                "preview": VALID_PREVIEW,
            },
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "done"

    def test_rejects_bad_token(self, client):
        created = client.post("/api/extension/create", json={"url": "https://terabox.com/s/1abc"}).json()
        r = client.post(
            "/api/extension/submit",
            json={"job_id": created["job_id"], "token": "bad", "preview": VALID_PREVIEW},
        )
        assert r.status_code == 403

    def test_rejects_unknown_job(self, client):
        r = client.post(
            "/api/extension/submit",
            json={"job_id": "ext_doesnotexist", "token": "x" * 64, "preview": VALID_PREVIEW},
        )
        assert r.status_code == 404

    def test_rejects_oversized_payload(self, client):
        created = client.post("/api/extension/create", json={"url": "https://terabox.com/s/1abc"}).json()
        huge = dict(VALID_PREVIEW)
        huge["files"] = [{"name": f"f{i}.mp4"} for i in range(jobs.MAX_FILES + 1)]
        r = client.post(
            "/api/extension/submit",
            json={"job_id": created["job_id"], "token": created["submit_token"], "preview": huge},
        )
        assert r.status_code == 400
        assert "too many files" in r.json()["detail"]


class TestExtensionResultEndpoint:
    def test_pending_then_done(self, client):
        created = client.post("/api/extension/create", json={"url": "https://terabox.com/s/1xyz"}).json()
        pending = client.get(f"/api/extension/result/{created['job_id']}")
        assert pending.status_code == 200, pending.text
        assert pending.json()["status"] == "pending"
        assert pending.json()["preview"] is None

        client.post(
            "/api/extension/submit",
            json={
                "job_id": created["job_id"],
                "token": created["submit_token"],
                "preview": VALID_PREVIEW,
            },
        )
        done = client.get(f"/api/extension/result/{created['job_id']}")
        assert done.status_code == 200
        assert done.json()["status"] == "done"
        assert done.json()["preview"]["title"] == "local_video.mp4"

    def test_missing_job_404(self, client):
        r = client.get("/api/extension/result/ext_whatever")
        assert r.status_code == 404