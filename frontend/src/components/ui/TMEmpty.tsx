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
  immersive?: boolean;
  className?: string;
}

export default function TMEmpty({
  icon,
  title,
  description,
  actionText,
  onAction,
  immersive = false,
  className,
}: TMEmptyProps) {
  return (
    <div
      className={classNames(
        'rounded-app p-8 text-center',
        immersive
          ? 'app-glass border-dashed text-immersive-text'
          : 'border border-dashed border-slate-300 bg-app-surface',
        className,
      )}
    >
      <div
        className={classNames(
          'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-app',
          immersive ? 'bg-white/10 text-immersive-text-muted' : 'bg-app-muted text-slate-300',
        )}
      >
        {icon ?? <MessageCircle className="h-7 w-7" strokeWidth={1.5} />}
      </div>
      <p className={`text-sm font-bold ${immersive ? 'text-immersive-text' : 'text-slate-700'}`}>
        {title}
      </p>
      {description && (
        <p
          className={`mt-1 text-xs leading-5 ${
            immersive ? 'text-immersive-text-muted' : 'text-app-text-muted'
          }`}
        >
          {description}
        </p>
      )}
      {actionText && onAction && (
        <TMButton
          size="md"
          variant={immersive ? 'ghost' : 'primary'}
          className="mt-4"
          onClick={onAction}
        >
          {actionText}
        </TMButton>
      )}
    </div>
  );
}
