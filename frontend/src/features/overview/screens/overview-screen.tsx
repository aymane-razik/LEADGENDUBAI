'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Building2, CalendarDays, ChevronRight, CirclePlus, Clock3, Flame, MapPin, Megaphone, RefreshCw, Sparkles, Users, Zap } from 'lucide-react';
import { apiGet, apiPatch, apiPost, getApiErrorMessage, toList, unwrap } from '@/lib/api';
import { useSession } from '@/components/ui/session-provider';
import { PageHeader } from '@/components/organisms/page-header';
import { StatCard } from '@/components/organisms/stat-card';
import { LeadTable } from '@/components/dashboard/lead-table';
import { PropertyCard } from '@/components/dashboard/property-card';
import { CampaignCard } from '@/components/dashboard/campaign-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { DashboardStats, LeadListItem, CampaignListItem, PropertyListItem, LeadStatus } from '@/types';

const pipeline = [
  { key: 'new', label: 'New', color: '#d6f66d' },
  { key: 'contacted', label: 'Contacted', color: '#76d9ef' },
  { key: 'qualified', label: 'Qualified', color: '#9d9bff' },
  { key: 'meeting_scheduled', label: 'Meeting', color: '#c79bff' },
  { key: 'negotiating', label: 'Negotiation', color: '#ffd184' },
  { key: 'deal_closed', label: 'Closed', color: '#74dfb2' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadListItem[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<CampaignListItem[]>([]);
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    setRefreshing(true); setLoadError(false);
    try {
      const [statsResult, leadsResult, campaignsResult, propertiesResult] = await Promise.all([
        apiGet<DashboardStats>('/analytics/dashboard'),
        apiGet<unknown>('/leads?limit=6&sort=-createdAt'),
        apiGet<unknown>('/campaigns?limit=2'),
        apiGet<unknown>('/properties?limit=2&sort=-inquiries'),
      ]);
      setStats(unwrap(statsResult));
      setRecentLeads(toList<LeadListItem>(leadsResult).items);
      setActiveCampaigns(toList<CampaignListItem>(campaignsResult).items);
      setProperties(toList<PropertyListItem>(propertiesResult).items);
    } catch { setLoadError(true); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const handleCampaignAction = async (id: string, action: 'start' | 'pause' | 'test') => {
    try {
      const result = await apiPost<{ message?: string }>(`/campaigns/${id}/${action}`, action === 'test' ? { recipient: 'demo@example.invalid' } : undefined);
      toast.success(result.message ?? `Campaign ${action} action completed`);
      await fetchData();
    } catch (error) { toast.error(getApiErrorMessage(error, `Could not ${action} campaign`)); }
  };

  const assignLead = async (id: string) => {
    try { const result = await apiPatch<{ message?: string }>(`/leads/${id}/auto-assign`); toast.success(result.message ?? 'Lead assigned to the best-fit agent'); await fetchData(); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Could not assign this lead')); }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    try { await apiPatch(`/leads/${id}/status`, { status }); toast.success(`Lead marked ${status.replace(/_/g, ' ')}`); await fetchData(); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Could not update lead status')); }
  };

  const checkLeadDuplicates = async (id: string) => {
    try { const result = await apiGet<unknown>(`/leads/${id}/duplicates`); const matches = unwrap<unknown[]>(result) ?? []; toast.info(matches.length ? `${matches.length} possible duplicate(s) found` : 'No likely duplicates found.'); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Could not check duplicates')); }
  };

  useEffect(() => { void fetchData(); }, [fetchData]);
  const pipelineData = useMemo(() => pipeline.map((stage) => ({ ...stage, count: stats?.leads.byStatus?.[stage.key] ?? 0 })), [stats]);
  const maxStage = Math.max(1, ...pipelineData.map((stage) => stage.count));
  const totalLeads = stats?.leads.total ?? 0;
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7 sm:space-y-8">
      <PageHeader title="Overview" eyebrow="COMMAND CENTER · DUBAI" description={`${greeting}${user?.firstName ? `, ${user.firstName}` : ''}. Your market and pipeline, in one live view.`} actions={<><Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={refreshing}><RefreshCw className={cn('mr-1.5 size-3.5', refreshing && 'animate-spin')}/>Sync view</Button><Button size="sm" onClick={() => router.push('/dashboard/leads/create')}><CirclePlus className="mr-1.5 size-3.5"/>Add lead</Button></>}/>

      {loadError && <div role="status" className="flex items-center justify-between rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-[11px] text-amber-100/80"><span>Some live signals did not load. The workspace is still available.</span><button className="font-semibold text-[#d6f66d]" onClick={() => void fetchData()}>Retry</button></div>}

      <section className="relative isolate overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#121e31] p-5 shadow-[0_24px_70px_rgba(0,0,0,.25)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 -z-20 bg-cover bg-[center_52%] opacity-[.3]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=82')" }}/>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,15,27,.98)_0%,rgba(9,15,27,.91)_46%,rgba(9,15,27,.46)_100%)]"/>
        <div className="absolute right-[8%] top-[-8rem] -z-10 size-[24rem] rounded-full bg-[#d6f66d]/10 blur-[100px]"/>
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl"><div className="mb-4 flex items-center gap-2"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#d6f66d] opacity-40"/><span className="relative inline-flex size-2 rounded-full bg-[#d6f66d]"/></span><span className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6f66d]">Your market is moving</span><span className="mx-1 h-3 w-px bg-white/15"/><span className="text-[9px] uppercase tracking-[.12em] text-white/45">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>
            <h2 className="max-w-[640px] text-[34px] font-medium leading-[1.06] tracking-[-.05em] text-white sm:text-[46px]">Turn intent into<br className="hidden sm:block"/> <span className="text-[#d6f66d]">momentum.</span></h2>
            <p className="mt-4 max-w-[460px] text-[11px] leading-6 text-slate-300/75 sm:text-[12px]">See the people, places and conversations that can move your business forward today.</p>
          </div>
          <div className="flex items-end gap-3 md:flex-col md:items-end"><div className="mb-0 flex items-center gap-2 rounded-xl border border-white/10 bg-[#08101b]/55 px-3 py-2 backdrop-blur-md"><MapPin className="size-3.5 text-[#d6f66d]"/><span className="text-[10px] font-medium text-white/80">Dubai, UAE</span><span className="ml-1 rounded-full bg-[#74dfb2]/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#74dfb2]">Live</span></div><button onClick={() => router.push('/dashboard/analytics')} className="hidden items-center gap-1.5 text-[10px] font-semibold text-white/60 transition hover:text-[#d6f66d] md:flex">Open market intelligence <ArrowUpRight className="size-3.5"/></button></div>
        </div>
        <div className="mt-8 grid max-w-[650px] grid-cols-3 border-t border-white/[0.12] pt-5 sm:mt-10 sm:pt-6">
          {[['Pipeline', totalLeads.toLocaleString(), 'live prospects'], ['Qualified', (stats?.leads.qualified ?? 0).toLocaleString(), 'high intent'], ['Listings', (stats?.properties.active ?? 0).toLocaleString(), 'active in Dubai']].map(([label, value, meta], index) => <div key={label} className={cn('px-3 first:pl-0 sm:px-6', index > 0 && 'border-l border-white/[0.11]')}><p className="text-[8px] font-semibold uppercase tracking-[.16em] text-white/45 sm:text-[9px]">{label}</p><p className="mt-2 text-xl font-semibold tracking-[-.04em] text-white sm:text-2xl">{loading ? '—' : value}</p><p className="mt-1 text-[8px] text-white/40 sm:text-[9px]">{meta}</p></div>)}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total leads" value={stats?.leads.total ?? '—'} change={`${stats?.leads.active ?? 0} active in pipeline`} trend="up" variant="default"/>
        <StatCard icon={Flame} label="High intent" value={stats?.leads.hot ?? stats?.leads.byQuality?.hot ?? '—'} change={`${stats?.leads.qualified ?? 0} qualified`} trend="up" variant="rose"/>
        <StatCard icon={Building2} label="Property inventory" value={stats?.properties.total ?? '—'} change={`${stats?.properties.active ?? 0} listings live`} trend="neutral" variant="sky"/>
        <StatCard icon={Megaphone} label="Campaigns" value={stats?.campaigns.total ?? '—'} change={`${stats?.campaigns.active ?? 0} in motion`} trend="neutral" variant="amber"/>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-start justify-between space-y-0 px-5 pb-3 pt-5 sm:px-6 sm:pt-6"><div><p className="eyebrow mb-1.5">LIVE FUNNEL</p><CardTitle className="text-[15px] font-semibold tracking-tight text-white">Pipeline momentum</CardTitle><p className="mt-1 text-[10px] text-slate-500">A snapshot of where your prospects are moving.</p></div><div className="grid size-9 place-items-center rounded-xl bg-[#d6f66d]/10 text-[#d6f66d]"><Zap className="size-4"/></div></CardHeader>
          <CardContent className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6"><div className="space-y-4">{pipelineData.map((stage, index) => <div key={stage.key} className="grid grid-cols-[76px_1fr_34px] items-center gap-3 sm:grid-cols-[95px_1fr_42px]"><span className="text-[9px] text-slate-500 sm:text-[10px]">{stage.label}</span><div className="h-2 overflow-hidden rounded-full bg-white/[0.045]"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(stage.count ? 6 : 0, (stage.count / maxStage) * 100)}%`, background: `linear-gradient(90deg,${stage.color}bb,${stage.color})`, boxShadow: `0 0 16px ${stage.color}35`, transitionDelay: `${index * 60}ms` }}/></div><span className="text-right font-mono text-[10px] tabular-nums text-slate-300">{stage.count}</span></div>)}</div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4"><span className="flex items-center gap-2 text-[9px] text-slate-500"><span className="size-1.5 rounded-full bg-[#d6f66d]"/>Live pipeline totals</span><button onClick={() => router.push('/dashboard/leads')} className="flex items-center gap-1 text-[9px] font-semibold text-[#d6f66d] hover:text-white">View leads <ChevronRight className="size-3"/></button></div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6"><p className="eyebrow mb-1.5">NEXT BEST ACTION</p><CardTitle className="text-[15px] font-semibold tracking-tight text-white">Momentum to build</CardTitle></CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
            <div className="rounded-2xl border border-[#ffad7a]/15 bg-[radial-gradient(ellipse_at_90%_0%,rgba(255,173,122,.1),transparent_55%),rgba(255,255,255,.02)] p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#ffad7a]/10 text-[#ffad7a]"><Clock3 className="size-4"/></span><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-slate-200">Reconnect with high intent</p><p className="mt-1 text-[9px] leading-relaxed text-slate-500">You have {stats?.leads.hot ?? stats?.leads.byQuality?.hot ?? 0} hot leads ready for a personal follow-up.</p><button onClick={() => router.push('/dashboard/leads')} className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold text-[#ffd184]">Open priority leads <ArrowRight className="size-3"/></button></div></div></div>
            <div className="grid grid-cols-2 gap-3"><button onClick={() => router.push('/dashboard/leads/create')} className="app-muted-panel flex items-center gap-2.5 p-3 text-left transition hover:border-[#d6f66d]/25"><span className="grid size-7 place-items-center rounded-lg bg-[#d6f66d]/10 text-[#d6f66d]"><CirclePlus className="size-3.5"/></span><span><span className="block text-[9px] font-semibold text-slate-200">Capture a lead</span><span className="mt-0.5 block text-[8px] text-slate-600">Add to your pipeline</span></span></button><button onClick={() => router.push('/dashboard/properties')} className="app-muted-panel flex items-center gap-2.5 p-3 text-left transition hover:border-[#79d8ef]/25"><span className="grid size-7 place-items-center rounded-lg bg-[#79d8ef]/10 text-[#79d8ef]"><Building2 className="size-3.5"/></span><span><span className="block text-[9px] font-semibold text-slate-200">Explore supply</span><span className="mt-0.5 block text-[8px] text-slate-600">Browse live listings</span></span></button></div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 px-5 pb-1 pt-5 sm:px-6 sm:pt-6"><div><p className="eyebrow mb-1.5">RECENT ACTIVITY</p><CardTitle className="text-[15px] font-semibold tracking-tight text-white">Latest prospects</CardTitle></div><button onClick={() => router.push('/dashboard/leads')} className="flex items-center gap-1 text-[9px] font-semibold text-slate-500 transition hover:text-[#d6f66d]">All leads <ArrowRight className="size-3"/></button></CardHeader>
          <CardContent className="px-2 pb-2 pt-3 sm:px-4">{recentLeads.length ? <LeadTable leads={recentLeads} loading={loading} onView={(id) => router.push(`/dashboard/leads/${id}`)} onAssign={assignLead} onStatus={updateLeadStatus} onDeduplicate={checkLeadDuplicates}/> : <div className="px-4 py-12 text-center text-[11px] text-slate-500">{loading ? 'Loading the live pipeline…' : 'Your latest prospects will appear here.'}</div>}</CardContent>
        </Card>

        <div className="space-y-4">
          <Card><CardHeader className="flex-row items-center justify-between space-y-0 px-5 pb-1 pt-5"><div><p className="eyebrow mb-1.5">MARKET RADAR</p><CardTitle className="text-[15px] font-semibold text-white">Featured supply</CardTitle></div><span className="rounded-full border border-[#79d8ef]/15 bg-[#79d8ef]/[0.06] px-2 py-1 text-[8px] uppercase tracking-wider text-[#79d8ef]">Dubai</span></CardHeader><CardContent className="grid gap-3 px-4 pb-4 pt-3 sm:grid-cols-2 2xl:grid-cols-1">{properties.map((property) => <PropertyCard key={property.id} property={property} onView={(id) => router.push(`/dashboard/properties/${id}`)}/>)}{!properties.length && <p className="py-8 text-center text-[10px] text-slate-500">Listing intelligence appears when the feed is connected.</p>}</CardContent></Card>
          <Card><CardHeader className="flex-row items-center justify-between space-y-0 px-5 pb-1 pt-5"><div><p className="eyebrow mb-1.5">IN MOTION</p><CardTitle className="text-[15px] font-semibold text-white">Campaign pulse</CardTitle></div><CalendarDays className="size-4 text-slate-500"/></CardHeader><CardContent className="space-y-3 px-4 pb-4 pt-3">{activeCampaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} onView={(id) => router.push(`/dashboard/campaigns/${id}`)} onStart={(id) => void handleCampaignAction(id, 'start')} onPause={(id) => void handleCampaignAction(id, 'pause')} onTest={(id) => void handleCampaignAction(id, 'test')}/>)}{!activeCampaigns.length && <div className="rounded-xl border border-dashed border-white/10 p-4 text-center"><p className="text-[10px] text-slate-500">No campaigns are running yet.</p><button onClick={() => router.push('/dashboard/campaigns')} className="mt-2 text-[9px] font-semibold text-[#d6f66d]">Explore campaigns <ArrowRight className="ml-1 inline size-3"/></button></div>}</CardContent></Card>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-white/[0.06] pt-4 text-[8px] uppercase tracking-[.14em] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>Dune intelligence · Dubai, UAE</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#74dfb2]"/>Workspace services online</span></footer>
    </div>
  );
}
