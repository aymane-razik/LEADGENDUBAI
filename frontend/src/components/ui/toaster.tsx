'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toast-group"
      toastOptions={{
        classNames: {
          toast: 'bg-background border-border text-foreground',
          success: 'border-emerald-200 dark:border-emerald-800',
          error: 'border-red-200 dark:border-red-800',
          warning: 'border-amber-200 dark:border-amber-800',
          info: 'border-sky-200 dark:border-sky-800',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
