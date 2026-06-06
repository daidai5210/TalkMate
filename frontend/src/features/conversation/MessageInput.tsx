import { FormEvent, KeyboardEvent, useState } from 'react';
import VoiceRecorder from '../../components/voice/VoiceRecorder';

interface Props {
  onSend: (text: string) => Promise<void>;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText('');
    await onSend(trimmed);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-slate-100 bg-white/95 px-3 pb-[calc(12px+var(--app-safe-bottom))] pt-3"
      data-testid="message-input-form"
    >
      <p className="mb-2 break-words text-xs font-medium text-slate-500">建议优先用语音回答；文字输入可作为备用。</p>
      <div className="flex min-w-0 items-end gap-2">
        <VoiceRecorder
          disabled={disabled}
          onTranscript={(t, isFinal) => {
            setText(t);
            if (isFinal) {
              // final transcript, ready to send
            }
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={5000}
          placeholder={disabled ? '请稍候…' : '说不出来时，可以先输入一句英文试试…'}
          disabled={disabled}
          className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
          data-testid="message-textarea"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="min-h-12 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          data-testid="message-send-button"
        >
          发送
        </button>
      </div>
    </form>
  );
}
