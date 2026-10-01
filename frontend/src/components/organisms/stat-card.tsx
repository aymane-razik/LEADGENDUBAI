import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  variant?: 'default' | 'emerald' | 'sky' | 'amber' | 'rose';
}

const accents = {
  default: 'text-[#d6f66d] bg-[#d6f66d]/10',
  emerald: 'text-[#74dfb2] bg-[#74dfb2]/10',
  sky: 'text-[#79d8ef] bg-[#79d8ef]/10',
  amber: 'text-[#ffd184] bg-[#ffd184]/10',
  rose: 'text-[#ff9b93] bg-[#ff9b93]/10',
};

export function StatCard({ icon: Icon, label, value, change, trend, className, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn('group overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:shadow-[0_18px_44px_rgba(0,0,0,.24)]', className)}>
      <CardContent className="relative p-4 sm:p-5">
        <div className="absolute -right-8 -top-10 size-28 rounded-full bg-white/[0.025] blur-2xl transition group-hover:bg-white/[0.05]" />
        <div className="relative flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">{label}</p><div className="mt-3 text-[26px] font-semibold leading-none tracking-[-.045em] text-white tabular-nums sm:text-[30px]">{value}</div></div>
          <div className={cn('grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-white/[0.05]', accents[variant])}><Icon className="size-[17px]" strokeWidth={1.9}/></div>
        </div>
        {change && <div className="relative mt-4 flex items-center gap-1.5 border-t border-white/[0.06] pt-3"><span className={cn('size-1.5 rounded-full', trend === 'down' ? 'bg-[#ff9b93]' : trend === 'up' ? 'bg-[#d6f66d]' : 'bg-slate-500')}/><span className={cn('text-[10px]', trend === 'down' ? 'text-[#ffaaa2]' : trend === 'up' ? 'text-[#d6f66d]' : 'text-slate-500')}>{change}</span></div>}
      </CardContent>
    </Card>
  );
}
