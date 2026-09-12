"""Admin notification system for important events."""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

logger = logging.getLogger("teraplayer.notifications")

NOTIFICATION_TYPES = {
    "info",
    "warning",
    "critical",
}

NOTIFICATION_CATEGORIES = {
    "search_console",
    "extraction",
    "api",
    "scheduler",
    "database",
    "system",
    "admin_action",
    "security",
}


async def create_notification(
    db,
    *,
    type: str,
    category: str,
    title: str,
    message: str,
    admin_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
) -> Optional[dict]:
    """Create a notification for admins."""
    if db is None:
        return None

    if type not in NOTIFICATION_TYPES:
        type = "info"
    if category not in NOTIFICATION_CATEGORIES:
        category = "system"

    try:
        notification = {
            "type": type,
            "category": category,
            "title": title,
            "message": message,
            "admin_id": admin_id,
            "metadata": metadata,
            "action_url": action_url,
            "action_label": action_label,
            "read": False,
            "archived": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await db.admin_notifications.insert_one(notification)
        notif_id = str(result.inserted_id)
        # Persist the string id on the document so later reads/updates by
        # `id` actually match. Previously the id was only added to the
        # in-memory dict, so mark-read/archive queries by id never matched.
        try:
            await db.admin_notifications.update_one(
                {"_id": result.inserted_id},
                {"$set": {"id": notif_id}},
            )
        except Exception:
            pass
        notification["id"] = notif_id
        return notification
    except Exception as exc:
        logger.warning("Failed to create notification", exc_info=exc)
        return None


def _normalize_notification_doc(doc: dict) -> dict:
    """Ensure a notification doc always exposes a string `id` and no `_id`."""
    if not isinstance(doc, dict):
        return doc
    if "id" not in doc or not doc.get("id"):
        raw_oid = doc.get("_id")
        if raw_oid is not None:
            doc["id"] = str(raw_oid)
    doc.pop("_id", None)
    return doc


async def get_notifications(
    db,
    admin_id: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 50,
    skip: int = 0,
) -> list[dict]:
    """Get notifications for an admin (or all if admin_id is None)."""
    if db is None:
        return []

    query = {"archived": False}
    if admin_id:
        query["$or"] = [{"admin_id": admin_id}, {"admin_id": None}]
    if unread_only:
        query["read"] = False

    docs = await db.admin_notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return [_normalize_notification_doc(d) for d in docs]


async def count_unread_notifications(db, admin_id: str) -> int:
    """Count unread notifications for an admin."""
    if db is None:
        return 0

    query = {
        "read": False,
        "archived": False,
        "$or": [{"admin_id": admin_id}, {"admin_id": None}],
    }
    return await db.admin_notifications.count_documents(query)


async def mark_notification_read(db, notification_id: str, admin_id: str) -> bool:
    """Mark a notification as read."""
    if db is None:
        return False

    try:
        # Match by stored string `id` first (new docs), then fall back to
        # Mongo `_id` for legacy docs created before `id` was persisted.
        result = await db.admin_notifications.update_one(
            {"id": notification_id, "$or": [{"admin_id": admin_id}, {"admin_id": None}]},
            {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}},
        )
        if result.modified_count > 0:
            return True
        from bson import ObjectId

        try:
            oid = ObjectId(notification_id)
        except Exception:
            return False
        result = await db.admin_notifications.update_one(
            {"_id": oid, "$or": [{"admin_id": admin_id}, {"admin_id": None}]},
            {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}},
        )
        return result.modified_count > 0
    except Exception as exc:
        logger.warning("Failed to mark notification read", exc_info=exc)
        return False


async def mark_all_notifications_read(db, admin_id: str) -> int:
    """Mark all notifications as read for an admin."""
    if db is None:
        return 0

    try:
        result = await db.admin_notifications.update_many(
            {"read": False, "archived": False, "$or": [{"admin_id": admin_id}, {"admin_id": None}]},
            {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}},
        )
        return result.modified_count
    except Exception as exc:
        logger.warning("Failed to mark all notifications read", exc_info=exc)
        return 0


