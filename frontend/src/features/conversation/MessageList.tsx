import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from './types';

const playedMessageIds = new Set<number>();

interface Props {
  messages: Message[];
  sending: boolean;
  emptyText?: string;
  variant?: 'default' | 'immersive';
}

export default function MessageList({
  messages,
  sending,
  emptyText = '开始一段对话吧',
  variant = 'immersive',
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isImmersive = variant === 'immersive';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.id < 0) return;
    if (last.role !== 'ai') return;
    if (playedMessageIds.has(last.id)) return;
    playedMessageIds.add(last.id);

    void import('../../utils/tts').then(({ ttsSpeak, isTTSSupported }) => {
      if (!isTTSSupported()) return;
      ttsSpeak(last.text);
    });
  }, [messages]);

  return (
    <div
      className={`min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 ${isImmersive ? 'pb-2' : ''}`}
      data-testid="message-list"
    >
      {messages.length === 0 && (
        <div
          className={`mx-auto max-w-md py-16 text-center text-sm leading-6 break-words animate-fade-in ${
            isImmersive ? 'text-white/40' : 'text-slate-400'
          }`}
        >
          {emptyText}
        </div>
      )}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} variant={variant} />
      ))}
      {sending && (
        <div className="flex justify-start animate-fade-in" data-testid="ai-thinking">
          <div
            className={`flex items-center gap-1 rounded-2xl px-4 py-2.5 text-sm italic ${
              isImmersive
                ? 'border border-white/10 bg-white/10 text-white/60 backdrop-blur-md'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
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
