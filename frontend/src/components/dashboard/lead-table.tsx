'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LeadListItem, LeadStatus, LeadQuality } from '@/types';
import { MoreHorizontal, Mail, Phone, UserCheck, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface LeadTableProps {
  leads: LeadListItem[];
  loading?: boolean;
  onView?: (id: string) => void;
  onAssign?: (id: string) => void;
  onStatus?: (id: string, status: LeadStatus) => void;
  onDeduplicate?: (id: string) => void;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'status-new',
  contacted: 'status-contacted',
  qualified: 'status-qualified',
  meeting_scheduled: 'status-meeting_scheduled',
  viewing_done: 'status-viewing_done',
  negotiating: 'status-negotiating',
  deal_closed: 'status-deal_closed',
  lost: 'status-lost',
  nurturing: 'status-nurturing',
};

const qualityColors: Record<LeadQuality, string> = {
  hot: 'quality-hot',
  warm: 'quality-warm',
  cold: 'quality-cold',
  junk: 'quality-junk',
};

export function LeadTable({ leads, loading, onView, onAssign, onStatus, onDeduplicate }: LeadTableProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Properties</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Timeline</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Quality</TableHead>
            <TableHead>Intent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-36" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                <TableCell><Skeleton className="h-6 w-14" /></TableCell>
                <TableCell><Skeleton className="h-6 w-14" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-10" /></TableCell>
              </TableRow>
            ))
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {lead.firstName[0]}{lead.lastName?.[0] ?? ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground uppercase">{lead.source.replace(/_/g, ' ')}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    <a href={`mailto:${lead.email}`} className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                      {lead.email}
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href={`tel:${lead.phone}`} className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">
                      {lead.phone}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lead.propertyType.slice(0, 2).map((t) => (
                      <Badge key={t} variant="secondary" className="text-2xs">{t}</Badge>
                    ))}
                    {lead.propertyType.length > 2 && <Badge variant="secondary" className="text-2xs">+{lead.propertyType.length - 2}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {lead.budget.currency === 'USD' ? '$' : 'AED '}
                    {lead.budget.max >= 1_000_000
                      ? `${(lead.budget.max / 1_000_000).toFixed(1)}M`
                      : `${Math.round(lead.budget.max / 1000)}K`}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {lead.budget.min > 0 ? `–${lead.budget.currency === 'USD' ? '$' : 'AED '}${(lead.budget.min >= 1_000_000 ? (lead.budget.min / 1_000_000).toFixed(1) + 'M' : Math.round(lead.budget.min / 1000) + 'K')}` : ''}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{lead.timeline.replace(/-/g, ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative h-2 w-20 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'absolute h-full rounded-full transition-all',
                          lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 60 ? 'bg-amber-500' : lead.score >= 40 ? 'bg-slate-400' : 'bg-zinc-400',
                        )}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium tabular-nums w-8 text-right">{lead.score}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(qualityColors[lead.quality], 'text-2xs')}>{lead.quality}</Badge>
                </TableCell>
                <TableCell>
                  <span className={cn('text-xs font-medium', { 'intent-high': lead.intent === 'high', 'intent-medium': lead.intent === 'medium', 'intent-low': lead.intent === 'low' })}>
                    {lead.intent}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[lead.status], 'text-2xs')}>{lead.status.replace(/_/g, ' ')}</Badge>
                  {lead.isDuplicate && <Badge variant="destructive" className="text-2xs ml-1">DUP</Badge>}
                </TableCell>
                <TableCell>
                  <DropdownMenu open={menuOpen === lead.id} onOpenChange={(open) => setMenuOpen(open ? lead.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => { setMenuOpen(null); onView?.(lead.id); }}>
                        <ChevronRight className="h-4 w-4 mr-2 -rotate-90" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMenuOpen(null); onAssign?.(lead.id); }}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Assign agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMenuOpen(null); onStatus?.(lead.id, 'contacted'); }}>
                        <Mail className="h-4 w-4 mr-2" />
                        Mark contacted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMenuOpen(null); onStatus?.(lead.id, 'qualified'); }}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark qualified
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMenuOpen(null); onDeduplicate?.(lead.id); }}>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Check duplicates
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
