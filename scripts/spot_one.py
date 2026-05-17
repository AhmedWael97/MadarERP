"""Test a single URL in fresh context. Used to verify isolated page behavior."""
import asyncio
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.async_api import async_playwright


async def check(path):
    BASE = "http://localhost:5173"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        await page.request.post(
            f"{BASE.replace('5173', '8000')}/api/method/login",
            data={"usr": "Administrator", "pwd": "admin"},
        )
        await page.goto(f"{BASE}/dashboard", wait_until="load", timeout=60000)
        await page.wait_for_timeout(2000)

        console_msgs = []
        page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text[:200]}"))
        page.on("pageerror", lambda exc: console_msgs.append(f"[pageerror] {str(exc)[:200]}"))

        url = f"{BASE}{path}"
        await page.goto(url, wait_until="load", timeout=60000)
        await page.wait_for_timeout(15000)

        n_h1 = await page.locator('h1').count()
        h1_text = await page.locator('h1').first.inner_text() if n_h1 > 0 else "(no h1)"
        n_tables = await page.locator('table').count()
        n_rows = await page.locator('table tbody tr').count()
        n_inputs = await page.locator(
            'input[name]:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]),'
            ' textarea[name], select[name]'
        ).count()
        body_text = (await page.locator('body').inner_text())[:300]
        errors = [m for m in console_msgs if '[error]' in m or '[pageerror]' in m]
        print(f"=== {path} ===")
        print(f"  h1 count={n_h1}, text='{h1_text}'")
        print(f"  tables={n_tables}, rows={n_rows}, named inputs={n_inputs}")
        print(f"  body[:300]: {body_text!r}")
        print(f"  errors ({len(errors)}):")
        for m in errors[:8]:
            print(f"    {m}")

        await browser.close()


if len(sys.argv) > 1:
    arg = sys.argv[1].lstrip("/")
    path = "/" + arg
else:
    path = "/suppliers"
asyncio.run(check(path))
