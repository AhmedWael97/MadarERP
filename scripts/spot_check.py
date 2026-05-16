"""
Quick spot-check: visit 4 suspect 'form never rendered inputs' URLs
and report what's actually on the page. Helps distinguish audit
false-positives from real bugs.
"""
import asyncio
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.async_api import async_playwright

BASE = "http://localhost:5173"
SUSPECTS = [
    # Dashboard stub fix verification
    "/accounting/dashboard",
    "/sales/dashboard",
    "/pos",
    "/settings",
    # FormShell loop fix verification
    "/fleet/vehicles/create",
    "/hr/employees/create",
    "/treasury/banks/create",
    # New report config verification
    "/accounting/reports/general-ledger",
    "/crm/reports/leads",
    "/workshop/reports/job-card-summary",
    # New auto-generated edit routes
    "/treasury/banks/Test/edit",
    "/fleet/vehicles/Test/edit",
    # Regression check — pages that were working before
    "/customers",
    "/sales/orders",
]


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for path in SUSPECTS:
            # Fresh context per URL so earlier page state can't leak in.
            ctx = await browser.new_context()
            page = await ctx.new_page()
            await page.request.post(
                f"{BASE.replace('5173', '8000')}/api/method/login",
                data={"usr": "Administrator", "pwd": "admin"},
            )
            console_msgs = []
            page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
            page.on("pageerror", lambda exc: console_msgs.append(f"[pageerror] {exc}"))

            url = f"{BASE}{path}"
            try:
                await page.goto(url, wait_until="load", timeout=30000)
                await page.wait_for_timeout(15000)
                n_h1 = await page.locator('h1').count()
                h1_text = await page.locator('h1').first.inner_text() if n_h1 > 0 else "(no h1)"
                n_tables = await page.locator('table').count()
                n_inputs = await page.locator(
                    'input[name]:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]),'
                    ' textarea[name], select[name]'
                ).count()
                meaningful = await page.locator('table, [class*="grid"] > a, [class*="grid"] > div[class*="rounded"]').count()
                n_errors = sum(1 for m in console_msgs if '[pageerror]' in m)
                loop_errors = sum(1 for m in console_msgs if 'Maximum update depth' in m)
                status = "OK" if (n_h1 > 0 and h1_text and (n_inputs > 0 or n_tables > 0 or meaningful > 0)) else "FAIL"
                print(f"[{status}] {path} | h1='{h1_text[:40]}' tables={n_tables} inputs={n_inputs} content={meaningful} errors={n_errors} loops={loop_errors}")
            except Exception as e:
                print(f"{path}: EXCEPTION {e}")
            await ctx.close()

        await browser.close()


asyncio.run(main())
