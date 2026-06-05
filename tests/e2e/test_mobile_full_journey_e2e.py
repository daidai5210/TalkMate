"""Mobile App UI full user journey E2E.

Flow: register -> login -> home -> 10-turn conversation -> summary -> history replay -> logout.
Requires backend and frontend dev servers.
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
TEST_USER = f"mobile_full_{int(time.time())}"
TEST_PASSWORD = "MobileFull123"
SCREENSHOT_DIR = Path("/home/user13/Desktop/talkmate/evidence/2026-06-05-mobile-app-ui/full-journey")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def step(name: str) -> None:
    print(f"\n=== {name} ===", flush=True)


def assert_true(condition: bool, label: str) -> None:
    if not condition:
        print(f"  FAIL: {label}")
        sys.exit(1)
    print(f"  OK: {label}")


def no_horizontal_overflow(page: Page, label: str) -> None:
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
    )
    assert_true(not overflow, f"{label}: no horizontal overflow")


def register_and_login(page: Page) -> None:
    step("register")
    page.goto(f"{BASE_URL}/register")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.fill("#confirm", TEST_PASSWORD)
    page.fill("#captcha", "1234")
    page.screenshot(path=str(SCREENSHOT_DIR / "01-register.png"), full_page=True)
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)

    step("login")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.wait_for_selector('[data-testid="scenario-list"]', timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "02-home.png"), full_page=True)
    no_horizontal_overflow(page, "home")


def run_full_journey(page: Page) -> None:
    register_and_login(page)

    step("home empty/history and start first task")
    page.wait_for_selector('[data-testid="scenario-card-1"]', timeout=10000)
    page.locator('[data-testid="scenario-card-1"]').click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    page.wait_for_selector('[data-testid="conversation-page"]', timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "03-conversation-empty.png"), full_page=True)
    no_horizontal_overflow(page, "conversation empty")

    step("send 10 conversation turns")
    for index in range(10):
        text = f"Turn {index + 1}: I want to practice speaking English clearly."
        page.fill('[data-testid="message-textarea"]', text)
        page.click('[data-testid="message-send-button"]')
        page.wait_for_function(
            f"document.querySelectorAll('[data-testid=\"message-user\"]').length >= {index + 1}",
            timeout=10000,
        )
        page.wait_for_function(
            f"document.querySelectorAll('[data-testid=\"message-ai\"]').length >= {index + 1}",
            timeout=15000,
        )

    user_count = page.locator('[data-testid="message-user"]').count()
    ai_count = page.locator('[data-testid="message-ai"]').count()
    assert_true(user_count >= 10, f"user messages >= 10, actual={user_count}")
    assert_true(ai_count >= 10, f"ai messages >= 10, actual={ai_count}")
    page.screenshot(path=str(SCREENSHOT_DIR / "04-conversation-10-turns.png"), full_page=True)
    no_horizontal_overflow(page, "conversation 10 turns")

    step("generate summary")
    page.click('[data-testid="end-conversation-button"]')
    page.wait_for_url(lambda url: "/summary" in url, timeout=30000)
    page.wait_for_selector('[data-testid="summary-page"]', timeout=30000)
    page.wait_for_selector('[data-testid="summary-score"]', timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "05-summary.png"), full_page=True)
    no_horizontal_overflow(page, "summary")

    step("history replay")
    page.click('[data-testid="summary-home-button"]')
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.wait_for_selector('[data-testid="history-list"], [data-testid="history-empty"]', timeout=10000)
    assert_true(page.locator('[data-testid="history-item-link"]').count() >= 1, "history record exists")
    page.locator('[data-testid="history-item-link"]').first.click()
    page.wait_for_url(lambda url: "/conversation/history/" in url, timeout=10000)
    page.wait_for_selector('[data-testid="history-readonly-tip"]', timeout=10000)
    assert_true(page.locator('[data-testid="message-input-form"]').count() == 0, "history is readonly")
    page.screenshot(path=str(SCREENSHOT_DIR / "06-history-readonly.png"), full_page=True)
    no_horizontal_overflow(page, "history readonly")

    step("logout")
    page.click('[data-testid="back-to-scenarios"]')
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.click('[data-testid="logout-button"]')
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    assert_true(page.evaluate("localStorage.getItem('talkmate_token')") is None, "token cleared")


def main() -> None:
    print(f"E2E base URL: {BASE_URL}")
    print(f"Test user: {TEST_USER}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True)
        page = context.new_page()
        try:
            run_full_journey(page)
            print("\n=== Mobile full journey passed ===")
        except Exception as exc:
            page.screenshot(path=str(SCREENSHOT_DIR / "FAILURE.png"), full_page=True)
            print(f"\nE2E failed: {exc}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
