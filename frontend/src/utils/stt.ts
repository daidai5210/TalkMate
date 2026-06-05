/**
 * 浏览器 STT(Speech-to-Text)封装。
 * 通过 webkitSpeechRecognition / SpeechRecognition API 录音 → 转文字。
 *
 * 用法:
 *   const stt = createSTT({ onResult: (text, isFinal) => ... });
 *   stt.start();
 *   stt.stop();
 *   stt.abort();
 *
 * 浏览器兼容性:
 *   - Chrome / Edge: 原生 SpeechRecognition 支持
 *   - Safari: webkitSpeechRecognition 支持(部分版本)
 *   - Firefox: 不支持(isSupported 返回 false)
 */
export interface STTCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export interface STTHandle {
  start: () => void;
  stop: () => void;
  abort: () => void;
  isSupported: () => boolean;
}

export function isSTTSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSTT(callbacks: STTCallbacks): STTHandle {
  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;

  let recognition: SpeechRecognition | null = null;

  const build = (): SpeechRecognition | null => {
    if (!SR) return null;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';
    r.maxAlternatives = 1;

    r.onstart = () => callbacks.onStart?.();
    r.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      const text = finalTranscript || interimTranscript;
      if (text) {
        callbacks.onResult(text.trim(), Boolean(finalTranscript));
      }
    };
    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      callbacks.onError?.(event.error || 'unknown');
    };
    r.onend = () => callbacks.onEnd?.();
    return r;
  };

  return {
    start: () => {
      if (!SR) {
        callbacks.onError?.('browser_not_supported');
        return;
      }
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
      recognition = build();
      if (!recognition) {
        callbacks.onError?.('browser_not_supported');
        return;
      }
      try {
        recognition.start();
      } catch (err) {
        callbacks.onError?.(String(err));
      }
    },
    stop: () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    },
    abort: () => {
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
        recognition = null;
      }
    },
    isSupported: () => Boolean(SR),
  };
}
