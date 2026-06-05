/**
 * 浏览器 TTS(Text-to-Speech)封装。
 * 通过 SpeechSynthesis API 文字转语音播放。
 *
 * 用法:
 *   ttsSpeak("Hello world");
 *   ttsCancel();
 *   ttsIsSpeaking(): boolean
 *   ttsIsSupported(): boolean
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.speechSynthesis);
}

export function ttsSpeak(
  text: string,
  options: { lang?: string; rate?: number; pitch?: number; volume?: number } = {},
): void {
  if (!isTTSSupported()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang ?? 'en-US';
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;
  window.speechSynthesis.speak(utterance);
}

export function ttsCancel(): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.cancel();
}

export function ttsIsSpeaking(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.speaking;
}
