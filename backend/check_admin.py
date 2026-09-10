import os, sys
from dotenv import load_dotenv
load_dotenv()

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
MONGO_URL = os.environ.get("MONGO_URL", "")
DB_NAME = os.environ.get("DB_NAME", "teraplayer")

print(f"ADMIN_EMAIL: {ADMIN_EMAIL}")
print(f"ADMIN_PASSWORD: {ADMIN_PASSWORD}")
print(f"MONGO_URL: {MONGO_URL}")
print(f"DB_NAME: {DB_NAME}")
print()

if not MONGO_URL or not ADMIN_EMAIL or not ADMIN_PASSWORD:
    print("ERROR: Missing env vars. Check your .env file.")
    sys.exit(1)

import asyncio, bcrypt, uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    try:
        count = await db.admins.count_documents({})
        print(f"Admin accounts in DB: {count}")
        admins = await db.admins.find({}, {"password_hash": 0, "_id": 0}).to_list(length=10)
        for a in admins:
            print(f"  Found admin: {a.get('email')} (role: {a.get('role')})")

        if count == 0:
            pwd_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            await db.admins.insert_one({
                "admin_id": f"admin_{uuid.uuid4().hex[:12]}",
                "email": ADMIN_EMAIL.strip().lower(),
                "name": "Super Admin",
                "role": "SUPER_ADMIN",
                "password_hash": pwd_hash,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login_at": None
            })
            print(f"\nAdmin created: {ADMIN_EMAIL.strip().lower()} / {ADMIN_PASSWORD}")
        else:
            print("\nAdmin already exists. If login fails, the password hash may be wrong.")
            print(f"To fix, delete all admins: db.admins.delete_many({{}}) then restart the server.")
    except Exception as e:
        print(f"ERROR: {e}")
        print("Make sure MongoDB Atlas is accessible and the connection string is correct.")
    finally:
        client.close()

asyncio.run(main())
