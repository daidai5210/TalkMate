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
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
      data-testid="message-list"
    >
      {messages.length === 0 && (
        <div className="mx-auto max-w-md py-12 text-center text-sm leading-6 text-slate-400 break-words">
          {emptyText}
        </div>
      )}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {sending && (
        <div className="flex justify-start" data-testid="ai-thinking">
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm italic text-slate-500">
            <span>AI 教练正在追问</span>
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