async def archive_notification(db, notification_id: str, admin_id: str) -> bool:
    """Archive a notification."""
    if db is None:
        return False

    try:
        result = await db.admin_notifications.update_one(
            {"id": notification_id, "$or": [{"admin_id": admin_id}, {"admin_id": None}]},
            {"$set": {"archived": True, "archived_at": datetime.now(timezone.utc).isoformat()}},
        )
        if result.modified_count > 0:
            return True
        from bson import ObjectId

        try:
            oid = ObjectId(notification_id)
        except Exception:
            return False
        result = await db.admin_notifications.update_one(
            {"_id": oid, "$or": [{"admin_id": admin_id}, {"admin_id": None}]},
            {"$set": {"archived": True, "archived_at": datetime.now(timezone.utc).isoformat()}},
        )
        return result.modified_count > 0
    except Exception as exc:
        logger.warning("Failed to archive notification", exc_info=exc)
        return False


# Predefined notification creators for common events
async def notify_search_console_disconnected(db, admin_id: Optional[str] = None):
    """Notify about Search Console disconnection."""
    return await create_notification(
        db,
        type="warning",
        category="search_console",
        title="Search Console Disconnected",
        message="Google Search Console integration has been disconnected or credentials are invalid.",
        admin_id=admin_id,
        action_url="/admin/search-console",
        action_label="Reconnect",
    )


async def notify_search_console_sync_failed(db, error: str, admin_id: Optional[str] = None):
    """Notify about Search Console sync failure."""
    return await create_notification(
        db,
        type="critical",
        category="search_console",
        title="Search Console Sync Failed",
        message=f"Failed to sync data from Google Search Console: {error}",
        admin_id=admin_id,
        action_url="/admin/search-console",
        action_label="View Details",
    )


async def notify_high_error_rate(db, error_rate: float, threshold: float, admin_id: Optional[str] = None):
    """Notify about high API error rate."""
    return await create_notification(
        db,
        type="critical" if error_rate > threshold * 2 else "warning",
        category="api",
        title="High API Error Rate Detected",
        message=f"API error rate reached {error_rate:.1f}% (threshold: {threshold:.1f}%)",
        admin_id=admin_id,
        metadata={"error_rate": error_rate, "threshold": threshold},
        action_url="/admin/extraction-analytics",
        action_label="Investigate",
    )


async def notify_scheduler_failure(db, error: str, admin_id: Optional[str] = None):
    """Notify about scheduler failure."""
    return await create_notification(
        db,
        type="critical",
        category="scheduler",
        title="Scheduled Maintenance Scheduler Failed",
        message=f"The background scheduler encountered an error: {error}",
        admin_id=admin_id,
        action_url="/admin/site",
        action_label="Check Schedule",
    )


async def notify_database_issue(db, error: str, admin_id: Optional[str] = None):
    """Notify about database connectivity issues."""
    return await create_notification(
        db,
        type="critical",
        category="database",
        title="Database Connectivity Issue",
        message=f"Database connection problem detected: {error}",
        admin_id=admin_id,
        action_url="/admin/system",
        action_label="View System",
    )


async def notify_scheduled_maintenance_started(db, admin_id: Optional[str] = None):
    """Notify about scheduled maintenance start."""
    return await create_notification(
        db,
        type="info",
        category="scheduler",
        title="Scheduled Maintenance Started",
        message="Automatic scheduled maintenance has been activated.",
        admin_id=admin_id,
        action_url="/admin/site",
        action_label="View Details",
    )


async def notify_scheduled_maintenance_completed(db, admin_id: Optional[str] = None):
    """Notify about scheduled maintenance completion."""
    return await create_notification(
        db,
        type="info",
        category="scheduler",
        title="Scheduled Maintenance Completed",
        message="Automatic scheduled maintenance has been completed and normal operations restored.",
        admin_id=admin_id,
        action_url="/admin/site",
        action_label="View Details",
    )


async def notify_admin_action(db, acting_admin_id: str, action: str, target: str, admin_id: Optional[str] = None):
    """Notify about important admin actions."""
    return await create_notification(
        db,
        type="info",
        category="admin_action",
        title=f"Admin Action: {action}",
        message=f"Admin performed '{action}' on {target}",
        admin_id=admin_id,
        metadata={"acting_admin_id": acting_admin_id, "action": action, "target": target},
    )