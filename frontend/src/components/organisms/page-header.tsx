import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  eyebrow?: string;
}

export function PageHeader({ title, description, actions, className, eyebrow = 'DUBAI · REAL ESTATE OPERATIONS' }: PageHeaderProps) {
  return (
    <div className={cn('motion-enter flex flex-col gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-7', className)}>
      <div className="min-w-0">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-.045em] text-white sm:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-slate-400 sm:text-[13px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
