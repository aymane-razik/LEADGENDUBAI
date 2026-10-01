import * as React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext<{ value: string; onValueChange: (value: string) => void } | null>(null);

export function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('Tabs components must be wrapped in Tabs.');
  return context;
}

export function Tabs({ value, defaultValue, onValueChange, children, className }: { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children: React.ReactNode; className?: string }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const selectedValue = value ?? internalValue;
  const changeValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };
  return (
    <TabsContext.Provider value={{ value: selectedValue, onValueChange: changeValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: unknown }) {
  return (
    <div
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children, ...props }: { value: string; className?: string; children: React.ReactNode; [key: string]: unknown }) {
  const { value: selected, onValueChange } = useTabs();
  const isActive = value === selected;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        isActive && 'bg-background text-foreground shadow-sm',
        className,
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }: { value: string; className?: string; children: React.ReactNode; [key: string]: unknown }) {
  const { value: selected } = useTabs();
  if (value !== selected) return null;
  return (
    <div
      className={cn('mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}
