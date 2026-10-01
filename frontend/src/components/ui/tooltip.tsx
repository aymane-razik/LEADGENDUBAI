import * as React from 'react';
import { cn } from '@/lib/utils';

export function TooltipProvider({ children, delayDuration = 0 }: { children: React.ReactNode; delayDuration?: number }) {
  return <div className="text-foreground">{children}</div>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) {
  return <span {...props}>{children}</span>;
}

export function TooltipContent({ children, side = 'top', ...props }: { children: React.ReactNode; side?: 'top' | 'right' | 'bottom' | 'left'; [key: string]: unknown }) {
  return (
    <div
      className={cn(
        'inline-block z-50 px-2.5 py-1 text-xs text-pretty text-foreground shadow-md rounded-md bg-popover border border-popover-foreground/20 animate-in fade-in-0 zoom-in-95',
        side === 'top' ? 'bottom-full mb-1' : side === 'bottom' ? 'top-full mt-1' : side === 'left' ? 'right-full mr-1' : 'left-full ml-1',
      )}
      {...props}
    >
      {children}
    </div>
  );
}
