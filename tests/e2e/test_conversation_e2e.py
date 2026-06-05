"""T-003 端到端验证：登录 → 场景页 → 对话页 → 输入发送 → AI 占位回复 → 刷新保持。

依赖: playwright 1.60+,已安装在 /home/user13/playwright-env/
运行: 需要 backend uvicorn + frontend vite dev 同时运行
- backend: 0.0.0.0:8000
- frontend: 0.0.0.0:5173,VITE_API_BASE_URL=http://172.17.0.5:8000
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
API_BASE = os.environ.get("E2E_API_BASE", "http://127.0.0.1:8000")
TEST_USER = f"conv_e2e_{int(time.time())}"
TEST_PASSWORD = "ConvE2E123"

SCREENSHOT_DIR = Path("/tmp/talkmate-t003-screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def step(name: str) -> None:
    print(f"\n=== {name} ===", flush=True)


def assert_eq(actual, expected, label: str) -> None:
    if actual != expected:
        print(f"  ❌ {label}: expected {expected!r}, got {actual!r}")
        sys.exit(1)
    print(f"  ✅ {label}: {actual!r}")


def assert_true(condition, label: str) -> None:
    if not condition:
        print(f"  ❌ {label}")
        sys.exit(1)
    print(f"  ✅ {label}")


def test_conversation_full_flow(page: Page) -> None:
    step("1. 注册新用户")
    page.goto(f"{BASE_URL}/register")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.fill("#confirm", TEST_PASSWORD)
    page.fill("#captcha", "1234")
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)

    step("2. 登录")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.wait_for_selector('[data-testid="scenario-list"]', timeout=10000)

    step("3. 点击第一个场景卡片(面试)")
    page.locator('[data-testid="scenario-card-1"]').click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    assert_true("/conversation/1" in page.url, f"进入对话页(URL: {page.url})")
    page.wait_for_selector('[data-testid="conversation-page"]', timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "01-conversation-empty.png"))

    step("4. 等待对话创建完成(消息列表为空)")
    page.wait_for_selector('[data-testid="message-list"]', timeout=10000)
    msgs_before = page.locator('[data-testid="message-list"] [data-testid^="message-"]').count()
    assert_eq(msgs_before, 0, "新对话空消息列表")

    step("5. 输入消息并发送")
    page.fill('[data-testid="message-textarea"]', "Hello, I want to introduce myself")
    page.click('[data-testid="message-send-button"]')
    page.screenshot(path=str(SCREENSHOT_DIR / "02-thinking.png"))

    step("6. 验证 user + ai 消息出现")
    page.wait_for_selector('[data-testid="message-user"]', timeout=10000)
    page.wait_for_selector('[data-testid="message-ai"]', timeout=10000)
    msgs = page.locator('[data-testid="message-list"] [data-testid^="message-"]')
    assert_eq(msgs.count(), 2, "2 条消息(1 user + 1 ai)")
    user_text = page.locator('[data-testid="message-user"]').first.inner_text()
    assert_eq(user_text, "Hello, I want to introduce myself", "user 消息文本")
    ai_text = page.locator('[data-testid="message-ai"]').first.inner_text()
    assert_true("占位" in ai_text or "T-004" in ai_text, f"ai 占位消息内容(实际: {ai_text[:50]})")
    page.screenshot(path=str(SCREENSHOT_DIR / "03-messages.png"))

    step("7. 刷新页面验证 sessionStorage 持久化")
    page.reload()
    page.wait_for_selector('[data-testid="message-list"]', timeout=10000)
    page.wait_for_selector('[data-testid="message-user"]', timeout=10000)
    msgs_after_reload = page.locator('[data-testid="message-list"] [data-testid^="message-"]')
    assert_eq(msgs_after_reload.count(), 2, "刷新后消息仍存在")
    user_text_after = page.locator('[data-testid="message-user"]').first.inner_text()
    assert_eq(user_text_after, "Hello, I want to introduce myself", "刷新后 user 消息保留")
    page.screenshot(path=str(SCREENSHOT_DIR / "04-after-reload.png"))

    step("8. 再发一条消息验证累加")
    page.fill('[data-testid="message-textarea"]', "I have 3 years of experience")
    page.click('[data-testid="message-send-button"]')
    page.wait_for_function(
        "document.querySelectorAll('[data-testid=\"message-list\"] [data-testid^=\"message-\"]').length >= 4",
        timeout=10000,
    )
    assert_eq(
        page.locator('[data-testid="message-list"] [data-testid^="message-"]').count(),
        4,
        "累计 4 条消息(2 user + 2 ai)",
    )

    step("9. 返回场景页 + 登出")
    page.click('[data-testid="back-to-scenarios"]')
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.click('[data-testid="logout-button"]')
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    token = page.evaluate("localStorage.getItem('talkmate_token')")
    assert_true(token is None, "登出后 token 清除")

    print("\n=== 🎉 T-003 全部 9 步 E2E 验证通过 ===\n")


def main() -> None:
    print(f"E2E base URL: {BASE_URL}")
    print(f"E2E API base: {API_BASE}")
    print(f"Test user: {TEST_USER}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_conversation_full_flow(page)
        except Exception as e:
            page.screenshot(path=str(SCREENSHOT_DIR / "FAILURE.png"))
            print(f"\n❌ E2E 失败: {e}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
