'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { WebhookRow } from '@/components/dashboard/webhook-row';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { WebhookSubscription } from '@/types';
import { Plus, Search, RefreshCw, Link2, Shield, Trash2, Edit2, Play, Copy, Activity } from 'lucide-react';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookSubscription | null>(null);
  const [form, setForm] = useState({ url: '', secret: '', events: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ success: boolean; data: WebhookSubscription[] }>('/webhooks');
      setWebhooks(res.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load webhooks'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const handleCreate = async () => {
    if (!form.url || !form.secret || !form.events) return;
    let endpoint: URL;
    try { endpoint = new URL(form.url); } catch { toast.error('Enter a valid HTTPS endpoint URL.'); return; }
    if (endpoint.protocol !== 'https:') { toast.error('Webhook endpoints must use HTTPS.'); return; }
    if (form.secret.length < 24) { toast.error('The signing secret must contain at least 24 characters.'); return; }
    const allowedEvents = new Set(['lead.created', 'lead.updated', 'lead.deleted', 'lead.status_changed', 'lead.assigned', 'lead.merged', 'lead.enriched', 'property.scraped', 'property.updated', 'campaign.message_dispatched', 'campaign.batch_dispatched', 'scraper.run_completed', 'scraper.run_failed']);
    const events = form.events.split(',').map((event) => event.trim()).filter(Boolean);
    const unsupported = events.filter((event) => !allowedEvents.has(event));
    if (!events.length || unsupported.length) { toast.error(unsupported.length ? `Unsupported event: ${unsupported.join(', ')}` : 'Choose at least one event.'); return; }
    setSubmitting(true);
    try {
      await apiPost('/webhooks', {
        url: form.url,
        secret: form.secret,
        events,
        active: true,
      });
      toast.success('Webhook created');
      setCreateOpen(false);
      setForm({ url: '', secret: '', events: '' });
      fetchWebhooks();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create webhook'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/webhooks/${id}`);
      toast.success('Webhook deleted');
      fetchWebhooks();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not delete webhook'));
    }
  };

  const handleTest = async () => {
    if (!selectedWebhook) return;
    setSubmitting(true);
    try {
      const result = await apiPost<{ message?: string }>(`/webhooks/${selectedWebhook.id}/test`);
      toast.success(result.message ?? 'Webhook test completed');
      setTestOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not test webhook'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    toast.success('URL copied');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        description="Outbound event notifications for lead, property, and campaign events."
        actions={
          <div className="flex items-center gap-2">
            <Input placeholder="Search webhooks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Webhook
            </Button>
          </div>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-border"><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-4 w-full" /></div>
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Link2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No webhooks configured. Add a webhook to receive real-time event notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {webhooks.map((wh) => (
                <WebhookRow
                  key={wh.id}
                  webhook={wh}
                  onEdit={() => { setSelectedWebhook(wh); setEditOpen(true); }}
                  onTest={() => { setSelectedWebhook(wh); setTestOpen(true); }}
                  onDelete={() => handleDelete(wh.id)}
                  onCopyUrl={(url) => copyUrl(url)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>Configure a webhook endpoint to receive event notifications.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="url">Endpoint URL *</Label>
              <Input id="url" type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://your-app.com/webhooks" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="secret">Signing Secret *</Label>
              <Input id="secret" type="password" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} placeholder="Your webhook secret" />
              <p className="text-xs text-muted-foreground">Used to sign payloads with HMAC-SHA256</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="events">Events *</Label>
              <Input id="events" value={form.events} onChange={(e) => setForm((f) => ({ ...f, events: e.target.value }))} placeholder="lead.created,lead.assigned,property.scraped" />
              <p className="text-xs text-muted-foreground">Comma-separated event names</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !form.url || !form.secret || !form.events}>
              {submitting ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>Update webhook configuration.</DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Endpoint URL</Label>
                <Input value={selectedWebhook.url} readOnly className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Secret</Label>
                <Input type="password" value="••••••••" readOnly className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Events</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedWebhook.events.map((e) => (
                    <Badge key={e} variant="secondary">{e}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={selectedWebhook.active ? 'success' : 'destructive'}>{selectedWebhook.active ? 'Active' : 'Paused'}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>Send a test event to the webhook endpoint.</DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Endpoint URL</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs break-all">{selectedWebhook.url}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyUrl(selectedWebhook.url)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={selectedWebhook.active ? 'success' : 'destructive'}>{selectedWebhook.active ? 'Active' : 'Paused'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Payloads will be signed with HMAC-SHA256
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button onClick={handleTest} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
