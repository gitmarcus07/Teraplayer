"""Lightweight request metrics stored in MongoDB.

Every metric is a single document keyed by (kind, ok, day) whose `count` is
incremented with $inc. This keeps writes tiny and lets the dashboard/analytics
pages aggregate real data with a few aggregations — nothing is fabricated.
"""
from __future__ import annotations

from datetime import datetime, timezone


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

    from datetime import timedelta

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