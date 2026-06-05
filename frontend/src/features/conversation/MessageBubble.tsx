import type { Message } from './types';

interface Props {
  message: Message;
}

const ROLE_STYLE: Record<Message['role'], string> = {
  user: 'bg-brand-100 text-brand-900 ml-auto',
  ai: 'bg-gray-100 text-gray-900 mr-auto',
};

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.role}`}
    >
      <div
        className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${ROLE_STYLE[message.role]}`}
      >
        <p className="break-words">{message.text}</p>
        {!isUser && (
          <button
            type="button"
            onClick={() => {
              void import('../../utils/tts').then(({ ttsSpeak }) => ttsSpeak(message.text));
            }}
            className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600 shadow-sm hover:text-brand-700"
            data-testid="tts-play-button"
            title="朗读这条 AI 回复"
          >
            <span aria-hidden="true">🔊</span>
            朗读
          </button>
        )}
      </div>
    </div>
  );
}
