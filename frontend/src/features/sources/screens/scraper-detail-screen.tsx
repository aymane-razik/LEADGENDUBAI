'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Globe2, Play, RefreshCw, Save, Workflow } from 'lucide-react';
import { apiGet, apiPost, apiPut, getApiErrorMessage } from '@/lib/api';
import type { ScraperListItem } from '@/types';
import { PageHeader } from '@/components/organisms/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function ScraperDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editing = searchParams.get('tab') === 'edit';
  const [scraper, setScraper] = useState<ScraperListItem | null>(null);
  const [form, setForm] = useState({ name: '', url: '', schedule: '', timezone: 'Asia/Dubai', enabled: true });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<{ data?: ScraperListItem }>(`/scrapers/${id}`);
      const item = response.data ?? null;
      setScraper(item);
      if (item) setForm({ name: item.name, url: item.config.url, schedule: item.schedule, timezone: item.timezone, enabled: item.enabled });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load this data stream'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const response = await apiPut<{ data?: ScraperListItem }>(`/scrapers/${id}`, form);
      setScraper(response.data ?? null);
      toast.success('Data stream settings saved');
      router.replace(`/dashboard/scrapers/${id}`);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save data stream settings'));
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setBusy(true);
    try {
      const response = await apiPost<{ message?: string }>(`/scrapers/${id}/run`);
      toast.success(response.message ?? 'Data stream action completed');
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not run this data stream'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-72"/><Skeleton className="h-64 w-full"/></div>;
  if (!scraper) return <Card><CardContent className="py-16 text-center"><Globe2 className="mx-auto mb-3 size-9 text-muted-foreground"/><h2 className="text-lg font-semibold">Data stream not found</h2><p className="mt-2 text-sm text-muted-foreground">This stream may have been removed.</p><Button className="mt-5" variant="outline" onClick={() => router.push('/dashboard/scrapers')}><ArrowLeft className="mr-2 size-4"/>Back to streams</Button></CardContent></Card>;

  return <div className="space-y-6">
    <PageHeader title={scraper.name} eyebrow="DATA STREAM / CONFIGURATION" description={`${scraper.source.replace(/_/g, ' ')} · ${scraper.type.replace(/_/g, ' ')} · ${scraper.timezone}`} actions={<><Button variant="outline" onClick={() => router.push('/dashboard/scrapers')}><ArrowLeft className="mr-2 size-4"/>All streams</Button><Button onClick={run} disabled={busy || !scraper.enabled}><Play className="mr-2 size-4"/>Run preview</Button></>} />
    {editing ? <Card><CardHeader><CardTitle>Stream configuration</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="stream-name">Name</Label><Input id="stream-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}/></div>
      <div className="space-y-2"><Label htmlFor="stream-url">Source URL</Label><Input id="stream-url" type="url" value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}/></div>
      <div className="space-y-2"><Label htmlFor="stream-schedule">Schedule (cron)</Label><Input id="stream-schedule" value={form.schedule} onChange={(event) => setForm((current) => ({ ...current, schedule: event.target.value }))}/></div>
      <div className="space-y-2"><Label htmlFor="stream-timezone">Timezone</Label><Input id="stream-timezone" value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}/></div>
      <div className="flex items-center justify-between rounded-xl border border-white/10 p-4"><div><p className="text-sm font-medium">Enabled</p><p className="text-xs text-muted-foreground">Disabled streams cannot run.</p></div><Switch checked={form.enabled} onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}/></div>
      <div className="flex items-end justify-end gap-2"><Button variant="outline" onClick={() => router.push(`/dashboard/scrapers/${id}`)}>Cancel</Button><Button onClick={save} disabled={busy}><Save className="mr-2 size-4"/>Save stream</Button></div>
    </CardContent></Card> : <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card><CardHeader><CardTitle>Source configuration</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex items-center gap-2"><Globe2 className="size-4 text-[#d6f66d]"/><span className="break-all">{scraper.config.url}</span></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[0.08] p-4"><p className="text-xs text-muted-foreground">Schedule</p><p className="mt-2 font-mono">{scraper.schedule}</p></div><div className="rounded-xl border border-white/[0.08] p-4"><p className="text-xs text-muted-foreground">Stream state</p><Badge className="mt-2 capitalize">{scraper.enabled ? scraper.status : 'disabled'}</Badge></div></div><div className="flex justify-end"><Button variant="outline" onClick={() => router.push(`/dashboard/scrapers/${id}?tab=edit`)}>Edit configuration</Button></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Latest run</CardTitle></CardHeader><CardContent className="space-y-4">{scraper.lastRun ? <><div className="flex items-center justify-between"><Badge variant={scraper.lastRun.status === 'success' ? 'success' : 'destructive'} className="capitalize">{scraper.lastRun.status}</Badge><span className="text-xs text-muted-foreground">{new Date(scraper.lastRun.startedAt).toLocaleString()}</span></div><div className="grid grid-cols-2 gap-3 text-sm"><p>Found <b className="float-right">{scraper.lastRun.itemsFound}</b></p><p>New <b className="float-right">{scraper.lastRun.itemsCreated}</b></p><p>Updated <b className="float-right">{scraper.lastRun.itemsUpdated}</b></p><p>Skipped <b className="float-right">{scraper.lastRun.itemsSkipped}</b></p></div><p className="text-xs text-muted-foreground">Demo runs update the activity preview only; they make no requests to listing sites.</p></> : <div className="py-8 text-center text-sm text-muted-foreground"><Workflow className="mx-auto mb-2 size-6"/>No run history yet.</div>}</CardContent></Card>
    </div>}
  </div>;
}
