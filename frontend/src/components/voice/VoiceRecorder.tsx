import { useEffect, useRef, useState } from 'react';
import { createSTT, isSTTSupported, type STTHandle } from '../../utils/stt';

interface Props {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled: boolean;
}

export default function VoiceRecorder({ onTranscript, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sttRef = useRef<STTHandle | null>(null);

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

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="min-h-11 min-w-11 p-2 text-gray-300 cursor-not-allowed"
        title="当前浏览器不支持语音识别"
        aria-label="当前浏览器不支持语音识别"
        data-testid="voice-recorder-unsupported"
      >
        <MicrophoneIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={recording ? handleStop : handleStart}
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled && !recording}
      className={`relative min-h-11 min-w-11 p-2 rounded-md transition ${
        recording
          ? 'bg-red-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={recording ? '点击停止' : '点击录音'}
      aria-label={recording ? '点击停止录音' : '点击开始录音'}
      data-testid="voice-recorder-button"
      data-recording={recording}
    >
      {recording && <PulseRing />}
      <MicrophoneIcon recording={recording} />
      {error && (
        <span className="absolute bottom-full left-0 mb-1 max-w-[12rem] rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white break-words">
          {error}
        </span>
      )}
    </button>
  );
}

function MicrophoneIcon({ recording = false }: { recording?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
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

function PulseRing() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 rounded-md bg-red-400 opacity-50 animate-ping"
      data-testid="voice-recorder-pulse"
    />
  );
}
