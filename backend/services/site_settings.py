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

    try:
        doc = await db.site_settings.find_one({"_id": "site_status"}, {"_id": 0})
    except Exception as exc:
        logger.warning("Failed to read site settings, using defaults", exc_info=exc)
        return DEFAULT_SITE_SETTINGS
    if not isinstance(doc, dict):
        return DEFAULT_SITE_SETTINGS

    # Parse nested objects defensively: one malformed section must never
    # brick the whole read (previously any bad value 500'd the admin
    # Site page with "Failed to load site settings").
    announcement = _parse_announcement(doc.get("announcement"))
    schedule = _parse_schedule(doc.get("schedule"))

    operating_mode = doc.get("operating_mode", "normal")
    if operating_mode not in ("normal", "maintenance", "emergency"):
        logger.warning("Unknown operating_mode %r, falling back to normal", operating_mode)
        operating_mode = "normal"

    updated_at = doc.get("updated_at") or datetime.now(timezone.utc).isoformat()
    if not isinstance(updated_at, str):
        updated_at = str(updated_at)

    try:
        return SiteSettings(
            operating_mode=operating_mode,
            maintenance_mode=bool(doc.get("maintenance_mode", False)),
            announcement=announcement,
            schedule=schedule,
            updated_at=updated_at,
            updated_by=doc.get("updated_by"),
        )
    except Exception as exc:
        logger.warning("Failed to parse site settings, using defaults", exc_info=exc)
        return DEFAULT_SITE_SETTINGS


def _parse_announcement(raw) -> AnnouncementSettings:
    """Parse announcement settings, skipping invalid buttons instead of failing."""
    if not isinstance(raw, dict):
        return AnnouncementSettings()
    buttons = []
    raw_buttons = raw.get("buttons", [])
    if isinstance(raw_buttons, list):
        for btn in raw_buttons:
            if not isinstance(btn, dict):
                continue
            try:
                buttons.append(AnnouncementButton(**btn))
            except Exception as exc:
                logger.warning("Skipping invalid announcement button %r: %s", btn.get("id"), exc)
    try:
        return AnnouncementSettings(
            enabled=bool(raw.get("enabled", False)),
            title=str(raw.get("title", "") or "")[:100],
            message=str(raw.get("message", "") or "")[:2000],
            icon=raw.get("icon"),
            buttons=buttons,
        )
    except Exception as exc:
        logger.warning("Failed to parse announcement, using defaults", exc_info=exc)
        return AnnouncementSettings()


def _parse_schedule(raw) -> MaintenanceSchedule:
    """Parse maintenance schedule, tolerating missing/invalid parts."""
    if not isinstance(raw, dict):
        return MaintenanceSchedule()
    try:
        snapshot_raw = raw.get("announcement_snapshot")
        snapshot = _parse_announcement(snapshot_raw) if snapshot_raw else None
        return MaintenanceSchedule(
            enabled=bool(raw.get("enabled", False)),
            start_at=raw.get("start_at"),
            end_at=raw.get("end_at"),
            timezone=str(raw.get("timezone", "UTC") or "UTC"),
            announcement_snapshot=snapshot,
        )
    except Exception as exc:
        logger.warning("Failed to parse schedule, using defaults", exc_info=exc)
        return MaintenanceSchedule()


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