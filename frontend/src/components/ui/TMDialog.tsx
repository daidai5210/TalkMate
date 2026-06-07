import { ReactNode } from 'react';
import TMButton from './TMButton';

interface TMDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  immersive?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

export default function TMDialog({
  open,
  title,
  description,
  children,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  immersive = false,
  onConfirm,
  onClose,
}: TMDialogProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-end justify-center px-4 pb-[calc(16px+var(--app-safe-bottom))] backdrop-blur-sm ${
        immersive ? 'bg-immersive-overlay' : 'bg-slate-950/45'
      }`}
    >
      <div
        className={`w-full max-w-app animate-slide-up p-5 shadow-xl ${
          immersive ? 'app-glass-strong rounded-sheet text-immersive-text' : 'rounded-sheet bg-app-surface'
        }`}
      >
        <h2 className={`text-lg font-black ${immersive ? 'text-immersive-text' : 'text-app-text'}`}>
          {title}
        </h2>
        {description && (
          <p
            className={`mt-2 text-sm leading-6 ${
              immersive ? 'text-immersive-text-muted' : 'text-app-text-muted'
            }`}
          >
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <TMButton variant={immersive ? 'ghost' : 'secondary'} size="md" fullWidth onClick={onClose}>
            {cancelText}
          </TMButton>
          <TMButton
            variant={danger ? 'danger' : 'primary'}
            size="md"
            fullWidth
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            {confirmText}
          </TMButton>
        </div>
      </div>
    </div>
  );
}
