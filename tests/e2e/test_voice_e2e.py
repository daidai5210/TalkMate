"""T-005 端到端验证：语音交互 STT + TTS(mock 浏览器 Web Speech API)。

依赖: playwright 1.60+,已安装在 /home/user13/playwright-env/
运行: 需要 backend uvicorn + frontend vite dev 同时运行
- backend: 0.0.0.0:8000
- frontend: 0.0.0.0:5173

策略: 通过 add_init_script 在导航前注入 window.SpeechRecognition 与
window.speechSynthesis mock,触发 onresult/onend/speak 回调来测试 UI 行为。
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
API_BASE = os.environ.get("E2E_API_BASE", "http://127.0.0.1:8000")
TEST_USER = f"voice_e2e_{int(time.time())}"
TEST_PASSWORD = "VoiceE2E123"

SCREENSHOT_DIR = Path("/tmp/talkmate-t005-screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


# 注入 mock Web Speech API,记录调用并提供模拟 transcript
MOCK_SPEECH_API = """
(() => {
  // 记录所有 tts 调用
  window.__ttsCalls = [];
  window.__lastSRInstance = null;
  window.__triggerSRResult = (transcript, isFinal) => {
    const r = window.__lastSRInstance;
    if (!r) return;
    const event = {
      resultIndex: 0,
      results: {
        length: 1,
        item: () => ({
          length: 1,
          isFinal: !!isFinal,
          item: () => ({ transcript, confidence: 0.95 }),
          0: { transcript, confidence: 0.95 },
        }),
        0: {
          length: 1,
          isFinal: !!isFinal,
          item: () => ({ transcript, confidence: 0.95 }),
          0: { transcript, confidence: 0.95 },
        },
      },
    };
    r.onresult && r.onresult(event);
    if (isFinal) {
      r.onend && r.onend();
    }
  };
  window.__triggerSREnd = () => {
    const r = window.__lastSRInstance;
    if (r) r.onend && r.onend();
  };

  // Mock SpeechRecognition(webkit 前缀)
  class MockSR {
    constructor() {
      this.continuous = false;
      this.interimResults = false;
      this.lang = 'en-US';
      this.maxAlternatives = 1;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      this._started = false;
      window.__lastSRInstance = this;
    }
    start() {
      this._started = true;
      if (this.onstart) this.onstart();
    }
    stop() {
      this._started = false;
    }
    abort() {
      this._started = false;
    }
  }
  window.SpeechRecognition = MockSR;
  window.webkitSpeechRecognition = MockSR;

  // Mock speechSynthesis(用 Object.defineProperty 强制覆盖 Chrome 自带实现)
  const mockSynth = {
    speak: (utt) => {
      window.__ttsCalls.push({
        text: utt.text,
        lang: utt.lang,
        rate: utt.rate,
        pitch: utt.pitch,
        volume: utt.volume,
      });
    },
    cancel: () => {},
    getVoices: () => [],
    speaking: false,
    pending: false,
    paused: false,
  };
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSynth,
    writable: true,
    configurable: true,
    enumerable: true,
  });
})();
"""


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


def test_voice_flow(page: Page) -> None:
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

    step("2. 选面试场景进入对话页")
    page.locator('[data-testid="scenario-card-1"]').click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    page.wait_for_selector('[data-testid="message-input-form"]', timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "01-conversation-with-mic.png"))

    step("3. 验证 VoiceRecorder 按钮存在且可点")
    mic = page.locator('[data-testid="voice-recorder-button"]')
    assert_eq(mic.count(), 1, "VoiceRecorder 按钮渲染")
    assert_eq(mic.is_enabled(), True, "VoiceRecorder 按钮可点")

    step("4. 点击 mic → mock 触发 STT 返回 transcript")
    mic.click()
    page.wait_for_function("window.__lastSRInstance !== null", timeout=5000)
    page.evaluate("window.__triggerSRResult('Hello, I want to interview', false)")
    page.wait_for_function(
        "document.querySelector('[data-testid=\"message-textarea\"]').value === 'Hello, I want to interview'",
        timeout=5000,
    )
    textarea_value = page.input_value('[data-testid="message-textarea"]')
    assert_eq(textarea_value, "Hello, I want to interview", "interim transcript 填入 textarea")
    page.screenshot(path=str(SCREENSHOT_DIR / "02-stt-interim.png"))

    step("5. 触发 final STT 结果 + 停止")
    page.evaluate("window.__triggerSRResult('Hello, I want to interview for this position', true)")
    page.wait_for_function(
        "document.querySelector('[data-testid=\"message-textarea\"]').value === 'Hello, I want to interview for this position'",
        timeout=5000,
    )
    textarea_value_final = page.input_value('[data-testid="message-textarea"]')
    assert_eq(textarea_value_final, "Hello, I want to interview for this position", "final transcript 更新")

    step("6. 验证 mic 录音态(red 背景)")
    # 重新点击开始录音以验证录音态
    mic.click()
    page.wait_for_function("window.__lastSRInstance !== null", timeout=5000)
    is_recording = page.get_attribute('[data-testid="voice-recorder-button"]', "data-recording")
    assert_eq(is_recording, "true", "录音态标记")
    # 再次点击停止
    mic.click()
    page.wait_for_function(
        "document.querySelector('[data-testid=\"voice-recorder-button\"]').getAttribute('data-recording') === 'false'",
        timeout=5000,
    )

    step("7. 点击发送 → 等待 AI 回复 → 验证 TTS 被调用")
    page.click('[data-testid="message-send-button"]')
    page.wait_for_selector('[data-testid="message-ai"]', timeout=20000)
    # 等待 TTS 调用(异步触发,可能需要等动态 import 解析)
    page.wait_for_function("window.__ttsCalls.length >= 1", timeout=15000)
    tts_calls = page.evaluate("window.__ttsCalls")
    print(f"  TTS 被调用 {len(tts_calls)} 次,文本: {[c['text'][:60] for c in tts_calls]}")
    assert_true(len(tts_calls) >= 1, "TTS 至少调用 1 次")
    # 第一次 TTS 应该是 AI 回复
    first_tts = tts_calls[0]
    ai_text = page.locator('[data-testid="message-ai"]').first.inner_text()
    assert_true(
        first_tts["text"][:30] in ai_text or ai_text[:30] in first_tts["text"],
        f"TTS 文本与 AI 回复一致(TTS: {first_tts['text'][:50]}... / AI: {ai_text[:50]}...)",
    )
    assert_eq(first_tts["lang"], "en-US", "TTS 语言为 en-US")
    page.screenshot(path=str(SCREENSHOT_DIR / "03-tts-after-ai.png"))

    step("8. 再发一条 → TTS 应再次调用(累计 2 次)")
    page.fill('[data-testid="message-textarea"]', "I have 3 years experience")
    page.click('[data-testid="message-send-button"]')
    page.wait_for_function("window.__ttsCalls.length >= 2", timeout=20000)
    page.screenshot(path=str(SCREENSHOT_DIR / "04-second-tts.png"))

    step("9. 返回场景 + 登出")
    page.click('[data-testid="back-to-scenarios"]')
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.click('[data-testid="logout-button"]')
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)

    print(f"\n=== 🎉 T-005 全部 9 步 E2E 验证通过(2 轮 TTS 调用)===")


def main() -> None:
    print(f"E2E base URL: {BASE_URL}")
    print(f"E2E API base: {API_BASE}")
    print(f"Test user: {TEST_USER}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        # 导航前注入 mock
        context.add_init_script(MOCK_SPEECH_API)
        page = context.new_page()
        try:
            test_voice_flow(page)
        except Exception as e:
            page.screenshot(path=str(SCREENSHOT_DIR / "FAILURE.png"))
            print(f"\n❌ E2E 失败: {e}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
