import { useEffect, useRef, useState } from 'react';
import { createSTT, isSTTSupported, type STTHandle } from '../../utils/stt';

interface Props {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled: boolean;
  variant?: 'default' | 'immersive';
}

export default function VoiceRecorder({ onTranscript, disabled, variant = 'immersive' }: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sttRef = useRef<STTHandle | null>(null);
  const isImmersive = variant === 'immersive';

  useEffect(() => {
    setSupported(isSTTSupported());
    return () => {
      sttRef.current?.abort();
      sttRef.current = null;
    };
  }, []);

  const handleStart = () => {
    setError(null);
    const stt = createSTT({
      onStart: () => setRecording(true),
      onResult: (text, isFinal) => {
        onTranscript(text, isFinal);
        if (isFinal) {
          setRecording(false);
        }
      },
      onError: (err) => {
        setError(err);
        setRecording(false);
      },
      onEnd: () => setRecording(false),
    });
    if (!stt.isSupported()) {
      setSupported(false);
      return;
    }
    sttRef.current?.abort();
    sttRef.current = stt;
    stt.start();
  };

  const handleStop = () => {
    sttRef.current?.stop();
    setRecording(false);
  };

  const sizeClass = isImmersive ? 'h-[72px] w-[72px] rounded-full' : 'min-h-12 min-w-12 rounded-2xl';

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className={`cursor-not-allowed ${sizeClass} bg-white/10 p-2 text-white/30`}
        title="当前浏览器不支持语音识别"
        aria-label="当前浏览器不支持语音识别"
        data-testid="voice-recorder-unsupported"
      >
        <MicrophoneIcon size={isImmersive ? 28 : 20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={recording ? handleStop : handleStart}
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled && !recording}
      className={`relative ${sizeClass} p-2 transition select-none ${
        recording
          ? isImmersive
            ? 'bg-white text-rose-500 shadow-[0_0_40px_rgba(255,255,255,0.35)] scale-110'
            : 'bg-rose-500 text-white shadow-rose-200'
          : isImmersive
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_0_32px_rgba(244,63,94,0.45)] hover:from-rose-400 hover:to-pink-500 active:scale-95'
            : 'bg-slate-950 text-white hover:bg-brand-700 shadow-sm'
      } disabled:opacity-50`}
      title={recording ? '点击停止' : '点击录音'}
      aria-label={recording ? '点击停止录音' : '点击开始录音'}
      data-testid="voice-recorder-button"
      data-recording={recording}
    >
      {recording && <PulseRing immersive={isImmersive} />}
      <MicrophoneIcon recording={recording} size={isImmersive ? 28 : 20} />
      {error && (
        <span className="absolute bottom-full left-1/2 mb-2 max-w-[12rem] -translate-x-1/2 rounded-2xl bg-red-600 px-2 py-1 text-[10px] text-white break-words">
          {error}
        </span>
      )}
    </button>
  );
}

function MicrophoneIcon({ recording = false, size = 20 }: { recording?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-testid="microphone-icon"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      {recording && <line x1="8" y1="22" x2="16" y2="22" stroke="red" strokeWidth="3" />}
    </svg>
  );
}

function PulseRing({ immersive }: { immersive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-0 animate-ping ${
        immersive ? 'rounded-full bg-rose-400/30' : 'rounded-2xl bg-red-400 opacity-50'
      }`}
      data-testid="voice-recorder-pulse"
    />
  );
}
