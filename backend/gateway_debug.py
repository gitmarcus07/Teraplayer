import asyncio
from dotenv import load_dotenv

load_dotenv()

from terabox_gateway import fetch_download_link

async def main():
    url = input("Link: ").strip()

    result = await fetch_download_link(url)

    print("\n===== RAW RESULT =====")
    from pprint import pprint
    pprint(result)

asyncio.run(main())