'use client';

import { useState, useEffect } from 'react';
import { apiGet, getApiErrorMessage, unwrap } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { StatCard } from '@/components/organisms/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import { Users, Building2, Megaphone, TrendingUp, TrendingDown, Activity, DollarSign as DollarSignIcon, Mail as MailIcon, MessageSquare as MessageSquareIcon, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState(false);
  const [period, setPeriod] = useState('7d');

  const fetchData = async () => {
    setRefreshStatus(true);
    try {
      const res = await apiGet<DashboardStats>('/analytics/dashboard');
      setStats(unwrap(res));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load analytics'));
    } finally {
      setRefreshStatus(false);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { fetchData(); };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Performance dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance dashboard across leads, properties, and campaigns."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={handleRefresh} disabled={refreshStatus}>
              <RefreshCw className={cn('h-4 w-4', refreshStatus && 'animate-spin')} /> Refresh
            </button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Leads" value={stats?.leads.total ?? 0} change={`${stats?.leads.active ?? 0} active`} trend="up" variant="emerald" />
        <StatCard icon={Building2} label="Properties" value={stats?.properties.total ?? 0} change={`${stats?.properties.active ?? 0} active`} trend="neutral" variant="sky" />
        <StatCard icon={Megaphone} label="Campaigns" value={stats?.campaigns.total ?? 0} change={`${stats?.campaigns.active ?? 0} active`} trend="neutral" variant="amber" />
        <StatCard icon={DollarSignIcon} label="Campaign Revenue" value={stats?.campaigns.totalRevenue ? `AED ${stats.campaigns.totalRevenue.toLocaleString()}` : 0} change={`${stats?.campaigns.totalConverted ?? 0} conversions`} trend="up" variant="rose" />
      </div>

      {/* Lead distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Leads by Quality</CardTitle><CardDescription>Hot, warm, cold, and junk lead distribution</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['hot', 'warm', 'cold', 'junk'] as const).map((q) => {
                const count = stats?.leads.byQuality[q] ?? 0;
                const total = stats?.leads.total ?? 1;
                const pct = total > 0 ? (count / total) * 100 : 0;
                const colors = { hot: 'bg-orange-500', warm: 'bg-amber-500', cold: 'bg-slate-400', junk: 'bg-zinc-400' };
                return (
                  <div key={q} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${colors[q]}`} />
                        <span className="capitalize">{q}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{count}</span>
                        <span className="text-xs text-muted-foreground">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${colors[q]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Leads by Status</CardTitle><CardDescription>Pipeline stage distribution</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.leads.byStatus ?? {}).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 6).map(([status, count]) => {
                const total = stats?.leads.total ?? 1;
                const pct = total > 0 ? (Number(count) / total) * 100 : 0;
                const statusLabel = status.replace(/_/g, ' ');
                const colors: Record<string, string> = {
                  new: 'bg-emerald-500', contacted: 'bg-sky-500', qualified: 'bg-indigo-500',
                  meeting_scheduled: 'bg-violet-500', viewing_done: 'bg-purple-500',
                  negotiating: 'bg-amber-500', deal_closed: 'bg-rose-500', lost: 'bg-red-500', nurturing: 'bg-teal-500',
                };
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{statusLabel}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${colors[status] ?? 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead source breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Leads by Source</CardTitle><CardDescription>Channel performance</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats?.leads.bySource ?? {}).sort(([, a], [, b]) => Number(b) - Number(a)).map(([source, count]) => {
              const total = stats?.leads.total ?? 1;
              const pct = total > 0 ? (Number(count) / total) * 100 : 0;
              const colors: Record<string, string> = {
                bayut: 'bg-sky-500', propertyfinder: 'bg-indigo-500', dubizzle: 'bg-violet-500',
                facebook: 'bg-blue-500', instagram: 'bg-pink-500', landing_page: 'bg-emerald-500',
                referral: 'bg-amber-500', manual: 'bg-slate-500',
              };
              return (
                <div key={source} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className={`h-8 w-8 rounded-full ${colors[source] ?? 'bg-slate-400'} flex items-center justify-center text-white text-xs font-bold`}>
                    {source.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{source.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{count} leads ({pct.toFixed(0)}%)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Property analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Properties by Type</CardTitle><CardDescription>Listing mix</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(stats?.properties.byType ?? {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize text-sm">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-muted rounded-full w-20 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(Number(count) / (stats?.properties.total ?? 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium tabular-nums">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Properties by Purpose</CardTitle><CardDescription>Sale vs rent distribution</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.properties.byPurpose ?? {}).map(([purpose, count]) => {
                const total = stats?.properties.total ?? 1;
                const pct = total > 0 ? (Number(count) / total) * 100 : 0;
                return (
                  <div key={purpose} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{purpose}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-sky-500 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign metrics */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Campaign Performance</CardTitle><CardDescription>Delivery, engagement, and conversion metrics</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Sent', value: stats?.campaigns.totalSent ?? 0, icon: Send, color: 'text-muted-foreground' },
              { label: 'Delivered', value: stats?.campaigns.totalDelivered ?? 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Opens', value: stats?.campaigns.totalOpen ?? 0, icon: MailIcon, color: 'text-sky-600 dark:text-sky-400' },
              { label: 'Clicks', value: stats?.campaigns.totalClicked ?? 0, icon: MessageSquareIcon, color: 'text-rose-600 dark:text-rose-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Icon className={cn('h-5 w-5', color)} />
                <div>
                  <p className="text-2xl font-semibold font-mono">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top areas */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Top Areas by Listings</CardTitle><CardDescription>Most active property locations</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats?.properties.byArea ?? {}).slice(0, 8).map(([area, count]) => (
              <div key={area} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                <span className="text-sm capitalize">{area}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-emerald-500 rounded-full w-32 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(Number(count) / (stats?.properties.total ?? 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium tabular-nums w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Send({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
}

function CheckCircle2({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
}

