import * as React from 'react';
import { cn } from '@/lib/utils';

const SheetContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null);

export function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error('Sheet components must be wrapped in Sheet.');
  return context;
}

export function Sheet({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <SheetContext.Provider value={{ open: open ?? false, onOpenChange: onOpenChange ?? (() => {}) }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) {
  const { onOpenChange } = useSheet();
  return (
    <button type="button" onClick={() => onOpenChange?.(true)} {...props}>
      {children}
    </button>
  );
}

export function SheetContent({ children, className, side = 'right', ...props }: { children: React.ReactNode; className?: string; side?: 'left' | 'right' | 'top' | 'bottom'; [key: string]: unknown }) {
  const { open } = useSheet();
  const placement = side === 'right' ? 'inset-y-0 right-0' : side === 'left' ? 'inset-y-0 left-0' : side === 'top' ? 'top-0 inset-x-0' : 'bottom-0 inset-x-0';
  const transform = side === 'right' ? 'translate-x-full' : side === 'left' ? '-translate-x-full' : 'translate-y-full';

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          open && 'pointer-events-auto',
        )}
        onClick={() => {}}
      />
      <div
        className={cn(
          'fixed inset-y-0 z-50 w-[400px] bg-background shadow-lg transition-transform data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          placement,
          transform,
          open ? 'translate-x-0' : '',
          className,
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {children}
      </div>
    </>
  );
}
