import { useRef, useState, useCallback, useEffect } from 'react';
import { createSTT, isSTTSupported, type STTHandle } from '../utils/stt';

interface Props {
  onStart?: () => void;
  onStop?: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function VoiceLongPressButton({ onStart, onStop, onError, disabled = false }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'sending'>('idle');
  const [error, setError] = useState<string | null>(null);
  const sttRef = useRef<STTHandle | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressingRef = useRef(false);
  const transcriptRef = useRef('');
  const submittedRef = useRef(false);

  const supported = isSTTSupported();

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearPressTimer();
    sttRef.current?.abort();
    sttRef.current = null;
    isPressingRef.current = false;
  }, [clearPressTimer]);

  useEffect(() => {
    if (disabled) {
      cleanup();
      setState('idle');
    }
  }, [disabled, cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const submitTranscript = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || submittedRef.current) return;
    submittedRef.current = true;
    onStop?.(trimmed);
  }, [onStop]);

  const startRecording = useCallback(() => {
    setError(null);
    transcriptRef.current = '';
    submittedRef.current = false;
    const stt = createSTT({
      onStart: () => {
        setState('recording');
        onStart?.();
      },
      onResult: (text, isFinal) => {
        transcriptRef.current = text;
        if (isFinal) {
          setState('sending');
          sttRef.current?.stop();
          submitTranscript(text);
          setTimeout(() => {
            if (sttRef.current) return;
            setState('idle');
            transcriptRef.current = '';
          }, 500);
        }
      },
      onError: (err) => {
        setError(err);
        setState('idle');
        onError?.(err);
        cleanup();
      },
      onEnd: () => {
        if (!isPressingRef.current) {
          setState('idle');
          transcriptRef.current = '';
        }
        sttRef.current = null;
      },
    });

    if (!stt.isSupported()) {
      setError('当前浏览器不支持语音识别');
      return;
    }

    sttRef.current?.abort();
    sttRef.current = stt;
    stt.start();
  }, [cleanup, onStart, submitTranscript, onError]);

  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (disabled || state !== 'idle') return;
    isPressingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      startRecording();
    }, 150);
  }, [disabled, state, startRecording]);

  const handlePressEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    clearPressTimer();
    if (state === 'recording') {
      sttRef.current?.stop();
      setState('sending');
      submitTranscript(transcriptRef.current);
      setTimeout(() => {
        setState('idle');
        transcriptRef.current = '';
      }, 500);
    }
    isPressingRef.current = false;
  }, [clearPressTimer, state, submitTranscript]);

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-2" data-testid="voice-long-press-unsupported">
        <button
          type="button"
          disabled
          className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300"
        >
          <MicIcon />
        </button>
        <span className="text-xs text-slate-400">语音不可用</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2" data-testid="voice-long-press">
      <button
        type="button"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        disabled={disabled && state === 'idle'}
        className={`relative flex h-16 w-16 items-center justify-center rounded-full shadow-sm transition-all select-none ${
          state === 'recording'
            ? 'bg-rose-500 text-white scale-110 shadow-rose-300'
            : state === 'sending'
              ? 'bg-slate-300 text-slate-500'
              : 'bg-slate-950 text-white hover:bg-brand-700 active:scale-95'
        } disabled:opacity-50`}
        data-testid="voice-long-press-button"
        data-state={state}
      >
        {state === 'recording' && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-rose-400 opacity-40 animate-ping"
            data-testid="voice-pulse"
          />
        )}
        <MicIcon />
      </button>
      <span className={`text-xs font-medium transition ${state === 'recording' ? 'text-rose-500' : state === 'sending' ? 'text-slate-400' : 'text-slate-500'}`}>
        {state === 'recording' ? '录音中...松开发送' : state === 'sending' ? '发送中...' : '长按说话'}
      </span>
      {error && (
        <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] text-red-600 max-w-[12rem] text-center">
          {error}
        </span>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}