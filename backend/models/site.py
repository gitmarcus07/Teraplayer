"""Site settings and maintenance models."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, field_validator


OperatingMode = Literal["normal", "maintenance", "emergency"]
ButtonStyle = Literal["primary", "secondary", "success", "warning", "danger", "outline"]


class AnnouncementButton(BaseModel):
    """A clickable button for the maintenance announcement."""

    model_config = ConfigDict(extra="ignore")

    id: str
    text: str = Field(min_length=1, max_length=50)
    url: str
    style: ButtonStyle = "primary"
    open_in_new_tab: bool = True
    icon: Optional[str] = None
    order: int = 0
    enabled: bool = True

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL cannot be empty")
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must use http:// or https:// protocol")
        return v


class AnnouncementSettings(BaseModel):
    """Rich announcement settings for maintenance/emergency modes."""

    model_config = ConfigDict(extra="ignore")

    enabled: bool = False
    title: str = Field(default="", max_length=100)
    message: str = Field(default="", max_length=2000)
    icon: Optional[str] = None
    buttons: list[AnnouncementButton] = Field(default_factory=list)


class MaintenanceSchedule(BaseModel):
    """Scheduled maintenance configuration."""

    model_config = ConfigDict(extra="ignore")

    enabled: bool = False
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    timezone: str = "UTC"
    announcement_snapshot: Optional[AnnouncementSettings] = None


class SiteSettings(BaseModel):
    """Complete site settings stored in MongoDB."""

    model_config = ConfigDict(extra="ignore")

    operating_mode: OperatingMode = "normal"
    maintenance_mode: bool = False
    announcement: AnnouncementSettings = Field(default_factory=AnnouncementSettings)
    schedule: MaintenanceSchedule = Field(default_factory=MaintenanceSchedule)
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_by: Optional[str] = None


class MaintenanceHistoryEntry(BaseModel):
    """Historical record of maintenance mode changes."""

    model_config = ConfigDict(extra="ignore")

    id: str
    mode: OperatingMode
    started_at: str
    ended_at: Optional[str] = None
    scheduled: bool = False
    admin_id: str
    admin_email: str
    admin_name: Optional[str] = None
    announcement_snapshot: Optional[AnnouncementSettings] = None


DEFAULT_SITE_SETTINGS = SiteSettings()


def new_button_id() -> str:
    import uuid
    return f"btn_{uuid.uuid4().hex[:10]}"


def new_history_id() -> str:
    import uuid
    return f"hist_{uuid.uuid4().hex[:12]}"