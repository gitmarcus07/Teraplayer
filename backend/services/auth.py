"""Emergent-managed Google Auth helpers.

Verifies session tokens from cookie or Authorization header, exchanges a
session_id received from Emergent Auth callback for a session_token, and
returns the currently authenticated user (if any).
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import Request, HTTPException

from models.auth import User, new_user_id, session_expiry

logger = logging.getLogger("teraplayer.auth")

SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


async def exchange_session_id(session_id: str, db) -> tuple[User, str]:
    """Exchange a session_id (from URL fragment) for user data + session_token."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            SESSION_DATA_URL,
            headers={"X-Session-ID": session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = resp.json()

    email = (data.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="No email returned by provider")

    session_token = data["session_token"]

    # Upsert user by email
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name"), "picture": data.get("picture")}},
        )
    else:
        user_id = new_user_id()
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user_doc)

    expires_at = session_expiry(days=7)
    await db.user_sessions.insert_one(
        {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user_doc), session_token


def _extract_token(request: Request) -> Optional[str]:
    token = request.cookies.get("session_token")
    if token:
        return token
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return None


async def get_current_user(request: Request, db) -> Optional[User]:
    """Return the current authenticated user, or None if anonymous."""
    token = _extract_token(request)
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None

    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        try:
            expires_at = datetime.fromisoformat(expires_at)
        except ValueError:
            return None
    if getattr(expires_at, "tzinfo", None) is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    return User(**user_doc)


async def require_user(request: Request, db) -> User:
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def logout(request: Request, db) -> None:
    token = _extract_token(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
