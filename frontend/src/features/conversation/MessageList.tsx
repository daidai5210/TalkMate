import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from './types';

interface Props {
  messages: Message[];
  sending: boolean;
}

export default function MessageList({ messages, sending }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  return (
    <div
      className="flex-1 overflow-y-auto px-1 py-4 space-y-3"
      data-testid="message-list"
    >
      {messages.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-12">
          开始一段对话吧
        </div>
      )}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {sending && (
        <div className="flex justify-start" data-testid="ai-thinking">
          <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-2.5 text-sm italic flex items-center gap-1">
            <span>正在思考</span>
            <span className="inline-flex gap-0.5">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
