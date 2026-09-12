"""Lightweight request metrics stored in MongoDB.

Every metric is a single document keyed by (kind, ok, day) whose `count` is
incremented with $inc. This keeps writes tiny and lets the dashboard/analytics
pages aggregate real data with a few aggregations — nothing is fabricated.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional


def _day_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def record_metric(db, kind: str, ok: bool) -> None:
    """Increment a counter for (kind, ok, today). No-op without MongoDB."""
    if db is None:
        return
    try:
        await db.metrics.update_one(
            {"kind": kind, "ok": bool(ok), "day": _day_key()},
            {"$inc": {"count": 1}},
            upsert=True,
        )
    except Exception:  # noqa: BLE001
        pass


async def record_metric_with_detail(db, kind: str, ok: bool, detail: Optional[dict] = None) -> None:
    """Increment a counter with optional detail metadata."""
    if db is None:
        return
    try:
        update = {"$inc": {"count": 1}}
        if detail:
            update["$set"] = {"detail": detail}
        await db.metrics.update_one(
            {"kind": kind, "ok": bool(ok), "day": _day_key()},
            update,
            upsert=True,
        )
    except Exception:  # noqa: BLE001
        pass


async def dashboard_summary(db) -> dict:
    """Aggregate totals, success rates and per-kind breakdowns (all time + today)."""
    if db is None:
        return {"available": False}

    pipeline = [
        {"$group": {"_id": {"kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
    ]
    docs = await db.metrics.aggregate(pipeline).to_list(length=1000)

    totals: dict[str, int] = {}
    by_kind: dict[str, dict] = {}
    today_key = _day_key()

    for doc in docs:
        kind = doc["_id"]["kind"]
        ok = bool(doc["_id"]["ok"])
        count = doc["count"]
        totals["total"] = totals.get("total", 0) + count
        if ok:
            totals["success"] = totals.get("success", 0) + count
        else:
            totals["failure"] = totals.get("failure", 0) + count
        k = by_kind.setdefault(kind, {"total": 0, "success": 0, "failure": 0})
        k["total"] += count
        k["success" if ok else "failure"] += count

    today_docs = await db.metrics.find({"day": today_key}, {"_id": 0}).to_list(length=200)
    today_total = sum(d.get("count", 0) for d in today_docs)
    today_success = sum(d.get("count", 0) for d in today_docs if d.get("ok"))
    today_failure = today_total - today_success

    total = totals.get("total", 0)
    success = totals.get("success", 0)
    return {
        "available": True,
        "total": total,
        "success": success,
        "failure": totals.get("failure", 0),
        "success_rate": round(success * 100 / total, 1) if total else 0,
        "today_total": today_total,
        "today_success": today_success,
        "today_failure": today_failure,
        "by_kind": by_kind,
    }


async def analytics_series(db, days: int = 14) -> list[dict]:
    """Return per-day totals (all kinds) for the last `days` days."""
    if db is None:
        return []

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    pipeline = [
        {"$match": {"day": {"$gte": start}}},
        {"$group": {"_id": {"day": "$day", "kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
        {"$sort": {"_id.day": 1}},
    ]
    docs = await db.metrics.aggregate(pipeline).to_list(length=5000)

    index: dict[str, dict] = {}
    for doc in docs:
        d = doc["_id"]["day"]
        row = index.setdefault(d, {"day": d, "total": 0, "success": 0, "failure": 0})
        row["total"] += doc["count"]
        row["success" if bool(doc["_id"]["ok"]) else "failure"] += doc["count"]

    result = []
    cursor = datetime.now(timezone.utc) - timedelta(days=days - 1)
    for _ in range(days):
        key = cursor.strftime("%Y-%m-%d")
        result.append(index.get(key, {"day": key, "total": 0, "success": 0, "failure": 0}))
        cursor += timedelta(days=1)
    return result


async def analytics_series_by_kind(db, days: int = 14, kind: Optional[str] = None) -> list[dict]:
    """Return per-day breakdown by kind for the last `days` days."""
    if db is None:
        return []

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    match_stage = {"day": {"$gte": start}}
    if kind:
        match_stage["kind"] = kind

    pipeline = [
        {"$match": match_stage},
        {"$group": {"_id": {"day": "$day", "kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
        {"$sort": {"_id.day": 1}},
    ]
    docs = await db.metrics.aggregate(pipeline).to_list(length=5000)

    index: dict[str, dict] = {}
    for doc in docs:
        d = doc["_id"]["day"]
        k = doc["_id"]["kind"]
        ok = bool(doc["_id"]["ok"])
        count = doc["count"]
        row = index.setdefault(d, {"day": d})
        row[f"{k}_total"] = row.get(f"{k}_total", 0) + count
        row[f"{k}_success" if ok else f"{k}_failure"] = row.get(f"{k}_success" if ok else f"{k}_failure", 0) + count

    result = []
    cursor = datetime.now(timezone.utc) - timedelta(days=days - 1)
    for _ in range(days):
        key = cursor.strftime("%Y-%m-%d")
        result.append(index.get(key, {"day": key}))
        cursor += timedelta(days=1)
    return result


async def get_kind_breakdown(db, days: int = 14) -> list[dict]:
    """Get breakdown by kind for the last `days` days."""
    if db is None:
        return []

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    pipeline = [
        {"$match": {"day": {"$gte": start}}},
        {"$group": {"_id": {"kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
    ]
    docs = await db.metrics.aggregate(pipeline).to_list(length=1000)

    by_kind: dict[str, dict] = {}
    for doc in docs:
        kind = doc["_id"]["kind"]
        ok = bool(doc["_id"]["ok"])
        count = doc["count"]
        k = by_kind.setdefault(kind, {"total": 0, "success": 0, "failure": 0})
        k["total"] += count
        k["success" if ok else "failure"] += count

    result = []
    for kind, stats in by_kind.items():
        total = stats["total"]
        success = stats["success"]
        result.append({
            "kind": kind,
            "total": total,
            "success": success,
            "failure": stats["failure"],
            "success_rate": round(success * 100 / total, 1) if total else 0,
        })
    result.sort(key=lambda x: x["total"], reverse=True)
    return result


async def get_failure_reasons(db, days: int = 14) -> list[dict]:
    """Get common failure reasons from metrics detail."""
    if db is None:
        return []

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    pipeline = [
        {"$match": {"day": {"$gte": start}, "ok": False, "detail": {"$exists": True}}},
        {"$group": {"_id": "$detail.reason", "count": {"$sum": "$count"}}},
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]
    docs = await db.metrics.aggregate(pipeline).to_list(length=20)
    return [{"reason": d["_id"] or "Unknown", "count": d["count"]} for d in docs]


async def get_extraction_analytics(db, days: int = 14) -> dict:
    """Get comprehensive extraction analytics."""
    if db is None:
        return {"available": False}

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")

    # Overall extraction metrics
    extraction_pipeline = [
        {"$match": {"day": {"$gte": start}, "kind": {"$in": ["preview", "watch", "download", "folder", "extension_create", "extension_submit", "extension_result"]}}},
        {"$group": {"_id": {"day": "$day", "kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
        {"$sort": {"_id.day": 1}},
    ]
    extraction_docs = await db.metrics.aggregate(extraction_pipeline).to_list(length=5000)

    # Aggregate by day
    daily: dict[str, dict] = {}
    for doc in extraction_docs:
        d = doc["_id"]["day"]
        kind = doc["_id"]["kind"]
        ok = bool(doc["_id"]["ok"])
        count = doc["count"]
        row = daily.setdefault(d, {"day": d, "total": 0, "success": 0, "failure": 0, "by_kind": {}})
        row["total"] += count
        row["success" if ok else "failure"] += count
        row["by_kind"].setdefault(kind, {"total": 0, "success": 0, "failure": 0})
        row["by_kind"][kind]["total"] += count
        row["by_kind"][kind]["success" if ok else "failure"] += count

    # Fill missing days
    result = []
    cursor = datetime.now(timezone.utc) - timedelta(days=days - 1)
    for _ in range(days):
        key = cursor.strftime("%Y-%m-%d")
        result.append(daily.get(key, {"day": key, "total": 0, "success": 0, "failure": 0, "by_kind": {}}))
        cursor += timedelta(days=1)

    # Overall totals
    total_pipeline = [
        {"$match": {"kind": {"$in": ["preview", "watch", "download", "folder", "extension_create", "extension_submit", "extension_result"]}}},
        {"$group": {"_id": {"kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
    ]
    total_docs = await db.metrics.aggregate(total_pipeline).to_list(length=1000)

    totals = {"total": 0, "success": 0, "failure": 0, "by_kind": {}}
    for doc in total_docs:
        kind = doc["_id"]["kind"]
        ok = bool(doc["_id"]["ok"])
        count = doc["count"]
        totals["total"] += count
        totals["success" if ok else "failure"] += count
        k = totals["by_kind"].setdefault(kind, {"total": 0, "success": 0, "failure": 0})
        k["total"] += count
        k["success" if ok else "failure"] += count

    return {
        "available": True,
        "days": days,
        "summary": {
            "total": totals["total"],
            "success": totals["success"],
            "failure": totals["failure"],
            "success_rate": round(totals["success"] * 100 / totals["total"], 1) if totals["total"] else 0,
        },
        "by_kind": totals["by_kind"],
        "series": result,
    }


async def get_api_analytics(db, days: int = 14) -> dict:
    """Get API analytics (preview, watch, download, folder, stream)."""
    if db is None:
        return {"available": False}

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")

    api_kinds = ["preview", "watch", "download", "folder", "stream"]

    pipeline = [
        {"$match": {"day": {"$gte": start}, "kind": {"$in": api_kinds}}},
        {"$group": {"_id": {"day": "$day", "kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
        {"$sort": {"_id.day": 1}},
    ]
    docs = await db.metrics.aggregate(pipeline).to_list(length=5000)

    daily: dict[str, dict] = {}
    for doc in docs:
        d = doc["_id"]["day"]
        kind = doc["_id"]["kind"]
        ok = bool(doc["_id"]["ok"])
        count = doc["count"]
        row = daily.setdefault(d, {"day": d, "total": 0, "success": 0, "failure": 0, "by_kind": {}})
        row["total"] += count
        row["success" if ok else "failure"] += count
        row["by_kind"].setdefault(kind, {"total": 0, "success": 0, "failure": 0})
        row["by_kind"][kind]["total"] += count
        row["by_kind"][kind]["success" if ok else "failure"] += count

    result = []
    cursor = datetime.now(timezone.utc) - timedelta(days=days - 1)
    for _ in range(days):
        key = cursor.strftime("%Y-%m-%d")
        result.append(daily.get(key, {"day": key, "total": 0, "success": 0, "failure": 0, "by_kind": {}}))
        cursor += timedelta(days=1)

    # Totals
    total_pipeline = [
        {"$match": {"kind": {"$in": api_kinds}}},
        {"$group": {"_id": {"kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
    ]
    total_docs = await db.metrics.aggregate(total_pipeline).to_list(length=1000)

    totals = {"total": 0, "success": 0, "failure": 0, "by_kind": {}}
    for doc in total_docs:
        kind = doc["_id"]["kind"]
        ok = bool(doc["_id"]["ok"])
        count = doc["count"]
        totals["total"] += count
        totals["success" if ok else "failure"] += count
        k = totals["by_kind"].setdefault(kind, {"total": 0, "success": 0, "failure": 0})
        k["total"] += count
        k["success" if ok else "failure"] += count

    return {
        "available": True,
        "days": days,
        "summary": {
            "total": totals["total"],
            "success": totals["success"],
            "failure": totals["failure"],
            "success_rate": round(totals["success"] * 100 / totals["total"], 1) if totals["total"] else 0,
        },
        "by_kind": totals["by_kind"],
        "series": result,
    }


async def export_analytics_csv(db, days: int = 30, kind: Optional[str] = None) -> str:
    """Export analytics as CSV string."""
    if db is None:
        return ""

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    match_stage = {"day": {"$gte": start}}
    if kind:
        match_stage["kind"] = kind

    pipeline = [
        {"$match": match_stage},
        {"$group": {"_id": {"day": "$day", "kind": "$kind", "ok": "$ok"}, "count": {"$sum": "$count"}}},
        {"$sort": {"_id.day": 1, "_id.kind": 1}},
    ]
    docs = await db.metrics.aggregate(pipeline).to_list(length=50000)

    lines = ["date,kind,status,count"]
    for doc in docs:
        day = doc["_id"]["day"]
        kind = doc["_id"]["kind"]
        ok = doc["_id"]["ok"]
        count = doc["count"]
        lines.append(f"{day},{kind},{'success' if ok else 'failure'},{count}")

    return "\n".join(lines)


async def record_error(db, kind: str, error_type: str, message: str, detail: Optional[dict] = None) -> None:
    """Record an error for tracking."""
    if db is None:
        return
    try:
        await db.errors.insert_one({
            "kind": kind,
            "error_type": error_type,
            "message": message,
            "detail": detail,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        # Also create index for TTL
        await db.errors.create_index("created_at", expireAfterSeconds=30 * 24 * 3600)
    except Exception:  # noqa: BLE001
        pass


async def get_errors(
    db,
    limit: int = 100,
    skip: int = 0,
    kind: Optional[str] = None,
    error_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    """Get errors with filtering and pagination."""
    if db is None:
        return []

    if kind in ("all", ""):
        kind = None
    if error_type in ("all", ""):
        error_type = None

    query = {}
    if kind:
        query["kind"] = kind
    if error_type:
        query["error_type"] = error_type
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["created_at"] = date_query
    if search:
        query["$or"] = [
            {"message": {"$regex": search, "$options": "i"}},
            {"error_type": {"$regex": search, "$options": "i"}},
            {"kind": {"$regex": search, "$options": "i"}},
        ]

    docs = await db.errors.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return docs


async def count_errors(
    db,
    kind: Optional[str] = None,
    error_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
) -> int:
    """Count errors with filtering."""
    if db is None:
        return 0

    if kind in ("all", ""):
        kind = None
    if error_type in ("all", ""):
        error_type = None

    query = {}
    if kind:
        query["kind"] = kind
    if error_type:
        query["error_type"] = error_type
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["created_at"] = date_query
    if search:
        query["$or"] = [
            {"message": {"$regex": search, "$options": "i"}},
            {"error_type": {"$regex": search, "$options": "i"}},
            {"kind": {"$regex": search, "$options": "i"}},
        ]

    return await db.errors.count_documents(query)


async def get_error_summary(db, days: int = 7) -> dict:
    """Get error summary for the last N days."""
    if db is None:
        return {"available": False}

    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$group": {"_id": {"kind": "$kind", "error_type": "$error_type"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    docs = await db.errors.aggregate(pipeline).to_list(length=100)

    summary = {
        "total": 0,
        "by_kind": {},
        "by_type": {},
        "recent": [],
    }

    for doc in docs:
        kind = doc["_id"]["kind"]
        error_type = doc["_id"]["error_type"]
        count = doc["count"]
        summary["total"] += count
        summary["by_kind"][kind] = summary["by_kind"].get(kind, 0) + count
        summary["by_type"][error_type] = summary["by_type"].get(error_type, 0) + count

    # Get recent errors
    recent_docs = await db.errors.find({"created_at": {"$gte": start}}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(length=10)
    summary["recent"] = recent_docs

    return summary