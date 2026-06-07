"""Phase 2 E2E: bottom tab navigation, new pages, practice card, profile stats.

Flow: login -> home tab -> training tab -> profile tab -> practice card -> summary -> logout.
Requires backend (port 8000) and frontend dev server running.
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:4180")
PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEST_USER = f"phase2_e2e_{int(time.time())}"
TEST_PASSWORD = "Phase2E2E123"
SCREENSHOT_DIR = PROJECT_ROOT / "evidence/phase2-e2e"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

FAILED = False


def step(name: str) -> None:
    print(f"\n=== {name} ===", flush=True)


def check(condition: bool, label: str) -> None:
    global FAILED
    if not condition:
        print(f"  FAIL: {label}")
        FAILED = True
    else:
        print(f"  OK: {label}")


def no_horizontal_overflow(page: Page, label: str) -> None:
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
    )
    check(not overflow, f"{label}: no horizontal overflow")


def register_and_login(page: Page) -> None:
    step("register")
    page.goto(f"{BASE_URL}/register")
    page.wait_for_selector("#username", timeout=10000)
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
    page.wait_for_url(f"{BASE_URL}/app/home", timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "02-home.png"), full_page=True)
    no_horizontal_overflow(page, "home tab")


def test_bottom_navigation(page: Page) -> None:
    step("bottom tab navigation")
    check(page.url.endswith("/app/home"), "on home tab")
    page.wait_for_selector('[data-testid="home-hero"]', timeout=10000)
    check(page.locator('[data-testid="home-hero"]').is_visible(), "home hero visible")

    page.click("a[href='/app/scenarios']")
    page.wait_for_url(f"{BASE_URL}/app/scenarios", timeout=10000)
    page.wait_for_selector('[data-testid="training-conversation-card"]', timeout=10000)
    check(page.locator('[data-testid="training-conversation-card"]').first.is_visible(), "training conversation card visible")
    page.screenshot(path=str(SCREENSHOT_DIR / "03-scenarios.png"), full_page=True)
    no_horizontal_overflow(page, "scenarios tab")

    page.click("a[href='/app/profile']")
    page.wait_for_url(f"{BASE_URL}/app/profile", timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "04-profile.png"), full_page=True)
    no_horizontal_overflow(page, "profile tab")

    page.click("a[href='/app/home']")
    page.wait_for_url(f"{BASE_URL}/app/home", timeout=10000)
    check(page.locator('[data-testid="home-hero"]').is_visible(), "back to home tab")


def test_home_page(page: Page) -> None:
    step("home page content")
    page.goto(f"{BASE_URL}/app/home")
    page.wait_for_selector('[data-testid="home-hero"]', timeout=10000)

    check(page.locator('[data-testid="home-hero"]').is_visible(), "home hero visible")
    check(
        page.locator('[data-testid="home-history"], [data-testid="home-empty"]').is_visible(),
        "history or empty visible",
    )
    page.screenshot(path=str(SCREENSHOT_DIR / "05-home-full.png"), full_page=True)


def test_training_page(page: Page) -> None:
    step("training page content")
    page.goto(f"{BASE_URL}/app/scenarios")
    page.wait_for_selector('[data-testid="training-conversation-card"]', timeout=10000)

    check(page.locator('[data-testid="training-conversation-card"]').first.is_visible(), "scenario card visible")

    page.locator('[data-testid="training-conversation-card"]').first.click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    page.wait_for_selector('[data-testid="conversation-page"]', timeout=10000)
    check(page.locator('[data-testid="conversation-page"]').is_visible(), "conversation page loaded")
    page.screenshot(path=str(SCREENSHOT_DIR / "06-conversation.png"), full_page=True)
    no_horizontal_overflow(page, "conversation page")


def test_practice_card_flow(page: Page) -> None:
    step("practice card flow")
    page.goto(f"{BASE_URL}/app/home")
    page.wait_for_selector('[data-testid="home-hero"]', timeout=10000)
    # 从首页直接进入抽卡
    page.goto(f"{BASE_URL}/practice-card")
    page.wait_for_url(f"{BASE_URL}/practice-card", timeout=10000)
    page.wait_for_selector('[data-testid="practice-card"]', timeout=10000)

    check(page.locator('[data-testid="practice-card"]').is_visible(), "practice card visible")
    page.screenshot(path=str(SCREENSHOT_DIR / "07-practice-card.png"), full_page=True)
    no_horizontal_overflow(page, "practice card")


def test_profile_page(page: Page) -> None:
    step("profile page content")
    page.goto(f"{BASE_URL}/app/profile")

    page.wait_for_selector(
        '[data-testid="profile-empty"], [data-testid="profile-stats"]',
        timeout=10000,
    )

    if page.locator('[data-testid="profile-empty"]').is_visible():
        check(page.locator('[data-testid="profile-empty"]').is_visible(), "profile empty state")
        check("还没有练习数据" in page.content(), "empty message in Chinese")
        page.screenshot(path=str(SCREENSHOT_DIR / "08-profile-empty.png"), full_page=True)
    else:
        check(page.locator('[data-testid="profile-stats"]').is_visible(), "profile stats visible")
        check(page.locator('[data-testid="profile-heatmap"]').is_visible(), "heatmap visible")
        check(page.locator('[data-testid="profile-achievements"]').is_visible(), "achievements visible")
        check(page.locator('[data-testid="profile-trend"]').is_visible(), "score trend visible")
        check(page.locator('[data-testid="profile-reports"]').is_visible(), "reports visible")
        page.screenshot(path=str(SCREENSHOT_DIR / "08-profile-with-data.png"), full_page=True)

    no_horizontal_overflow(page, "profile page")


def test_logout(page: Page) -> None:
    step("logout")
    page.goto(f"{BASE_URL}/app/profile")
    page.wait_for_selector('[data-testid="profile-empty"], [data-testid="profile-stats"]', timeout=10000)
    page.click("text=退出")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    token = page.evaluate("localStorage.getItem('talkmate_token')")
    check(token is None, "token cleared after logout")
    page.screenshot(path=str(SCREENSHOT_DIR / "10-logout.png"), full_page=True)


def main() -> None:
    global FAILED
    print(f"E2E base URL: {BASE_URL}")
    print(f"Test user: {TEST_USER}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True)
        page = context.new_page()
        try:
            register_and_login(page)
            test_bottom_navigation(page)
            test_home_page(page)
            test_training_page(page)
            test_practice_card_flow(page)
            test_profile_page(page)
            test_logout(page)

            if FAILED:
                print("\n=== Phase 2 E2E FAILED (some checks failed) ===")
                sys.exit(1)
            else:
                print("\n=== Phase 2 E2E passed ===")
        except Exception as exc:
            page.screenshot(path=str(SCREENSHOT_DIR / "FAILURE.png"), full_page=True)
            print(f"\nE2E crashed: {exc}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
