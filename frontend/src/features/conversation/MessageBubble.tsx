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
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${ROLE_STYLE[message.role]}`}
      >
        {message.text}
      </div>
    </div>
  );
}
