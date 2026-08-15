"""Admin authentication & management helpers.

Separate from the public user auth (services/auth.py). Admins are stored in
the `admins` collection, sessions in `admin_sessions` (TTL-indexed), and the
session token lives in an httpOnly `admin_session` cookie.

Security model:
  - Passwords are hashed with bcrypt (same library as public auth).
  - Sessions are random 256-bit tokens stored in MongoDB.
  - Role checks happen server-side — the frontend is never trusted.
  - State-changing admin requests require an `X-Admin-CSRF` header so that
    cross-site request forgery is blocked (cookies are SameSite=None for
    cross-origin deployments).
"""
from __future__ import annotations

import asyncio
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

import bcrypt
from fastapi import Request, HTTPException
from pymongo import ASCENDING, IndexModel

from models.admin import (
    Admin,
    AdminCreate,
    AdminOut,
    AdminUpdate,
    admin_session_expiry,
    new_admin_id,
)

logger = logging.getLogger("teraplayer.admin")

ADMIN_SESSION_COOKIE = "admin_session"
CSRF_HEADER = "X-Admin-CSRF"
ADMIN_SESSION_DAYS = 7


def hash_password(password: str) -> str:
    """Salt and hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


async def ensure_indexes(db) -> None:
    """Create indexes for the admins/admin_sessions collections."""
    await db.admins.create_index("email", unique=True)
    existing = await db.admin_sessions.index_information()
    if "expires_at_ttl" not in existing:
        await db.admin_sessions.create_indexes(
            [IndexModel([("expires_at", ASCENDING)], name="expires_at_ttl", expireAfterSeconds=0)]
        )
        logger.info("Created TTL index on admin_sessions.expires_at")


async def bootstrap_super_admin(db) -> None:
    """Create the initial SUPER_ADMIN from env vars when no admins exist.

    Only runs when the admins collection is empty. Logs a clear warning when
    ADMIN_EMAIL/ADMIN_PASSWORD are missing so operators know to configure them.
    """
    import os

    try:
        count = await db.admins.count_documents({})
    except Exception as exc:  # noqa: BLE001
        logger.warning("bootstrap_super_admin: could not read admins collection", exc_info=exc)
        return

    if count > 0:
        return

    email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD") or ""
    if not email or not password:
        logger.warning(
            "No admins exist and ADMIN_EMAIL/ADMIN_PASSWORD are not set. "
            "Set both env vars and restart to bootstrap the initial SUPER_ADMIN."
        )
        return
    if len(password) < 8:
        logger.warning("ADMIN_PASSWORD is shorter than 8 characters — bootstrap aborted.")
        return

    await db.admins.insert_one(
        {
            "admin_id": new_admin_id(),
            "email": email,
            "name": "Super Admin",
            "role": "SUPER_ADMIN",
            "password_hash": hash_password(password),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login_at": None,
        }
    )
    logger.info("Bootstrapped initial SUPER_ADMIN from environment")


def _to_admin_out(doc) -> AdminOut:
    return AdminOut(
        admin_id=doc["admin_id"],
        email=doc["email"],
        name=doc.get("name"),
        role=doc["role"],
        created_at=doc.get("created_at") or "",
        last_login_at=doc.get("last_login_at"),
    )


async def authenticate_admin(db, email: str, password: str) -> AdminOut:
    """Verify credentials and return an AdminOut. Raises 401 on failure."""
    email = (email or "").strip().lower()
    if not email or not password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    doc = await db.admins.find_one({"email": email}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    stored = doc.get("password_hash") or ""
    if not verify_password(password, stored):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    now = datetime.now(timezone.utc).isoformat()
    await db.admins.update_one({"admin_id": doc["admin_id"]}, {"$set": {"last_login_at": now}})
    doc["last_login_at"] = now
    return _to_admin_out(doc)


async def create_session(db, admin_id: str) -> str:
    """Create a new admin session token and persist it."""
    token = secrets.token_urlsafe(32)
    await db.admin_sessions.insert_one(
        {
            "admin_id": admin_id,
            "session_token": token,
            "expires_at": admin_session_expiry(days=ADMIN_SESSION_DAYS),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return token


async def delete_session(db, token: Optional[str]) -> None:
    if token:
        await db.admin_sessions.delete_one({"session_token": token})


def _extract_admin_token(request: Request) -> Optional[str]:
    return request.cookies.get(ADMIN_SESSION_COOKIE)


async def get_current_admin(request: Request, db) -> Optional[AdminOut]:
    """Resolve the current admin from the cookie, or None if not authenticated."""
    token = _extract_admin_token(request)
    if not token:
        return None
    session = await db.admin_sessions.find_one({"session_token": token}, {"_id": 0})
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

    doc = await db.admins.find_one({"admin_id": session["admin_id"]}, {"_id": 0})
    if not doc:
        return None
    return _to_admin_out(doc)


async def require_admin(request: Request, db) -> AdminOut:
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB not configured")
    admin = await get_current_admin(request, db)
    if not admin:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return admin


async def require_super_admin(request: Request, db) -> AdminOut:
    admin = await require_admin(request, db)
    if admin.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super admin privileges required")
    return admin


def require_csrf_header(request: Request) -> None:
    """Reject state-changing requests that lack the CSRF header.

    Browsers cannot attach custom headers on cross-site form submissions, so a
    missing header on a non-GET request means it was not initiated by our own
    frontend JS.
    """
    if not request.headers.get(CSRF_HEADER):
        raise HTTPException(status_code=403, detail="Missing CSRF header")


async def list_admins(db) -> list[AdminOut]:
    docs = await db.admins.find({}, {"_id": 0}).sort("created_at", 1).to_list(length=1000)
    return [_to_admin_out(d) for d in docs]


async def create_admin(db, payload: AdminCreate) -> AdminOut:
    email = (payload.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    existing = await db.admins.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="An admin with this email already exists")
    doc = {
        "admin_id": new_admin_id(),
        "email": email,
        "name": payload.name,
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login_at": None,
    }
    await db.admins.insert_one(doc)
    return _to_admin_out(doc)


async def update_admin(db, admin_id: str, payload: AdminUpdate, acting_admin: AdminOut) -> AdminOut:
    doc = await db.admins.find_one({"admin_id": admin_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Admin not found")

    changes: dict = {}
    if payload.name is not None:
        changes["name"] = payload.name
    if payload.role is not None:
        if doc["role"] == "SUPER_ADMIN" and payload.role != "SUPER_ADMIN" and acting_admin.admin_id == admin_id:
            raise HTTPException(status_code=400, detail="You cannot demote your own super admin role")
        changes["role"] = payload.role

    if not changes:
        return _to_admin_out(doc)
    await db.admins.update_one({"admin_id": admin_id}, {"$set": changes})
    doc.update(changes)
    return _to_admin_out(doc)


async def set_admin_password(db, admin_id: str, new_password: str) -> None:
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    doc = await db.admins.find_one({"admin_id": admin_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Admin not found")
    await db.admins.update_one(
        {"admin_id": admin_id},
        {"$set": {"password_hash": hash_password(new_password)}},
    )


async def delete_admin(db, admin_id: str, acting_admin: AdminOut) -> None:
    doc = await db.admins.find_one({"admin_id": admin_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Admin not found")
    if doc["admin_id"] == acting_admin.admin_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    if doc["role"] == "SUPER_ADMIN":
        remaining_supers = await db.admins.count_documents({"role": "SUPER_ADMIN"})
        if remaining_supers <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last super admin")

    await db.admins.delete_one({"admin_id": admin_id})
    await db.admin_sessions.delete_many({"admin_id": admin_id})