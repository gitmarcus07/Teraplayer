import re
import httpx
from urllib.parse import urlparse, parse_qs


class TeraBoxEngine:
    def __init__(self):
        pass

    async def close(self):
        pass

    import requests

async def fetch_page(self, url: str) -> str:
    print("Fetching:", url)

    response = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        },
        timeout=20,
        allow_redirects=True,
    )

    print("Status:", response.status_code)

    return response.text

    def extract_surl(self, url: str):
        parsed = urlparse(url)

        if "surl" in parse_qs(parsed.query):
            return parse_qs(parsed.query)["surl"][0]

        m = re.search(r"/s/([^/?]+)", parsed.path)
        if m:
            return m.group(1)

        return None

    async def resolve(self, url: str, password: str = ""):
        html = await self.fetch_page(url)

        return {
            "ok": False,
            "html_length": len(html),
            "surl": self.extract_surl(url),
        }