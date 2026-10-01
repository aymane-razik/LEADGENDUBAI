import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const selectVariants = cva(
  'inline-flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
);

type SelectItemElement = React.ReactElement<{
  value: string;
  children?: React.ReactNode;
}>;

const collectOptions = (
  children: React.ReactNode,
  options: SelectItemElement[] = [],
): SelectItemElement[] => {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      options.push(child as SelectItemElement);
      return;
    }
    collectOptions(
      (child.props as { children?: React.ReactNode }).children,
      options,
    );
  });
  return options;
};

const findPart = <T,>(children: React.ReactNode, component: React.ElementType): T | undefined => {
  let result: T | undefined;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === component) {
      result = child.props as T;
      return;
    }
    if (result === undefined) {
      result = findPart<T>(
        (child.props as { children?: React.ReactNode }).children,
        component,
      );
    }
  });
  return result;
};

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>,
    VariantProps<typeof selectVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Select({
  className,
  children,
  value,
  defaultValue,
  onValueChange,
  ...props
}: SelectProps) {
  const trigger = findPart<{ className?: string }>(children, SelectTrigger);
  const valuePart = findPart<{ placeholder?: string }>(children, SelectValue);
  const options = collectOptions(children);
  const selectedValue = value ?? defaultValue;
  const hasEmptyOption = options.some((item) => item.props.value === '');

  return (
    <select
      {...props}
      className={cn(selectVariants(), trigger?.className, className)}
      value={selectedValue}
      onChange={(event) => onValueChange?.(event.currentTarget.value)}
    >
      {valuePart?.placeholder && !hasEmptyOption && (
        <option value="">{valuePart.placeholder}</option>
      )}
      {options.map((item) => (
        <option key={item.props.value} value={item.props.value}>
          {item.props.children}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger({ children }: { className?: string; children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectContent({ children }: { className?: string; children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ children }: { className?: string; children?: React.ReactNode; value: string }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { className?: string; placeholder?: string }) {
  return <>{placeholder}</>;
}
