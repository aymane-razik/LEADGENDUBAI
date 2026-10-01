'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, getApiErrorMessage, toList } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { CampaignCard } from '@/components/dashboard/campaign-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CampaignListItem, CampaignStatus, CampaignType } from '@/types';
import { Plus, Search, Filter, RefreshCw, Play, Pause, RotateCcw, Megaphone, Link2 } from 'lucide-react';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CampaignType | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: '', type: 'email' as CampaignType, subject: '', body: '' });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await apiGet<unknown>('/campaigns', params);
      const { items, total } = toList<CampaignListItem>(res);
      setCampaigns(items);
      setTotal(total);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load campaigns'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleStatusChange = async (campaignId: string, action: 'start' | 'pause' | 'test') => {
    try {
      if (action === 'start') {
        const result = await apiPost<{ message?: string }>(`/campaigns/${campaignId}/start`);
        toast.success(result.message ?? 'Campaign started');
      } else if (action === 'pause') {
        await apiPost(`/campaigns/${campaignId}/pause`);
        toast.success('Campaign paused');
      } else if (action === 'test') {
        const result = await apiPost<{ message?: string }>(`/campaigns/${campaignId}/test`, { to: 'demo@example.invalid' });
        toast.success(result.message ?? 'Test action completed');
      }
      await fetchCampaigns();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update this campaign'));
    }
  };

  const handleCreate = async () => {
    if (!draft.name.trim() || !draft.body.trim() || (draft.type === 'email' && !draft.subject.trim())) return;
    setCreating(true);
    try {
      await apiPost('/campaigns', {
        name: draft.name.trim(),
        type: draft.type,
        status: 'draft',
        targeting: { filters: {}, maxRecipients: 25 },
        content: { subject: draft.subject.trim(), body: draft.body.trim() },
        schedule: { type: 'immediate', timezone: 'Asia/Dubai' },
        settings: { trackOpens: true, trackClicks: true, allowUnsubscribe: true },
      });
      toast.success('Draft campaign created');
      setCreateOpen(false);
      setDraft({ name: '', type: 'email', subject: '', body: '' });
      await fetchCampaigns();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create campaign'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Multi-channel marketing campaigns for lead engagement."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
              disabled={loading}
            />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Campaign
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus || '')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CampaignType || '')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="multi_channel">Multi-channel</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter || typeFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setTypeFilter(''); }}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No campaigns found.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onView={(id) => router.push(`/dashboard/campaigns/${id}`)}
                  onStart={() => handleStatusChange(c.id, 'start')}
                  onPause={() => handleStatusChange(c.id, 'pause')}
                  onTest={() => handleStatusChange(c.id, 'test')}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a campaign draft</DialogTitle>
            <DialogDescription>Build a message preview. Demo mode never sends messages to real contacts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="campaign-name">Campaign name</Label><Input id="campaign-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Marina launch follow-up" /></div>
            <div className="space-y-1.5"><Label htmlFor="campaign-type">Channel</Label><select id="campaign-type" className="h-10 w-full rounded-xl border border-white/10 bg-[#111a2a] px-3 text-sm text-white" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as CampaignType }))}><option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="multi_channel">Multi-channel</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="campaign-subject">Subject</Label><Input id="campaign-subject" value={draft.subject} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="A closer look at Dubai Marina" /></div>
            <div className="space-y-1.5"><Label htmlFor="campaign-body">Message</Label><textarea id="campaign-body" className="min-h-28 w-full rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm text-white" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Write the message your team will review…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={creating || !draft.name.trim() || !draft.body.trim() || (draft.type === 'email' && !draft.subject.trim())}>{creating ? 'Saving…' : 'Save draft'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
