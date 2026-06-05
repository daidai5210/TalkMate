"""Mobile App UI state coverage E2E."""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEST_USER = f"mobile_states_{int(time.time())}"
TEST_PASSWORD = "MobileStates123"
SCREENSHOT_DIR = PROJECT_ROOT / "evidence/2026-06-05-mobile-app-ui/states"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

MOCK_SPEECH_API = """
(() => {
  window.__lastSRInstance = null;
  class MockSR {
    constructor() {
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      window.__lastSRInstance = this;
    }
    start() { this.onstart && this.onstart(); }
    stop() { this.onend && this.onend(); }
    abort() { this.onend && this.onend(); }
  }
  window.SpeechRecognition = MockSR;
  window.webkitSpeechRecognition = MockSR;
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: () => {}, cancel: () => {}, getVoices: () => [] },
    writable: true,
    configurable: true,
  });
})();
"""


def assert_true(condition: bool, label: str) -> None:
    if not condition:
        print(f"  FAIL: {label}")
        sys.exit(1)
    print(f"  OK: {label}")


def register_login(page: Page) -> None:
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


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True)
        context.add_init_script(MOCK_SPEECH_API)
        page = context.new_page()

        page.goto(f"{BASE_URL}/login")
        page.fill("#username", "not_exist")
        page.fill("#password", "WrongPass1")
        page.click("button[type=submit]")
        page.wait_for_selector("text=用户名不存在", timeout=10000)
        page.screenshot(path=str(SCREENSHOT_DIR / "01-login-error.png"), full_page=True)

        page.goto(f"{BASE_URL}/register")
        page.fill("#username", f"{TEST_USER}_bad")
        page.fill("#password", TEST_PASSWORD)
        page.fill("#confirm", "Different123")
        assert_true(page.locator("text=两次密码不一致").count() == 1, "register mismatch visible")
        assert_true(not page.locator("button[type=submit]").is_enabled(), "register button disabled on mismatch")
        page.screenshot(path=str(SCREENSHOT_DIR / "02-register-mismatch.png"), full_page=True)

        page.fill("#confirm", TEST_PASSWORD)
        page.fill("#captcha", "0000")
        page.click("button[type=submit]")
        page.wait_for_selector("text=验证码错误", timeout=10000)
        page.screenshot(path=str(SCREENSHOT_DIR / "03-register-captcha-error.png"), full_page=True)

        register_login(page)
        page.wait_for_selector('[data-testid="history-empty"]', timeout=10000)
        page.screenshot(path=str(SCREENSHOT_DIR / "04-home-empty-history.png"), full_page=True)

        page.locator('[data-testid="scenario-card-1"]').click()
        page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
        page.wait_for_selector('[data-testid="message-input-form"]', timeout=10000)
        page.click('[data-testid="voice-recorder-button"]')
        page.wait_for_function(
            "document.querySelector('[data-testid=\"voice-recorder-button\"]').getAttribute('data-recording') === 'true'",
            timeout=5000,
        )
        page.screenshot(path=str(SCREENSHOT_DIR / "05-voice-recording.png"), full_page=True)
        page.click('[data-testid="voice-recorder-button"]')

        page.fill('[data-testid="message-textarea"]', "I want to test the thinking state.")
        page.click('[data-testid="message-send-button"]')
        page.wait_for_selector('[data-testid="ai-thinking"]', timeout=5000)
        page.screenshot(path=str(SCREENSHOT_DIR / "06-ai-thinking.png"), full_page=True)
        page.wait_for_selector('[data-testid="message-ai"]', timeout=15000)

        page.click('[data-testid="back-to-scenarios"]')
        page.wait_for_url(f"{BASE_URL}/", timeout=10000)
        page.locator('[data-testid="history-item-link"]').first.click()
        page.wait_for_selector('[data-testid="history-readonly-tip"]', timeout=10000)
        assert_true(page.locator('[data-testid="message-input-form"]').count() == 0, "history input hidden")
        page.screenshot(path=str(SCREENSHOT_DIR / "07-history-readonly.png"), full_page=True)

        page.goto(f"{BASE_URL}/conversation/999999/summary")
        page.wait_for_selector('[data-testid="summary-error"]', timeout=10000)
        page.screenshot(path=str(SCREENSHOT_DIR / "08-summary-error.png"), full_page=True)

        browser.close()

    print("\n=== Mobile state coverage passed ===")


if __name__ == "__main__":
    main()
