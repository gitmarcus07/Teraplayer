"""Site settings stored in MongoDB — used for maintenance mode and announcements."""
from __future__ import annotations

from datetime import datetime, timezone

DEFAULT_SITE_STATUS = {
    "maintenance_mode": False,
    "announcement": "",
    "site_status": "online",
}


async def get_site_status(db) -> dict:
    """Return current site settings merged over defaults."""
    status = dict(DEFAULT_SITE_STATUS)
    if db is None:
        return status
    doc = await db.site_settings.find_one({"_id": "site_status"}, {"_id": 0})
    if doc:
        status.update({k: v for k, v in doc.items() if k in DEFAULT_SITE_STATUS})
    return status


async def set_site_status(db, **changes) -> dict:
    """Update site settings. Only known keys are accepted; booleans coerced."""
    if db is None:
        raise RuntimeError("MongoDB not configured")

    clean: dict = {}
    for key, value in changes.items():
        if key not in DEFAULT_SITE_STATUS:
            continue
        if key == "maintenance_mode" or key == "site_status":
            clean[key] = bool(value)
        elif key == "announcement":
            clean[key] = str(value or "").strip()[:1000]

    if "maintenance_mode" in clean and clean["maintenance_mode"]:
        clean["site_status"] = True
    elif "maintenance_mode" in clean:
        clean["site_status"] = False

    clean["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_settings.update_one(
        {"_id": "site_status"},
        {"$set": clean},
        upsert=True,
    )
    return await get_site_status(db)