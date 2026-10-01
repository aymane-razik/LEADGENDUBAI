import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: { className?: string; [key: string]: unknown }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
