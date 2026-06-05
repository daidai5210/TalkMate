"""Mobile App UI layout matrix E2E.

Checks no horizontal overflow and touch target size across app pages and viewports.
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEST_USER = f"mobile_layout_{int(time.time())}"
TEST_PASSWORD = "MobileLayout123"
SCREENSHOT_DIR = PROJECT_ROOT / "evidence/2026-06-05-mobile-app-ui/layout"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    ("iphone-se-width", 375, 812),
    ("iphone-12-width", 390, 844),
    ("large-phone", 430, 932),
    ("tablet", 768, 1024),
    ("desktop", 1440, 900),
]


def assert_true(condition: bool, label: str) -> None:
    if not condition:
        print(f"  FAIL: {label}")
        sys.exit(1)
    print(f"  OK: {label}")


def check_layout(page: Page, name: str, page_name: str) -> None:
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
    )
    assert_true(not overflow, f"{name}/{page_name}: no horizontal overflow")
    small_targets = page.evaluate(
        """
        () => Array.from(document.querySelectorAll('button, a, input, textarea'))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if (el.getAttribute('aria-hidden') === 'true') return false;
            return rect.width > 0 && rect.height > 0 && rect.height < 36;
          })
          .map((el) => ({
            tag: el.tagName,
            text: (el.textContent || el.getAttribute('aria-label') || '').trim(),
            height: Math.round(el.getBoundingClientRect().height),
          }))
        """
    )
    assert_true(small_targets == [], f"{name}/{page_name}: no tiny visible controls {small_targets}")
    page.screenshot(path=str(SCREENSHOT_DIR / f"{name}-{page_name}.png"), full_page=True)


def prepare_authenticated_flow(page: Page) -> tuple[str, str]:
    page.goto(f"{BASE_URL}/register")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.fill("#confirm", TEST_PASSWORD)
    page.fill("#captcha", "1234")
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.wait_for_selector('[data-testid="scenario-card-1"]', timeout=10000)
    page.locator('[data-testid="scenario-card-1"]').click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    page.fill('[data-testid="message-textarea"]', "I need to practice a short answer.")
    page.click('[data-testid="message-send-button"]')
    page.wait_for_selector('[data-testid="message-ai"]', timeout=15000)
    page.click('[data-testid="end-conversation-button"]')
    page.wait_for_url(lambda url: "/summary" in url, timeout=30000)
    summary_url = page.url
    page.click('[data-testid="summary-home-button"]')
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.wait_for_selector('[data-testid="history-item-link"]', timeout=10000)
    page.locator('[data-testid="history-item-link"]').first.click()
    page.wait_for_url(lambda url: "/conversation/history/" in url, timeout=10000)
    history_url = page.url
    return summary_url, history_url


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page = context.new_page()
        summary_url, history_url = prepare_authenticated_flow(page)
        storage = context.storage_state()
        context.close()

        for name, width, height in VIEWPORTS:
            is_mobile = width <= 430
            ctx = browser.new_context(
                viewport={"width": width, "height": height},
                is_mobile=is_mobile,
                storage_state=storage,
            )
            pg = ctx.new_page()
            pg.goto(f"{BASE_URL}/login")
            check_layout(pg, name, "login")
            pg.goto(f"{BASE_URL}/register")
            check_layout(pg, name, "register")
            pg.goto(f"{BASE_URL}/")
            pg.wait_for_selector('[data-testid="scenario-list"]', timeout=10000)
            check_layout(pg, name, "home")
            pg.goto(history_url)
            pg.wait_for_selector('[data-testid="history-readonly-tip"]', timeout=10000)
            check_layout(pg, name, "history")
            pg.goto(summary_url)
            pg.wait_for_selector('[data-testid="summary-page"]', timeout=10000)
            check_layout(pg, name, "summary")
            ctx.close()

        browser.close()
    print("\n=== Mobile layout matrix passed ===")


if __name__ == "__main__":
    main()
