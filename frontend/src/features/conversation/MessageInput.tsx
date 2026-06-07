import { useState } from 'react';
import { Drawer } from 'vaul';
import { ChevronUp, Lightbulb } from 'lucide-react';
import VoiceLongPressButton from '../../components/VoiceLongPressButton';

interface Props {
  onSend: (text: string) => Promise<void>;
  disabled: boolean;
  starterPhrases?: string[];
  taskGoal?: string;
  onEndConversation?: () => void;
  ending?: boolean;
}

export default function MessageInput({
  onSend,
  disabled,
  starterPhrases = [],
  taskGoal,
  onEndConversation,
  ending = false,
}: Props) {
  const [hintsOpen, setHintsOpen] = useState(false);

  return (
    <div
      className="relative shrink-0 px-4 pb-[calc(16px+var(--app-safe-bottom))] pt-2"
      data-testid="message-input-form"
    >
      {starterPhrases.length > 0 && (
        <div
          className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [-webkit-overflow-scrolling:touch]"
          data-testid="starter-phrases-scroll"
        >
          <button
            type="button"
            onClick={() => setHintsOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md hover:bg-white/15"
            data-testid="starter-phrases-toggle"
          >
            <Lightbulb className="h-3.5 w-3.5" strokeWidth={2} />
            开口提示
            <ChevronUp className="h-3 w-3 opacity-60" strokeWidth={2} />
          </button>
          {starterPhrases.slice(0, 2).map((phrase, index) => (
            <span
              key={phrase}
              className="shrink-0 max-w-[10rem] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm"
              data-testid={`starter-phrase-chip-${index}`}
              title={phrase}
            >
              {phrase}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <VoiceLongPressButton
          disabled={disabled}
          variant="immersive"
          onStop={(text) => { void onSend(text); }}
        />
      </div>

      {onEndConversation && (
        <button
          type="button"
          onClick={onEndConversation}
          disabled={disabled || ending}
          className="mx-auto mt-3 block text-xs font-medium text-white/40 hover:text-white/70 disabled:opacity-40"
          data-testid="end-conversation-button"
        >
          {ending ? '生成反馈中…' : '结束并生成反馈'}
        </button>
      )}

      <Drawer.Root open={hintsOpen} onOpenChange={setHintsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[var(--app-max-width)] rounded-t-[1.75rem] border border-white/10 bg-slate-900/95 backdrop-blur-xl outline-none">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="px-5 pb-[calc(24px+var(--app-safe-bottom))] pt-4">
              <Drawer.Title className="text-base font-bold text-white">开口前提示卡</Drawer.Title>
              {taskGoal && (
                <p className="mt-2 text-sm leading-6 text-white/60">{taskGoal}</p>
              )}
              <p className="mt-2 text-xs text-white/40">
                以下是完整例句，可直接朗读，方便 AI 分析语法与表达。
              </p>
              <div className="mt-4 grid gap-2" data-testid="starter-phrases">
                {starterPhrases.map((phrase, index) => (
                  <p
                    key={phrase}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white/90"
                    data-testid={`starter-phrase-${index}`}
                  >
                    {phrase}
                  </p>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
