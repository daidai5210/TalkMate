import type { HTMLAttributes, ReactNode } from 'react';

interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function AppShell({ children, className = '', ...props }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950" {...props}>
      <div className={`mx-auto min-h-dvh w-full max-w-[var(--app-max-width)] bg-white shadow-sm ${className}`}>
        {children}
      </div>
    </div>
  );
}
