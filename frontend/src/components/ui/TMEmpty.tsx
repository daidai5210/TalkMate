import { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import TMButton from './TMButton';
import { classNames } from './classNames';

interface TMEmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function TMEmpty({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: TMEmptyProps) {
  return (
    <div className={classNames('rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center', className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        {icon ?? <MessageCircle className="h-7 w-7" strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>}
      {actionText && onAction && (
        <TMButton size="md" className="mt-4" onClick={onAction}>
          {actionText}
        </TMButton>
      )}
    </div>
  );
}
