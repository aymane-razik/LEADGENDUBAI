import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('Dialog components must be wrapped in a Dialog.');
  return context;
}

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ open = false, onOpenChange, children, ...props }: DialogProps) {
  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange ?? (() => {}) }}>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        {...props}
        onClick={() => onOpenChange?.(false)}
      >
        <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild = false, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: unknown }) {
  return (
    <button
      type="button"
      className="cursor-pointer"
      onClick={() => {}}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogContent({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
  return (
    <div
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogFooter({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogTitle({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}
