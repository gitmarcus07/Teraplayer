"""Admin audit log — immutable trail of admin actions."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

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
}


async def record_audit(db, admin: AdminOut, action: str, detail: str | None = None, target: str | None = None, ip: str | None = None) -> None:
    """Record an admin action. Never raises — audit failures are non-fatal."""
    if db is None:
        return
    try:
        await db.admin_audit_log.insert_one(
            {
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
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to record audit entry", exc_info=exc)


async def list_audit(db, limit: int = 100, admin_id: str | None = None) -> list[dict]:
    if db is None:
        return []
    query = {"admin_id": admin_id} if admin_id else {}
    docs = await db.admin_audit_log.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
    return docs