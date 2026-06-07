import { useRef, useState, useCallback, useEffect } from 'react';
import { createSTT, isSTTSupported, type STTHandle } from '../utils/stt';

interface Props {
  onStart?: () => void;
  onStop?: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'immersive';
}

export default function VoiceLongPressButton({
  onStart,
  onStop,
  onError,
  disabled = false,
  variant = 'immersive',
}: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'sending'>('idle');
  const [error, setError] = useState<string | null>(null);
  const sttRef = useRef<STTHandle | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressingRef = useRef(false);
  const transcriptRef = useRef('');
  const submittedRef = useRef(false);

  const supported = isSTTSupported();
  const isImmersive = variant === 'immersive';

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

  const buttonSize = isImmersive ? 'h-[72px] w-[72px]' : 'h-16 w-16';
  const iconSize = isImmersive ? 28 : 24;

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-2" data-testid="voice-long-press-unsupported">
        <button
          type="button"
          disabled
          className={`flex ${buttonSize} items-center justify-center rounded-full bg-white/10 text-white/30`}
        >
          <MicIcon size={iconSize} />
        </button>
        <span className={`text-xs ${isImmersive ? 'text-white/40' : 'text-slate-400'}`}>语音不可用</span>
      </div>
    );
  }

  const idleClass = isImmersive
    ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_0_32px_rgba(244,63,94,0.45)] hover:from-rose-400 hover:to-pink-500 active:scale-95'
    : 'bg-slate-950 text-white hover:bg-brand-700 active:scale-95 shadow-sm';

  const recordingClass = isImmersive
    ? 'bg-white text-rose-500 scale-110 shadow-[0_0_40px_rgba(255,255,255,0.35)]'
    : 'bg-rose-500 text-white scale-110 shadow-rose-300';

  return (
    <div className="flex flex-col items-center gap-2" data-testid="voice-long-press">
      <div className="relative flex items-center justify-center">
        {isImmersive && state === 'idle' && (
          <span
            aria-hidden="true"
            className="absolute h-[88px] w-[88px] rounded-full border-2 border-white/20 animate-pulse-slow"
          />
        )}
        <button
          type="button"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          disabled={disabled && state === 'idle'}
          className={`relative flex ${buttonSize} items-center justify-center rounded-full transition-all select-none ${
            state === 'recording'
              ? recordingClass
              : state === 'sending'
                ? 'bg-white/20 text-white/50 scale-95'
                : idleClass
          } disabled:opacity-50`}
          data-testid="voice-long-press-button"
          data-state={state}
        >
          {state === 'recording' && (
            <>
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping"
                data-testid="voice-pulse"
              />
              {isImmersive && (
                <span
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-full border-4 border-white/60"
                />
              )}
            </>
          )}
          <MicIcon size={iconSize} />
        </button>
      </div>
      <span
        className={`text-xs font-medium transition ${
          state === 'recording'
            ? 'text-rose-300'
            : state === 'sending'
              ? isImmersive ? 'text-white/40' : 'text-slate-400'
              : isImmersive ? 'text-white/60' : 'text-slate-500'
        }`}
      >
        {state === 'recording' ? '录音中…松开发送' : state === 'sending' ? '发送中…' : '长按说话'}
      </span>
      {error && (
        <span className="rounded-full bg-red-500/20 px-3 py-1 text-[10px] text-red-200 max-w-[12rem] text-center backdrop-blur">
          {error}
        </span>
      )}
    </div>
  );
}

function MicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}
