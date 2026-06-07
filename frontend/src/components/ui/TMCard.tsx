import { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

type TMCardVariant = 'plain' | 'elevated' | 'interactive' | 'gradient' | 'glass';

interface TMCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: TMCardVariant;
  header?: ReactNode;
  footer?: ReactNode;
}

const variantClass: Record<TMCardVariant, string> = {
  plain: 'border border-app-border bg-app-surface',
  elevated: 'border border-slate-100 bg-app-surface shadow-card',
  interactive:
    'border border-app-border bg-app-surface shadow-card transition hover:border-brand-200 hover:shadow-card-hover active:scale-[0.98]',
  gradient: 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-brand',
  glass: 'app-glass text-immersive-text shadow-immersive',
};

export default function TMCard({
  variant = 'elevated',
  header,
  footer,
  className,
  children,
  ...props
}: TMCardProps) {
  return (
    <div
      {...props}
      className={classNames('rounded-app p-4', variantClass[variant], className)}
    >
      {header && <div className="mb-3">{header}</div>}
      {children}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
