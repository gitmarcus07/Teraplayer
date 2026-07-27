import asyncio
from playwright.async_api import async_playwright

URL = "https://1024terabox.com/s/1k41aPEZ3qLdE3Ux9Fa6_oQ"


async def handle_request(request):
    url = request.url.lower()

    keywords = [
        "share",
        "stream",
        "play",
        "media",
        "video",
        "download",
        "dlink",
        "m3u8",
        ".mp4",
        "mediameta",
        "api",
    ]

    if any(k in url for k in keywords):
        print("\n========== REQUEST ==========")
        print(request.method)
        print(request.url)


async def handle_response(response):
    url = response.url.lower()

    keywords = [
        "share",
        "stream",
        "play",
        "media",
        "video",
        "download",
        "dlink",
        "m3u8",
        ".mp4",
        "mediameta",
        "api",
    ]

    if any(k in url for k in keywords):
        print("\n========== RESPONSE ==========")
        print("Status :", response.status)
        print("URL    :", response.url)


async def main():
    async with async_playwright() as p:

        browser = await p.chromium.launch(
            headless=False
        )

        page = await browser.new_page(
            viewport={"width": 1600, "height": 900}
        )

        page.on("request", handle_request)
        page.on("response", handle_response)

        print("Opening page...\n")

        await page.goto(
            URL,
            wait_until="networkidle",
            timeout=60000,
        )

        print("\nPage loaded.")

        await page.wait_for_timeout(3000)

        print("\nTrying to click video...")

        try:
            await page.locator("video").first.click(timeout=3000)
            print("Clicked <video>")
        except:
            pass

        try:
            await page.locator("button").first.click(timeout=3000)
        except:
            pass

        try:
            await page.mouse.click(900, 450)
        except:
            pass

        print("\nLet the video play for about 20 seconds...")
        print("If needed, click Play manually.")
        print("If there is a quality button, change quality once.")
        print("Pause and resume once.\n")

        await page.wait_for_timeout(20000)

        print("\nFinished monitoring network.")
        input("Press ENTER to close browser...")

        await browser.close()


asyncio.run(main())