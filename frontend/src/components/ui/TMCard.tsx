import { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

type TMCardVariant = 'plain' | 'elevated' | 'interactive' | 'gradient';

interface TMCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: TMCardVariant;
  header?: ReactNode;
  footer?: ReactNode;
}

const variantClass: Record<TMCardVariant, string> = {
  plain: 'border border-slate-200 bg-white',
  elevated: 'border border-slate-100 bg-white shadow-card',
  interactive: 'border border-slate-200 bg-white shadow-card transition hover:border-brand-200 hover:shadow-card-hover active:scale-[0.98]',
  gradient: 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-brand',
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
      className={classNames('rounded-2xl p-4', variantClass[variant], className)}
    >
      {header && <div className="mb-3">{header}</div>}
      {children}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
