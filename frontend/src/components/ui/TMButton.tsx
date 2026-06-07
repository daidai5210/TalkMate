import { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

type TMButtonVariant = 'primary' | 'secondary' | 'text' | 'danger' | 'ghost';
type TMButtonSize = 'sm' | 'md' | 'lg';

interface TMButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TMButtonVariant;
  size?: TMButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
}

const variantClass: Record<TMButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-brand hover:bg-brand-700 disabled:bg-slate-300 disabled:shadow-none',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400',
  text: 'bg-transparent text-brand-600 hover:text-brand-700 disabled:text-slate-300',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-slate-300',
  ghost: 'bg-white/15 text-white hover:bg-white/25 disabled:bg-white/10 disabled:text-white/50',
};

const sizeClass: Record<TMButtonSize, string> = {
  sm: 'min-h-10 rounded-xl px-3 text-xs',
  md: 'min-h-11 rounded-xl px-4 text-sm',
  lg: 'min-h-12 rounded-2xl px-5 text-base',
};

export default function TMButton({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: TMButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={classNames(
        'inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
