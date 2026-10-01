'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, TrendingUp, UserRound } from 'lucide-react';
import { apiGet, getApiErrorMessage } from '@/lib/api';
import type { UserListItem, UserMetrics } from '@/types';
import { PageHeader } from '@/components/organisms/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AgentDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<UserListItem | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<{ data?: UserListItem }>(`/users/${id}`),
      apiGet<{ data?: UserMetrics }>(`/users/${id}/metrics`),
    ]).then(([profile, stats]) => {
      if (!active) return;
      setAgent(profile.data ?? null);
      setMetrics(stats.data ?? null);
    }).catch((error: unknown) => toast.error(getApiErrorMessage(error, 'Could not load team member')))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-72"/><Skeleton className="h-72 w-full"/></div>;
  if (!agent) return <Card><CardContent className="py-16 text-center"><UserRound className="mx-auto mb-3 size-9 text-muted-foreground"/><h2 className="text-lg font-semibold">Team member not found</h2><Button className="mt-5" variant="outline" onClick={() => router.push('/dashboard/agents')}><ArrowLeft className="mr-2 size-4"/>Back to team</Button></CardContent></Card>;

  const stats = [
    ['Assigned leads', metrics?.leadsAssigned ?? 0], ['Qualified', metrics?.leadsQualified ?? 0],
    ['Converted', metrics?.leadsConverted ?? 0], ['Conversion', `${((metrics?.conversionRate ?? 0) * 100).toFixed(1)}%`],
  ];
  return <div className="space-y-6">
    <PageHeader title={`${agent.firstName} ${agent.lastName}`} eyebrow="TEAM / MEMBER PROFILE" description={agent.title || `${agent.role} · Dubai Realty Group`} actions={<Button variant="outline" onClick={() => router.push('/dashboard/agents')}><ArrowLeft className="mr-2 size-4"/>Back to team</Button>}/>
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Card><CardHeader><CardTitle>Performance snapshot</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{stats.map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Contact & access</CardTitle></CardHeader><CardContent className="space-y-4"><div><Badge variant="secondary" className="capitalize">{agent.role}</Badge> <Badge variant={agent.isActive ? 'success' : 'destructive'}>{agent.isActive ? 'Active' : 'Inactive'}</Badge></div><a className="flex items-center gap-2 text-sm text-slate-200 hover:text-[#d6f66d]" href={`mailto:${agent.email}`}><Mail className="size-4"/>{agent.email}</a>{agent.phone && <a className="flex items-center gap-2 text-sm text-slate-200 hover:text-[#d6f66d]" href={`tel:${agent.phone}`}><Phone className="size-4"/>{agent.phone}</a>}<p className="text-xs text-muted-foreground">{agent.department || 'Sales'}{agent.team ? ` · ${agent.team}` : ''}</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="size-4"/>Avg deal AED {(metrics?.avgDealValue ?? 0).toLocaleString()} · {metrics?.activitiesLogged ?? 0} activities</div></CardContent></Card>
    </div>
  </div>;
}
