import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1280, "height": 1600})
        await page.goto("http://localhost:5000/product/p-1")

        # Wait for content to load
        await page.wait_for_selector("#product-name:not(:has-text('Loading...'))")

        # Check elements
        title = await page.inner_text("#product-name")
        print(f"Title: {title}")

        # Check font size of title
        font_size = await page.evaluate("window.getComputedStyle(document.getElementById('product-name')).fontSize")
        print(f"Title Font Size: {font_size}")

        # Check arrows
        prev_arrow = await page.is_visible("#prev-image")
        next_arrow = await page.is_visible("#next-image")
        print(f"Arrows: Prev={prev_arrow}, Next={next_arrow}")

        # Check carousels
        related = await page.is_visible("#related-products-carousel")
        proposed = await page.is_visible("#proposed-products-carousel")
        print(f"Carousels: Related={related}, Proposed={proposed}")

        # Wait for carousel cards to load
        try:
            await page.wait_for_selector("#related-products-carousel .card", timeout=5000)
            print("Related products cards found.")
        except:
            print("Related products cards NOT found or timeout.")

        try:
            await page.wait_for_selector("#proposed-products-carousel .card", timeout=5000)
            print("Proposed products cards found.")
        except:
            print("Proposed products cards NOT found or timeout.")

        # Full page screenshot
        await page.screenshot(path="product_p1_full_v2.png", full_page=True)

        # Test navigation
        await page.click("#next-image")
        await page.wait_for_timeout(500)

        # Test variant switching
        # Find 'Red' color button
        await page.click("button[data-color='Red']")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="product_p1_red_variant_v2.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(verify())
