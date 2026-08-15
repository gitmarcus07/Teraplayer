from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict, EmailStr


AdminRole = Literal["SUPER_ADMIN", "ADMIN"]


class Admin(BaseModel):
    """Full admin document (includes password_hash — never serialize this)."""

    model_config = ConfigDict(extra="ignore")

    admin_id: str
    email: str
    name: Optional[str] = None
    role: AdminRole = "ADMIN"
    password_hash: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_login_at: Optional[str] = None


class AdminOut(BaseModel):
    """Public admin representation — never contains password_hash."""

    model_config = ConfigDict(extra="ignore")

    admin_id: str
    email: str
    name: Optional[str] = None
    role: AdminRole
    created_at: str
    last_login_at: Optional[str] = None


class AdminSession(BaseModel):
    model_config = ConfigDict(extra="ignore")

    admin_id: str
    session_token: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: Optional[str] = None
    role: AdminRole = "ADMIN"


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[AdminRole] = None


class AdminPasswordUpdate(BaseModel):
    new_password: str = Field(min_length=8)


def new_admin_id() -> str:
    return f"admin_{uuid.uuid4().hex[:12]}"


def admin_session_expiry(days: int = 7) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()