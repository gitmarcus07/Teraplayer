from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from pydantic import BaseModel, Field, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None
    auth_provider: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str
    session_token: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=1)
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str


class AuthResponse(BaseModel):
    user: User
    session_token: str


def new_user_id() -> str:
    return f"user_{uuid.uuid4().hex[:12]}"


def session_expiry(days: int = 7) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()

