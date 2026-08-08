"""Native TeraPlayer authentication helpers.

Handles signup/login with bcrypt password hashing, session token
creation/verification, and user document management in MongoDB.
"""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

import bcrypt
from fastapi import Request, HTTPException

from models.auth import User, UserCreate, UserLogin, new_user_id, session_expiry

logger = logging.getLogger("teraplayer.auth")


def hash_password(password: str) -> str:
    """Salt and hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


async def signup_user(db, payload: UserCreate) -> tuple[User, str]:
    """Register a new user. Raises HTTPException(409) on duplicate email."""
    email = (payload.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="User already registered")

    user_id = new_user_id()
    password_hash = hash_password(payload.password)
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": payload.name,
        "picture": None,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)

    session_token = await _create_session(db, user_id)
    return await _build_user(db, user_id), session_token


async def login_user(db, payload: UserLogin) -> tuple[User, str]:
    """Authenticate a user by email + password. Raises HTTPException(401) on failure."""
    email = (payload.email or "").strip().lower()
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_hash = user_doc.get("password_hash") or ""
    if not verify_password(payload.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session_token = await _create_session(db, user_doc["user_id"])
    return await _build_user(db, user_doc["user_id"]), session_token


async def _create_session(db, user_id: str) -> str:
    """Create a new session token and persist it. Returns the token."""
    session_token = secrets.token_urlsafe(32)
    expires_at = session_expiry(days=7)
    await db.user_sessions.insert_one(
        {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return session_token


async def _build_user(db, user_id: str) -> User:
    """Fetch a user document without password_hash and return a User model."""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return User(**user_doc)


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

    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0}
    )
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
