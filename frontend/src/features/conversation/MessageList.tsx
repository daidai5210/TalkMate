import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from './types';

interface Props {
  messages: Message[];
  sending: boolean;
  emptyText?: string;
}

export default function MessageList({ messages, sending, emptyText = '开始一段对话吧' }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  // Auto-speak the latest AI message (skipping optimistic user msg with negative id)
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.id < 0) return; // optimistic user message
    if (last.role !== 'ai') return;
    if (last.id === lastIdRef.current) return; // already seen
    lastIdRef.current = last.id;

    // Dynamic import to keep tts code separate (and tree-shake unused)
    void import('../../utils/tts').then(({ ttsSpeak, isTTSSupported }) => {
      if (!isTTSSupported()) return;
      ttsSpeak(last.text);
    });
  }, [messages]);

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto px-1 py-4 space-y-3"
      data-testid="message-list"
    >
      {messages.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400 break-words">
          {emptyText}
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
