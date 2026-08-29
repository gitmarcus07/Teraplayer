"""System health checks and monitoring."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger("teraplayer.system_health")


class HealthCheckResult:
    def __init__(self, name: str, status: str, latency_ms: float | None = None, details: str | None = None, error: str | None = None):
        self.name = name
        self.status = status  # "healthy", "degraded", "unhealthy", "unknown"
        self.latency_ms = latency_ms
        self.details = details
        self.error = error
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "details": self.details,
            "error": self.error,
            "timestamp": self.timestamp,
        }


async def check_mongodb(db) -> HealthCheckResult:
    """Check MongoDB connectivity and latency."""
    if db is None:
        return HealthCheckResult("mongodb", "unknown", error="Not configured")

    start = time.time()
    try:
        await db.command("ping")
        latency = (time.time() - start) * 1000
        if latency < 100:
            status = "healthy"
        elif latency < 500:
            status = "degraded"
        else:
            status = "unhealthy"
        return HealthCheckResult("mongodb", status, latency_ms=round(latency, 2), details="Connection successful")
    except Exception as exc:
        latency = (time.time() - start) * 1000
        return HealthCheckResult("mongodb", "unhealthy", latency_ms=round(latency, 2), error=str(exc))


async def check_search_console_service(db) -> HealthCheckResult:
    """Check Search Console integration status."""
    if db is None:
        return HealthCheckResult("search_console", "unknown", error="Database not configured")

    try:
        from services.search_console_service import get_connection_status, _get_service_account_credentials

        connection = await get_connection_status(db)
        if not connection.connected:
            return HealthCheckResult(
                "search_console",
                "degraded",
                details="Not connected - configure service account credentials",
            )

        # Test API connectivity
        creds = _get_service_account_credentials()
        if not creds:
            return HealthCheckResult(
                "search_console",
                "degraded",
                details="Connected but credentials missing",
            )

        return HealthCheckResult(
            "search_console",
            "healthy",
            details=f"Connected to {connection.property_url}",
        )
    except Exception as exc:
        return HealthCheckResult("search_console", "unhealthy", error=str(exc))


async def check_scheduler_service(db) -> HealthCheckResult:
    """Check scheduled maintenance scheduler status."""
    if db is None:
        return HealthCheckResult("scheduler", "unknown", error="Database not configured")

    try:
        # Check if there are any scheduled maintenance entries
        settings_doc = await db.site_settings.find_one({"_id": "site_status"}, {"schedule": 1})
        if not settings_doc or not settings_doc.get("schedule", {}).get("enabled"):
            return HealthCheckResult("scheduler", "healthy", details="No active schedules")

        schedule = settings_doc["schedule"]
        start_at = schedule.get("start_at")
        end_at = schedule.get("end_at")

        if start_at and end_at:
            now = datetime.now(timezone.utc)
            start = datetime.fromisoformat(start_at.replace("Z", "+00:00"))
            end = datetime.fromisoformat(end_at.replace("Z", "+00:00"))

            if start <= now < end:
                return HealthCheckResult("scheduler", "healthy", details="Maintenance in progress")
            elif now >= end:
                return HealthCheckResult("scheduler", "degraded", details="Schedule ended but not cleaned up")
            else:
                return HealthCheckResult("scheduler", "healthy", details=f"Next maintenance at {start_at}")

        return HealthCheckResult("scheduler", "healthy", details="Schedule configured")
    except Exception as exc:
        return HealthCheckResult("scheduler", "unhealthy", error=str(exc))


async def check_extraction_services(db) -> HealthCheckResult:
    """Check extraction service availability."""
    # This is a lightweight check - just verify the service configuration
    import os

    configured = []
    if os.environ.get("XAPIVERSE_API_KEY"):
        configured.append("xapiverse")
    if os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS"):
        configured.append("playwright")
    if os.environ.get("TERABOX_WORKER_URL"):
        configured.append("cf_worker")
    configured.extend(["hnn", "teradl"])  # Always available

    if not configured:
        return HealthCheckResult("extraction", "unhealthy", error="No extractors configured")

    return HealthCheckResult(
        "extraction",
        "healthy",
        details=f"{len(configured)} extractors configured: {', '.join(configured)}",
    )


async def run_all_health_checks(db) -> list[HealthCheckResult]:
    """Run all health checks in parallel."""
    import asyncio

    checks = await asyncio.gather(
        check_mongodb(db),
        check_search_console_service(db),
        check_scheduler_service(db),
        check_extraction_services(db),
        return_exceptions=True,
    )

    results = []
    for i, check in enumerate(checks):
        if isinstance(check, Exception):
            logger.error(f"Health check {i} failed", exc_info=check)
            results.append(HealthCheckResult(f"check_{i}", "unhealthy", error=str(check)))
        else:
            results.append(check)
    return results


async def get_system_info(db) -> dict[str, Any]:
    """Get detailed system information."""
    import platform
    import os

    info = {
        "version": "2.0.0",
        "python": platform.python_version(),
        "platform": platform.platform(),
        "uptime_seconds": None,
        "environment": os.environ.get("ENVIRONMENT", "production"),
    }

    # Try to get process uptime
    try:
        import psutil
        process = psutil.Process()
        info["uptime_seconds"] = time.time() - process.create_time()
        info["memory_mb"] = round(process.memory_info().rss / 1024 / 1024, 2)
        info["cpu_percent"] = process.cpu_percent()
    except Exception:
        pass

    if db is not None:
        try:
            stats = await db.command("dbStats")
            info["database"] = {
                "name": os.environ.get("DB_NAME", "teraplayer"),
                "collections": stats.get("collections", 0),
                "data_size_mb": round(stats.get("dataSize", 0) / 1024 / 1024, 2),
                "storage_size_mb": round(stats.get("storageSize", 0) / 1024 / 1024, 2),
                "indexes": stats.get("indexes", 0),
            }
        except Exception:
            info["database"] = {"name": os.environ.get("DB_NAME", "teraplayer"), "status": "error"}

    return info