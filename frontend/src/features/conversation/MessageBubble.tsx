import type { Message } from './types';

interface Props {
  message: Message;
  variant?: 'default' | 'immersive';
}

const ROLE_STYLE: Record<Message['role'], { default: string; immersive: string }> = {
  user: {
    default: 'ml-auto border border-brand-200 bg-brand-50 text-brand-900 shadow-sm',
    immersive: 'ml-auto border border-sky-400/30 bg-sky-400/20 text-white backdrop-blur-md shadow-[0_4px_24px_rgba(56,189,248,0.15)]',
  },
  ai: {
    default: 'mr-auto bg-slate-100 text-slate-900 shadow-sm',
    immersive: 'mr-auto border border-white/10 bg-white/10 text-white backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.2)]',
  },
};

export default function MessageBubble({ message, variant = 'immersive' }: Props) {
  const isUser = message.role === 'user';
  const styles = ROLE_STYLE[message.role][variant];

  return (
    <div
      className={`flex animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.role}`}
    >
      <div
        className={`max-w-[88%] rounded-[18px] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${styles}`}
      >
        {!isUser && (
          <p className={`mb-2 text-xs font-bold uppercase ${variant === 'immersive' ? 'text-white/50' : 'text-slate-500'}`}>
            AI Coach
          </p>
        )}
        <p className="break-words">{message.text}</p>
        {!isUser && (
          <button
            type="button"
            onClick={() => {
              void import('../../utils/tts').then(({ ttsSpeak }) => ttsSpeak(message.text));
            }}
            className={`mt-3 inline-flex min-h-9 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              variant === 'immersive'
                ? 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
                : 'bg-white/90 text-slate-600 shadow-sm hover:text-brand-700'
            }`}
            data-testid="tts-play-button"
            title="朗读这条 AI 回复"
          >
            <SpeakerIcon />
            朗读
          </button>
        )}
      </div>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
