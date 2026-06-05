import { FormEvent, KeyboardEvent, useState } from 'react';

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
      className="border-t border-gray-200 bg-white px-4 py-3"
      data-testid="message-input-form"
    >
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={5000}
          placeholder={disabled ? '请稍候…' : '输入消息,Enter 发送,Shift+Enter 换行'}
          disabled={disabled}
          className="flex-1 resize-none border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
          data-testid="message-textarea"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-md hover:bg-brand-700 disabled:opacity-50"
          data-testid="message-send-button"
        >
          发送
        </button>
      </div>
    </form>
  );
}
