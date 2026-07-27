# import asyncio
# from terabox_gateway import fetch_direct_links

# async def main():
#     url = input("Link: ").strip()

#     result = await fetch_direct_links(url)

#     print("\n===== RESULT =====")
#     print(result)

# asyncio.run(main())

import asyncio
from dotenv import load_dotenv

load_dotenv()

from terabox_gateway import fetch_direct_links

async def main():
    url = input("Link: ").strip()

    result = await fetch_direct_links(url)

    print("\n===== RESULT =====")
    print(result)

asyncio.run(main())