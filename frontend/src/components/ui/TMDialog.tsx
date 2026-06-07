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
  onConfirm,
  onClose,
}: TMDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-slate-950/45 px-4 pb-[calc(16px+var(--app-safe-bottom))] backdrop-blur-sm">
      <div className="w-full max-w-[var(--app-max-width)] animate-slide-up rounded-3xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <TMButton variant="secondary" size="md" fullWidth onClick={onClose}>
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
