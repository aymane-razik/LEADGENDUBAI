import * as React from 'react';
import { cn } from '@/lib/utils';

const DropdownMenuContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

export function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenu components must be wrapped in DropdownMenu.');
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open = false, onOpenChange }: DropdownMenuProps) {
  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: onOpenChange ?? (() => {}) }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

type DropdownMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

export function DropdownMenuTrigger({ children, asChild = false, onClick, ...props }: DropdownMenuTriggerProps) {
  const { open, onOpenChange } = useDropdownMenu();
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) onOpenChange(true);
  };

  if (asChild) {
    const child = React.Children.only(children);
    if (!React.isValidElement<React.ButtonHTMLAttributes<HTMLButtonElement>>(child)) {
      throw new Error('DropdownMenuTrigger with asChild requires one button-like child.');
    }
    const childProps = child.props;
    return React.cloneElement(child, {
      ...props,
      ...childProps,
      className: cn(props.className, childProps.className),
      type: childProps.type ?? props.type ?? 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        childProps.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  align?: 'start' | 'end';
}

export function DropdownMenuContent({ children, className, sideOffset = 4, align = 'start' }: DropdownMenuContentProps) {
  const { open } = useDropdownMenu();
  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
      style={{
        top: `calc(100% + ${sideOffset}px)`,
      }}
      role="menu"
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) {
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  );
}
