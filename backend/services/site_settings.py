"""Site settings stored in MongoDB — used for maintenance modes, announcements, and scheduling."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from models.site import (
    SiteSettings,
    AnnouncementSettings,
    AnnouncementButton,
    MaintenanceSchedule,
    MaintenanceHistoryEntry,
    OperatingMode,
    DEFAULT_SITE_SETTINGS,
    new_button_id,
    new_history_id,
)

logger = logging.getLogger("teraplayer.site_settings")


async def get_site_settings(db) -> SiteSettings:
    """Return current site settings merged over defaults."""
    if db is None:
        return DEFAULT_SITE_SETTINGS

    doc = await db.site_settings.find_one({"_id": "site_status"}, {"_id": 0})
    if not doc:
        return DEFAULT_SITE_SETTINGS

    # Parse nested objects
    announcement_doc = doc.get("announcement", {})
    announcement = AnnouncementSettings(
        enabled=announcement_doc.get("enabled", False),
        title=announcement_doc.get("title", ""),
        message=announcement_doc.get("message", ""),
        icon=announcement_doc.get("icon"),
        buttons=[
            AnnouncementButton(**btn) for btn in announcement_doc.get("buttons", [])
        ],
    )

    schedule_doc = doc.get("schedule", {})
    schedule = MaintenanceSchedule(
        enabled=schedule_doc.get("enabled", False),
        start_at=schedule_doc.get("start_at"),
        end_at=schedule_doc.get("end_at"),
        timezone=schedule_doc.get("timezone", "UTC"),
        announcement_snapshot=(
            AnnouncementSettings(**schedule_doc["announcement_snapshot"])
            if schedule_doc.get("announcement_snapshot")
            else None
        ),
    )

    return SiteSettings(
        operating_mode=doc.get("operating_mode", "normal"),
        maintenance_mode=doc.get("maintenance_mode", False),
        announcement=announcement,
        schedule=schedule,
        updated_at=doc.get("updated_at", datetime.now(timezone.utc).isoformat()),
        updated_by=doc.get("updated_by"),
    )


async def set_site_settings(
    db,
    *,
    operating_mode: Optional[OperatingMode] = None,
    maintenance_mode: Optional[bool] = None,
    announcement: Optional[AnnouncementSettings] = None,
    schedule: Optional[MaintenanceSchedule] = None,
    updated_by: Optional[str] = None,
) -> SiteSettings:
    """Update site settings. Only known keys are accepted."""
    if db is None:
        raise RuntimeError("MongoDB not configured")

    current = await get_site_settings(db)

    # Determine new operating mode
    new_mode = operating_mode or current.operating_mode

    # Handle maintenance_mode boolean (legacy compatibility)
    if maintenance_mode is not None:
        if maintenance_mode and new_mode == "normal":
            new_mode = "maintenance"
        elif not maintenance_mode and new_mode in ("maintenance", "emergency"):
            new_mode = "normal"

    # Sync maintenance_mode boolean with operating_mode
    new_maintenance_mode = new_mode in ("maintenance", "emergency")

    # Build update document
    clean = {
        "operating_mode": new_mode,
        "maintenance_mode": new_maintenance_mode,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if updated_by:
        clean["updated_by"] = updated_by

    if announcement is not None:
        # Validate buttons
        for btn in announcement.buttons:
            if not btn.id:
                btn.id = new_button_id()
        # Sort buttons by order
        announcement.buttons = sorted(announcement.buttons, key=lambda b: b.order)
        clean["announcement"] = announcement.model_dump()

    if schedule is not None:
        clean["schedule"] = schedule.model_dump()

    # Record history if mode changed
    if new_mode != current.operating_mode:
        history_entry = MaintenanceHistoryEntry(
            id=new_history_id(),
            mode=new_mode,
            started_at=datetime.now(timezone.utc).isoformat(),
            ended_at=current.operating_mode != "normal" and datetime.now(timezone.utc).isoformat() or None,
            scheduled=False,
            admin_id=updated_by or "unknown",
            admin_email=updated_by or "unknown",
            announcement_snapshot=current.announcement if current.announcement.enabled else None,
        )
        await db.maintenance_history.insert_one(history_entry.model_dump())

    await db.site_settings.update_one(
        {"_id": "site_status"},
        {"$set": clean},
        upsert=True,
    )
    return await get_site_settings(db)


async def add_maintenance_history(
    db,
    *,
    mode: OperatingMode,
    started_at: str,
    ended_at: Optional[str] = None,
    scheduled: bool = False,
    admin_id: str,
    admin_email: str,
    admin_name: Optional[str] = None,
    announcement_snapshot: Optional[AnnouncementSettings] = None,
) -> MaintenanceHistoryEntry:
    """Add a maintenance history entry."""
    if db is None:
        raise RuntimeError("MongoDB not configured")

    entry = MaintenanceHistoryEntry(
        id=new_history_id(),
        mode=mode,
        started_at=started_at,
        ended_at=ended_at,
        scheduled=scheduled,
        admin_id=admin_id,
        admin_email=admin_email,
        admin_name=admin_name,
        announcement_snapshot=announcement_snapshot,
    )
    await db.maintenance_history.insert_one(entry.model_dump())
    return entry


async def get_maintenance_history(db, limit: int = 50, skip: int = 0) -> list[MaintenanceHistoryEntry]:
    """Get maintenance history with pagination."""
    if db is None:
        return []

    docs = await db.maintenance_history.find({}, {"_id": 0}).sort("started_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return [MaintenanceHistoryEntry(**doc) for doc in docs]


async def close_current_maintenance_history(db, admin_id: str, admin_email: str, admin_name: Optional[str] = None) -> Optional[MaintenanceHistoryEntry]:
    """Close the current open maintenance history entry."""
    if db is None:
        return None

    # Find the most recent open entry (no ended_at)
    doc = await db.maintenance_history.find_one(
        {"ended_at": None},
        {"_id": 0},
        sort=[("started_at", -1)]
    )
    if not doc:
        return None

    ended_at = datetime.now(timezone.utc).isoformat()
    await db.maintenance_history.update_one(
        {"id": doc["id"]},
        {"$set": {"ended_at": ended_at}}
    )
    doc["ended_at"] = ended_at
    return MaintenanceHistoryEntry(**doc)


async def get_public_site_status(db) -> dict:
    """Return public-safe site status for maintenance page."""
    settings = await get_site_settings(db)

    # Check if scheduled maintenance should be active
    if settings.schedule.enabled and settings.schedule.start_at and settings.schedule.end_at:
        try:
            now = datetime.now(timezone.utc)
            start = datetime.fromisoformat(settings.schedule.start_at.replace("Z", "+00:00"))
            end = datetime.fromisoformat(settings.schedule.end_at.replace("Z", "+00:00"))

            if start <= now < end:
                # Scheduled maintenance is active
                return {
                    "operating_mode": "maintenance",
                    "maintenance_mode": True,
                    "announcement": settings.schedule.announcement_snapshot.model_dump() if settings.schedule.announcement_snapshot else settings.announcement.model_dump(),
                    "scheduled": True,
                    "schedule_end": settings.schedule.end_at,
                }
            elif now >= end:
                # Scheduled maintenance ended - auto-disable
                await set_site_settings(db, schedule=MaintenanceSchedule(enabled=False))
                settings = await get_site_settings(db)
        except Exception as exc:
            logger.warning("Failed to parse schedule times", exc_info=exc)

    return {
        "operating_mode": settings.operating_mode,
        "maintenance_mode": settings.maintenance_mode,
        "announcement": settings.announcement.model_dump(),
        "scheduled": False,
        "schedule_end": settings.schedule.end_at if settings.schedule.enabled else None,
    }


async def check_and_apply_scheduled_maintenance(db) -> bool:
    """Check scheduled maintenance and apply if needed. Returns True if changed."""
    if db is None:
        return False

    settings = await get_site_settings(db)
    if not settings.schedule.enabled or not settings.schedule.start_at or not settings.schedule.end_at:
        return False

    try:
        now = datetime.now(timezone.utc)
        start = datetime.fromisoformat(settings.schedule.start_at.replace("Z", "+00:00"))
        end = datetime.fromisoformat(settings.schedule.end_at.replace("Z", "+00:00"))

        changed = False

        # Start scheduled maintenance
        if start <= now < end and settings.operating_mode == "normal":
            await set_site_settings(
                db,
                operating_mode="maintenance",
                announcement=settings.schedule.announcement_snapshot or settings.announcement,
                updated_by="system_scheduler",
            )
            # Record history as scheduled
            await add_maintenance_history(
                db,
                mode="maintenance",
                started_at=start.isoformat(),
                scheduled=True,
                admin_id="system_scheduler",
                admin_email="system@teraplayer",
                admin_name="System Scheduler",
                announcement_snapshot=settings.schedule.announcement_snapshot or settings.announcement,
            )
            changed = True
            logger.info("Scheduled maintenance started automatically")

        # End scheduled maintenance
        elif now >= end and settings.operating_mode in ("maintenance", "emergency"):
            # Only end if it was scheduled (not manual emergency)
            await set_site_settings(
                db,
                operating_mode="normal",
                schedule=MaintenanceSchedule(enabled=False),
                updated_by="system_scheduler",
            )
            # Close history entry
            await close_current_maintenance_history(db, "system_scheduler", "system@teraplayer", "System Scheduler")
            changed = True
            logger.info("Scheduled maintenance ended automatically")

        return changed
    except Exception as exc:
        logger.warning("Failed to check scheduled maintenance", exc_info=exc)
        return False