import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../components/ui/classNames';

export type AppShellVariant = 'standard' | 'immersive';

interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: AppShellVariant;
  className?: string;
}

export default function AppShell({
  children,
  variant = 'standard',
  className = '',
  ...props
}: AppShellProps) {
  const isImmersive = variant === 'immersive';

  return (
    <div
      className={classNames(
        'flex min-h-dvh justify-center',
        isImmersive ? 'bg-immersive-base' : 'bg-slate-100',
      )}
    >
      <div
        {...props}
        className={classNames(
          'relative flex min-h-dvh w-full max-w-app flex-col',
          isImmersive
            ? 'app-immersive text-immersive-text'
            : 'bg-app-surface text-app-text shadow-app-shell',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
