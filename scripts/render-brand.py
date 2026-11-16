# Vykreslí obrázky značky do public/: ikony aplikace a náhled odkazu (og-image.png).
# Zdroje jsou v design/brand/ (icon.svg, og-image.html). Potřebuje Python s balíčkem playwright a Chrome.
# Použití (z kořene projektu):  python3 scripts/render-brand.py
import asyncio, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / 'design' / 'brand'
OUT = ROOT / 'public'

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files'])
        icon = (BRAND / 'icon.svg').read_text()
        for name, size in [('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180)]:
            page = await browser.new_page(viewport={'width': size, 'height': size})
            await page.set_content(f'<body style="margin:0">{icon.replace("width=\"512\" height=\"512\"", f"width=\"{size}\" height=\"{size}\"")}</body>')
            await page.screenshot(path=str(OUT / name))
            await page.close()
        page = await browser.new_page(viewport={'width': 1200, 'height': 630})
        await page.goto((BRAND / 'og-image.html').as_uri())
        await page.wait_for_timeout(800)
        await page.screenshot(path=str(OUT / 'og-image.png'))
        await browser.close()

asyncio.run(main())
