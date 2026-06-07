import type { Message } from './types';

interface Props {
  message: Message;
}

const ROLE_STYLE: Record<Message['role'], string> = {
  user: 'ml-auto border border-brand-200 bg-brand-50 text-brand-900 shadow-sm',
  ai: 'mr-auto bg-slate-100 text-slate-900 shadow-sm',
};

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.role}`}
    >
      <div
        className={`max-w-[88%] rounded-[14px] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${ROLE_STYLE[message.role]}`}
      >
        {!isUser && <p className="mb-2 text-xs font-bold uppercase text-slate-500">AI Coach</p>}
        <p className="break-words">{message.text}</p>
        {!isUser && (
          <button
            type="button"
            onClick={() => {
              void import('../../utils/tts').then(({ ttsSpeak }) => ttsSpeak(message.text));
            }}
            className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:text-brand-700"
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
