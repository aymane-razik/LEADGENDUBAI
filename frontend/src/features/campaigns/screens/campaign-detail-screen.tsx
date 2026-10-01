'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPost, apiPatch, getApiErrorMessage, unwrap } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CampaignListItem, CampaignDripStep } from '@/types';
import {
  Play, Pause, RotateCcw, Link2, Mail, MessageSquare, Phone, Smartphone, Megaphone,
  Users, Target, Clock, Calendar, CheckCircle2, AlertCircle, BarChart3, Copy, RefreshCw, Send
} from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<CampaignListItem | null>(null);
  const [dripSchedule, setDripSchedule] = useState<CampaignDripStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampaign = async () => {
    try {
      const [c, d] = await Promise.all([
        apiGet<{ success: boolean; data: CampaignListItem }>(`/campaigns/${id}`),
        apiGet<unknown>(`/campaigns/${id}/drip-schedule`),
      ]);
      setCampaign(c.data ?? null);
      setDripSchedule(unwrap<{ steps?: CampaignDripStep[] }>(d).steps ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load campaign'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCampaign(); }, [id]);

  const handleRefresh = () => { setRefreshing(true); fetchCampaign(); };

  const handleStatusAction = async (action: 'start' | 'pause' | 'test') => {
    try {
      if (action === 'start') {
        const result = await apiPost<{ message?: string }>(`/campaigns/${id}/start`);
        toast.success(result.message ?? 'Campaign started');
      } else if (action === 'pause') {
        await apiPost(`/campaigns/${id}/pause`);
        toast.success('Campaign paused');
      } else if (action === 'test') {
        const result = await apiPost<{ message?: string }>(`/campaigns/${id}/test`, { to: campaign?.content.variables?.['lead_email'] ?? 'demo@example.invalid' });
        toast.success(result.message ?? 'Test action completed');
      }
      fetchCampaign();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update campaign'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-medium">Campaign not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/campaigns')}>Back to campaigns</Button>
      </div>
    );
  }

  const deliveryRate = campaign.metrics.sent > 0 ? ((campaign.metrics.delivered / campaign.metrics.sent) * 100).toFixed(1) : 0;
  const openRate = campaign.metrics.delivered > 0 ? ((campaign.metrics.opened / campaign.metrics.delivered) * 100).toFixed(1) : 0;
  const clickRate = campaign.metrics.opened > 0 ? ((campaign.metrics.clicked / campaign.metrics.opened) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={`${campaign.type.replace(/_/g, ' ')} • ${campaign.status} • ${campaign.schedule.type} schedule`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} /> Refresh
            </Button>
            {campaign.status === 'draft' && (
              <Button size="sm" onClick={() => handleStatusAction('start')}>
                <Play className="h-4 w-4 mr-2" /> Start
              </Button>
            )}
            {campaign.status === 'active' && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleStatusAction('pause')}>
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleStatusAction('test')}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Test
                </Button>
              </>
            )}
            {campaign.status === 'paused' && (
              <Button size="sm" onClick={() => handleStatusAction('start')}>
                <Play className="h-4 w-4 mr-2" /> Resume
              </Button>
            )}
          </div>
        }
      />

      {/* Status + type badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={cn(
          campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
          campaign.status === 'paused' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
          campaign.status === 'draft' ? 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300' :
          campaign.status === 'completed' ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' :
          'bg-zinc-50 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300',
        )}>{campaign.status}</Badge>
        <Badge variant="secondary" className="capitalize">{campaign.type.replace(/_/g, ' ')}</Badge>
        <Badge variant="outline" className="capitalize">{campaign.schedule.type}</Badge>
        {campaign.schedule.type !== 'immediate' && campaign.schedule.startDate && (
          <Badge variant="outline">Starts {new Date(campaign.schedule.startDate).toLocaleDateString('en-IE')}</Badge>
        )}
      </div>

      {/* Metrics overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Sent', value: campaign.metrics.sent, icon: Send, color: 'text-muted-foreground' },
          { label: 'Delivered', value: campaign.metrics.delivered, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Opens', value: campaign.metrics.opened, icon: Mail, color: 'text-sky-600 dark:text-sky-400' },
          { label: 'Clicks', value: campaign.metrics.clicked, icon: Link2, color: 'text-rose-600 dark:text-rose-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Icon className={cn('h-4 w-4', color)} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-semibold font-mono">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion metrics */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Conversion & Engagement</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Delivery rate</p>
              <div className="flex items-center gap-2">
                <Progress value={Number(deliveryRate)} className="h-1.5 flex-1" />
                <span className="text-sm font-medium tabular-nums w-12 text-right">{deliveryRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open rate</p>
              <div className="flex items-center gap-2">
                <Progress value={Number(openRate)} className="h-1.5 flex-1" />
                <span className="text-sm font-medium tabular-nums w-12 text-right">{openRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Click rate</p>
              <div className="flex items-center gap-2">
                <Progress value={Number(clickRate)} className="h-1.5 flex-1" />
                <span className="text-sm font-medium tabular-nums w-12 text-right">{clickRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conversions</p>
              <p className="text-lg font-semibold">{campaign.metrics.converted}</p>
            </div>
          </div>
          {campaign.metrics.failed > 0 && (
            <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
              {campaign.metrics.failed} failed/failed deliveries
            </div>
          )}
          {campaign.metrics.replied > 0 && (
            <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
              <MessageSquare className="h-4 w-4" />
              {campaign.metrics.replied} replies
            </div>
          )}
          {campaign.metrics.unsubscribed > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <RotateCcw className="h-4 w-4" />
              {campaign.metrics.unsubscribed} unsubscribed
            </div>
          )}
          {campaign.metrics.revenue != null && campaign.metrics.revenue > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="h-4 w-4" />
              Revenue: AED {campaign.metrics.revenue.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {campaign.content.subject && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Subject</Label>
                <p className="text-sm">{campaign.content.subject}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Body</Label>
              <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">{campaign.content.body}</div>
            </div>
            {campaign.content.template && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Template</Label>
                <p className="text-sm">{campaign.content.template}</p>
              </div>
            )}
            {campaign.content.variables && Object.keys(campaign.content.variables).length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Variables</Label>
                <div className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
                  {Object.entries(campaign.content.variables).map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="text-muted-foreground">{k}:</span> <span>{v}</span></div>
                  ))}
                </div>
              </div>
            )}
            {campaign.content.attachments && campaign.content.attachments.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Attachments</Label>
                <div className="flex flex-wrap gap-1">
                  {campaign.content.attachments.map((a) => (
                    <Badge key={a} variant="secondary">{a}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Targeting */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Targeting</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
              {Object.entries(campaign.targeting.filters).length > 0 ? (
                Object.entries(campaign.targeting.filters).map(([k, v]) => (
                  <div key={k} className="flex gap-2"><span className="text-muted-foreground">{k}:</span> <span>{JSON.stringify(v)}</span></div>
                ))
              ) : (
                <p className="text-muted-foreground">No filters defined</p>
              )}
            </div>
            {campaign.targeting.maxRecipients != null && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Max recipients</Label>
                <p className="text-sm">{campaign.targeting.maxRecipients}</p>
              </div>
            )}
            {campaign.targeting.includeLeadIds && campaign.targeting.includeLeadIds.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Included leads ({campaign.targeting.includeLeadIds.length})</Label>
                <p className="text-xs font-mono text-muted-foreground">{campaign.targeting.includeLeadIds.slice(0, 5).join(', ')}{campaign.targeting.includeLeadIds.length > 5 ? '...' : ''}</p>
              </div>
            )}
            {campaign.settings.trackOpens && <div><Input type="checkbox" defaultChecked readOnly className="h-4 w-4" /><Label className="text-xs">Track opens</Label></div>}
            {campaign.settings.trackClicks && <div><Input type="checkbox" defaultChecked readOnly className="h-4 w-4" /><Label className="text-xs">Track clicks</Label></div>}
            {campaign.settings.allowUnsubscribe && <div><Input type="checkbox" defaultChecked readOnly className="h-4 w-4" /><Label className="text-xs">Allow unsubscribe</Label></div>}
            {campaign.settings.replyToEmail && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Reply-to</Label>
                <p className="text-sm">{campaign.settings.replyToEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Schedule type</p>
              <p className="text-sm capitalize">{campaign.schedule.type}</p>
            </div>
            {campaign.schedule.timezone && (
              <div>
                <p className="text-xs text-muted-foreground">Timezone</p>
                <p className="text-sm">{campaign.schedule.timezone}</p>
              </div>
            )}
          </div>
          {campaign.schedule.type === 'scheduled' && campaign.schedule.startDate && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Start date</Label>
              <p className="text-sm">{new Date(campaign.schedule.startDate).toLocaleString('en-IE')}</p>
            </div>
          )}
          {campaign.schedule.type === 'drip' && dripSchedule.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Drip sequence</Label>
              <div className="space-y-2">
                {dripSchedule.map((step) => (
                  <div key={step.step} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-6">Step {step.step}</span>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs">{new Date(step.scheduledAt).toLocaleString('en-IE')}</span>
                      {step.condition && <Badge variant="secondary" className="text-2xs ml-2">{step.condition}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {campaign.schedule.type === 'triggered' && (
            <div className="text-sm text-muted-foreground">Trigger-based campaign. Messages sent automatically when lead meets trigger conditions.</div>
          )}
        </CardContent>
      </Card>

      {/* Recipients preview */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recipients Preview</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="mb-2" onClick={() => router.push(`/dashboard/campaigns/${id}/recipients`)}>
            <Users className="h-4 w-4 mr-2" /> View recipients
          </Button>
          <p className="text-xs text-muted-foreground">{campaign.targeting.maxRecipients ? `Up to ${campaign.targeting.maxRecipients} recipients` : 'All eligible leads'} • {campaign.metrics.sent} sent • {campaign.metrics.delivered} delivered</p>
        </CardContent>
      </Card>
    </div>
  );
}
