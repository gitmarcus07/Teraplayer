"""Admin audit log — immutable trail of admin actions."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from models.admin import AdminOut

logger = logging.getLogger("teraplayer.audit")

ACTIONS = {
    "login",
    "logout",
    "create_admin",
    "update_admin",
    "set_admin_password",
    "delete_admin",
    "update_site",
    "set_operating_mode",
    "enable_emergency_mode",
    "connect_search_console",
    "disconnect_search_console",
    "update_extraction_settings",
}


async def record_audit(
    db,
    admin: AdminOut,
    action: str,
    detail: str | None = None,
    target: str | None = None,
    ip: str | None = None,
    metadata: Optional[dict] = None,
) -> None:
    """Record an admin action. Never raises — audit failures are non-fatal."""
    if db is None:
        return
    try:
        doc = {
            "action": action,
            "admin_id": admin.admin_id,
            "admin_email": admin.email,
            "admin_name": admin.name,
            "role": admin.role,
            "detail": detail,
            "target": target,
            "ip": ip,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if metadata:
            doc["metadata"] = metadata
        await db.admin_audit_log.insert_one(doc)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to record audit entry", exc_info=exc)


async def list_audit(
    db,
    limit: int = 100,
    skip: int = 0,
    admin_id: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    """List audit entries with filtering and pagination."""
    if db is None:
        return []

    # Frontend sends "all" for unfiltered dropdowns — treat as no filter.
    if admin_id in ("all", ""):
        admin_id = None
    if action in ("all", ""):
        action = None

    query = {}
    if admin_id:
        query["admin_id"] = admin_id
    if action:
        query["action"] = action
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["created_at"] = date_query
    if search:
        query["$or"] = [
            {"detail": {"$regex": search, "$options": "i"}},
            {"target": {"$regex": search, "$options": "i"}},
            {"admin_email": {"$regex": search, "$options": "i"}},
            {"admin_name": {"$regex": search, "$options": "i"}},
            {"action": {"$regex": search, "$options": "i"}},
        ]

    docs = await db.admin_audit_log.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return docs


async def count_audit(
    db,
    admin_id: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
) -> int:
    """Count audit entries with filtering."""
    if db is None:
        return 0

    if admin_id in ("all", ""):
        admin_id = None
    if action in ("all", ""):
        action = None

    query = {}
    if admin_id:
        query["admin_id"] = admin_id
    if action:
        query["action"] = action
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["created_at"] = date_query
    if search:
        query["$or"] = [
            {"detail": {"$regex": search, "$options": "i"}},
            {"target": {"$regex": search, "$options": "i"}},
            {"admin_email": {"$regex": search, "$options": "i"}},
            {"admin_name": {"$regex": search, "$options": "i"}},
            {"action": {"$regex": search, "$options": "i"}},
        ]

    return await db.admin_audit_log.count_documents(query)


async def get_audit_actions(db) -> list[str]:
    """Get list of distinct audit actions."""
    if db is None:
        return []
    actions = await db.admin_audit_log.distinct("action")
    return sorted(actions)