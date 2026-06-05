"""T-004 端到端验证：登录 → 场景页 → 对话页 → 多轮 AI 对话（真实 DeepSeek API）。

依赖: playwright 1.60+,已安装在 /home/user13/playwright-env/
运行: 需要 backend uvicorn + frontend vite dev 同时运行
- backend: 0.0.0.0:8000(已注入真实 DEEPSEEK_API_KEY via setsid env)
- frontend: 0.0.0.0:5173,VITE_API_BASE_URL=http://172.17.0.5:8000
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
API_BASE = os.environ.get("E2E_API_BASE", "http://127.0.0.1:8000")
TEST_USER = f"ai_e2e_{int(time.time())}"
TEST_PASSWORD = "AIE2E123"

SCREENSHOT_DIR = Path("/tmp/talkmate-t004-screenshots")
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


def test_ai_real_conversation(page: Page) -> None:
    step("1. 注册 + 登录")
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
    page.wait_for_selector('[data-testid="scenario-list"]', timeout=10000)

    step("2. 选面试场景进入对话")
    page.locator('[data-testid="scenario-card-1"]').click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    page.wait_for_selector('[data-testid="message-list"]', timeout=10000)

    step("3. 第 1 轮:自我介绍 → AI 应问面试问题")
    page.fill('[data-testid="message-textarea"]', "Hello, I want to introduce myself")
    start = time.time()
    page.click('[data-testid="message-send-button"]')
    page.wait_for_selector('[data-testid="message-ai"]', timeout=20000)
    elapsed_1 = time.time() - start
    page.screenshot(path=str(SCREENSHOT_DIR / "01-first-ai-reply.png"))
    ai_text_1 = page.locator('[data-testid="message-ai"]').first.inner_text()
    print(f"  AI 第 1 轮回复({elapsed_1:.2f}s): {ai_text_1[:120]}...")
    assert_true(
        any(kw in ai_text_1.lower() for kw in ["introduce", "your name", "background", "experience", "tell me"]),
        f"AI 回复应问面试/自我介绍类问题(实际: {ai_text_1[:80]})",
    )
    assert_true(elapsed_1 < 5.0, f"第 1 轮延迟 < 5s(实际 {elapsed_1:.2f}s)")

    step("4. 第 2 轮:多轮上下文 — 提到后端经验,AI 应追问技术栈")
    page.fill('[data-testid="message-textarea"]', "I have 3 years of backend development experience")
    start = time.time()
    page.click('[data-testid="message-send-button"]')
    page.wait_for_function(
        "document.querySelectorAll('[data-testid=\"message-list\"] [data-testid^=\"message-ai\"]').length >= 2",
        timeout=20000,
    )
    elapsed_2 = time.time() - start
    ai_texts_2 = page.locator('[data-testid="message-ai"]').all()
    last_ai = ai_texts_2[-1].inner_text()
    page.screenshot(path=str(SCREENSHOT_DIR / "02-second-ai-reply.png"))
    print(f"  AI 第 2 轮回复({elapsed_2:.2f}s): {last_ai[:120]}...")
    assert_true(
        any(kw in last_ai.lower() for kw in ["backend", "experience", "technology", "language", "framework", "what", "how", "project"]),
        f"AI 应追问后端/经验相关内容(实际: {last_ai[:80]})",
    )

    step("5. 第 3 轮:连续上下文")
    page.fill('[data-testid="message-textarea"]', "Mainly Python and Java")
    start = time.time()
    page.click('[data-testid="message-send-button"]')
    page.wait_for_function(
        "document.querySelectorAll('[data-testid=\"message-list\"] [data-testid^=\"message-ai\"]').length >= 3",
        timeout=20000,
    )
    elapsed_3 = time.time() - start
    ai_texts_3 = page.locator('[data-testid="message-ai"]').all()
    last_ai_3 = ai_texts_3[-1].inner_text()
    page.screenshot(path=str(SCREENSHOT_DIR / "03-third-ai-reply.png"))
    print(f"  AI 第 3 轮回复({elapsed_3:.2f}s): {last_ai_3[:120]}...")
    assert_true(
        any(kw in last_ai_3.lower() for kw in ["python", "java", "framework", "django", "flask", "spring", "experience", "tell me", "what", "how"]),
        f"AI 应提到 Python/Java 或相关追问(实际: {last_ai_3[:80]})",
    )

    step("6. 验证消息总数为 6(3 user + 3 ai)")
    total_msgs = page.locator('[data-testid="message-list"] [data-testid^="message-"]').count()
    user_count = page.locator('[data-testid="message-user"]').count()
    ai_count = page.locator('[data-testid="message-ai"]').count()
    assert_eq(total_msgs, 6, "总消息数 6")
    assert_eq(user_count, 3, "user 消息数 3")
    assert_eq(ai_count, 3, "ai 消息数 3")

    step("7. 刷新后 AI 回复仍保留")
    page.reload()
    page.wait_for_selector('[data-testid="message-ai"]', timeout=10000)
    page.wait_for_function(
        "document.querySelectorAll('[data-testid=\"message-list\"] [data-testid^=\"message-ai\"]').length >= 3",
        timeout=10000,
    )
    page.screenshot(path=str(SCREENSHOT_DIR / "04-after-reload.png"))
    assert_eq(
        page.locator('[data-testid="message-ai"]').count(),
        3,
        "刷新后 AI 消息保留 3 条",
    )

    step("8. 返回场景 + 登出")
    page.click('[data-testid="back-to-scenarios"]')
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.click('[data-testid="logout-button"]')
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    token = page.evaluate("localStorage.getItem('talkmate_token')")
    assert_true(token is None, "登出后 token 清除")

    print(f"\n=== 🎉 T-004 全部 8 步 E2E 验证通过(3 轮 AI 共 {elapsed_1+elapsed_2+elapsed_3:.2f}s)===")


def main() -> None:
    print(f"E2E base URL: {BASE_URL}")
    print(f"E2E API base: {API_BASE}")
    print(f"Test user: {TEST_USER}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_ai_real_conversation(page)
        except Exception as e:
            page.screenshot(path=str(SCREENSHOT_DIR / "FAILURE.png"))
            print(f"\n❌ E2E 失败: {e}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
