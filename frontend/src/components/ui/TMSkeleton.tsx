import { classNames } from './classNames';

interface TMSkeletonProps {
  variant?: 'card' | 'list' | 'profile' | 'custom';
  rows?: number;
  className?: string;
}

export default function TMSkeleton({ variant = 'card', rows = 3, className }: TMSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={classNames('space-y-2', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-slate-200 h-16" />
        ))}
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={classNames('space-y-4', className)}>
        <div className="animate-pulse rounded-2xl bg-slate-200 h-20" />
        <div className="animate-pulse rounded-2xl bg-slate-200 h-32" />
        <div className="animate-pulse rounded-2xl bg-slate-200 h-40" />
      </div>
    );
  }

  return (
    <div className={classNames('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-slate-200 h-24" />
      ))}
    </div>
  );
}
