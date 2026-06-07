import { classNames } from './classNames';

interface TMSkeletonProps {
  variant?: 'card' | 'list' | 'profile' | 'custom';
  rows?: number;
  immersive?: boolean;
  className?: string;
}

export default function TMSkeleton({
  variant = 'card',
  rows = 3,
  immersive = false,
  className,
}: TMSkeletonProps) {
  const barClass = immersive
    ? 'animate-pulse rounded-app bg-white/10'
    : 'animate-pulse rounded-app bg-slate-200';

  if (variant === 'list') {
    return (
      <div className={classNames('space-y-2', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={classNames(barClass, 'h-16')} />
        ))}
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={classNames('space-y-4', className)}>
        <div className={classNames(barClass, 'h-20')} />
        <div className={classNames(barClass, 'h-32')} />
        <div className={classNames(barClass, 'h-40')} />
      </div>
    );
  }

  return (
    <div className={classNames('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={classNames(barClass, 'h-24')} />
      ))}
    </div>
  );
}
