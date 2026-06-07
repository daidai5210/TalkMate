import VoiceLongPressButton from '../../components/VoiceLongPressButton';

interface Props {
  onSend: (text: string) => Promise<void>;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  return (
    <div
      className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[calc(12px+var(--app-safe-bottom))] pt-3"
      data-testid="message-input-form"
    >
      <p className="mb-3 text-center text-[13px] font-medium text-slate-400">
        长按麦克风说话，松开发送
      </p>
      <div className="flex justify-center">
        <VoiceLongPressButton
          disabled={disabled}
          onStop={(text) => { void onSend(text); }}
        />
      </div>
    </div>
  );
}