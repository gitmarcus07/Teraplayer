from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional
import uuid

from pydantic import BaseModel, Field, ConfigDict


class TeraboxFile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    size: Optional[int] = None
    size_str: Optional[str] = None
    duration: Optional[int] = None
    resolution: Optional[str] = None
    thumbnail: Optional[str] = None
    download_url: Optional[str] = None
    stream_url: Optional[str] = None
    file_type: Optional[str] = None


class PreviewRequest(BaseModel):
    url: str


class PreviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ok: bool
    source: Optional[str] = None
    error: Optional[str] = None
    password_required: Optional[bool] = False
    password_incorrect: Optional[bool] = False
    title: Optional[str] = None
    size: Optional[int] = None
    size_str: Optional[str] = None
    duration: Optional[int] = None
    resolution: Optional[str] = None
    thumbnail: Optional[str] = None
    download_url: Optional[str] = None
    stream_url: Optional[str] = None
    file_type: Optional[str] = None
    files: List[TeraboxFile] = Field(default_factory=list)


class HistoryEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    url: str
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    size_str: Optional[str] = None
    file_type: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class HistoryCreate(BaseModel):
    session_id: str
    url: str
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    size_str: Optional[str] = None
    file_type: Optional[str] = None


class FavoriteEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    url: str
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    size_str: Optional[str] = None
    file_type: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class FavoriteCreate(BaseModel):
    session_id: str
    url: str
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    size_str: Optional[str] = None
    file_type: Optional[str] = None
