import os, sys
from dotenv import load_dotenv
load_dotenv()

import asyncio, bcrypt, uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "teraplayer")]
    await db.admins.delete_many({})
    pwd_hash = bcrypt.hashpw(os.environ["ADMIN_PASSWORD"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    await db.admins.insert_one({
        "admin_id": f"admin_{uuid.uuid4().hex[:12]}",
        "email": os.environ["ADMIN_EMAIL"].strip().lower(),
        "name": "Super Admin",
        "role": "SUPER_ADMIN",
        "password_hash": pwd_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login_at": None
    })
    print(f"Admin reset! Login with: {os.environ['ADMIN_EMAIL'].strip().lower()} / {os.environ['ADMIN_PASSWORD']}")
    client.close()

asyncio.run(main())
