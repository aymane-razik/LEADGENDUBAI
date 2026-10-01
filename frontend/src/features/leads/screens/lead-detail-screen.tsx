'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPost, apiPatch, getApiErrorMessage, toList, unwrap } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/components/ui/session-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LeadDetail, ScoreExplainResult, DuplicateMatch, LeadStatus, UserListItem } from '@/types';
import {
  Mail, Phone, MapPin, Calendar, DollarSign, Building2, Users, UserCheck, AlertCircle,
  CheckCircle2, ChevronLeft, Clock, TrendingUp, Link2, Copy, RefreshCw, Activity, MessageSquare, FileText, PhoneCall, BarChart3
} from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useSession();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [scoreExplain, setScoreExplain] = useState<ScoreExplainResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLead = async () => {
    try {
      const [l, s, d] = await Promise.all([
        apiGet<{ success: boolean; data: LeadDetail }>(`/leads/${id}`),
        apiGet<unknown>(`/leads/${id}/score/explain`),
        apiGet<unknown>(`/leads/${id}/duplicates`),
      ]);
      setLead(l.data ?? null);
      setScoreExplain(unwrap<ScoreExplainResult | null>(s));
      setDuplicates(unwrap<DuplicateMatch[]>(d) ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load lead'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLead(); }, [id]);

  const handleRefresh = () => { setRefreshing(true); fetchLead(); };

  const updateStatus = async (status: LeadStatus) => {
    setSubmitting(true);
    try {
      await apiPatch(`/leads/${id}/status`, { status });
      toast.success(`Lead marked as ${status.replace(/_/g, ' ')}`);
      setStatusOpen(false);
      fetchLead();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update status'));
    } finally {
      setSubmitting(false);
    }
  };

  const assignAgent = async (userId: string) => {
    setSubmitting(true);
    try {
      await apiPatch(`/leads/${id}/assign`, { userId });
      toast.success('Lead assigned');
      setAssignOpen(false);
      fetchLead();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to assign lead'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyValue = (value: string, label: string) => {
    navigator.clipboard?.writeText(value);
    toast.success(`${label} copied`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-medium">Lead not found</h2>
        <p className="text-sm text-muted-foreground mt-1">This lead may have been deleted.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/leads')}>Back to leads</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description={`${lead.source.replace(/_/g, ' ')} • ${lead.email} • ${lead.phone}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} /> Refresh
            </Button>
            <Button size="sm" onClick={() => copyValue(lead.email, 'Email')}>
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
            <Button size="sm" onClick={() => copyValue(lead.phone, 'Phone')}>
              <Phone className="h-4 w-4 mr-2" /> Call
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
              <UserCheck className="h-4 w-4 mr-2" /> Assign
            </Button>
          </div>
        }
      />

      {/* Score + quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-900/10 dark:to-sky-900/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-muted-foreground">Lead Score</span>
              </div>
              <Badge className={lead.quality === 'hot' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : lead.quality === 'warm' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : lead.quality === 'cold' ? 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300' : 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300'}>
                {lead.quality}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">{lead.score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Intent</p>
                <p className={cn('text-sm font-medium capitalize', lead.intent === 'high' ? 'text-rose-600 dark:text-rose-400' : lead.intent === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400')}>
                  {lead.intent}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Probability</p>
                <p className="text-sm font-medium tabular-nums">{(lead.probability * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Urgency</p>
                <p className="text-sm font-medium tabular-nums">{lead.urgency}/10</p>
              </div>
            </div>
            {scoreExplain && (
              <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => router.push(`/dashboard/leads/${id}?tab=score`)}>
                <BarChart3 className="h-3.5 w-3.5 mr-1" /> View score breakdown
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Locations</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {lead.locations.map((loc) => (
                <Badge key={loc} variant="secondary">{loc}</Badge>
              ))}
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Timeline</p>
              <p className="text-sm font-medium capitalize">{lead.timeline.replace(/-/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Purpose</p>
              <p className="text-sm font-medium capitalize">{lead.purpose}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Properties</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {lead.propertyType.map((t) => (
                  <Badge key={t} variant="outline" className="text-2xs capitalize">{t.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">{lead.email}</a>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => copyValue(lead.email, 'Email')}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">{lead.phone}</a>
                  {lead.whatsapp && (
                    <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 ml-2">
                      WhatsApp
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => copyValue(lead.phone, 'Phone')}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
                {lead.nationality && <div><p className="text-xs text-muted-foreground">Nationality</p><p className="text-sm">{lead.nationality}</p></div>}
                {lead.language && <div><p className="text-xs text-muted-foreground flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> Language</p><p className="text-sm capitalize">{lead.language}</p></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Range</p>
                  <p className="text-lg font-semibold">
                    {lead.budget.currency === 'USD' ? '$' : 'AED '}
                    {lead.budget.max >= 1_000_000 ? `${(lead.budget.max / 1_000_000).toFixed(2)}M` : `${Math.round(lead.budget.max / 1000)}K`}
                  </p>
                  {lead.budget.min > 0 && <p className="text-xs text-muted-foreground">
                    from {lead.budget.currency === 'USD' ? '$' : 'AED '}{lead.budget.min >= 1_000_000 ? `${(lead.budget.min / 1_000_000).toFixed(2)}M` : `${Math.round(lead.budget.min / 1000)}K`}
                  </p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-sm capitalize">{lead.budget.currency}</p>
                </div>
                {lead.income != null && <div><p className="text-xs text-muted-foreground">Income</p><p className="text-sm">AED {lead.income.toLocaleString()}</p></div>}
                {lead.employmentStatus && <div><p className="text-xs text-muted-foreground">Employment</p><p className="text-sm capitalize">{lead.employmentStatus.replace(/_/g, ' ')}</p></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status & Assignment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge className={cn(
                    lead.status === 'new' ? 'status-new' : lead.status === 'contacted' ? 'status-contacted' : lead.status === 'qualified' ? 'status-qualified' : lead.status === 'meeting_scheduled' ? 'status-meeting_scheduled' : lead.status === 'viewing_done' ? 'status-viewing_done' : lead.status === 'negotiating' ? 'status-negotiating' : lead.status === 'deal_closed' ? 'status-deal_closed' : lead.status === 'lost' ? 'status-lost' : 'status-nurturing',
                  )}>{lead.status.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><UserCheck className="h-3 w-3" /> Assigned</span>
                  <span className="text-sm">{lead.assignedTo ? lead.assignedToName ?? lead.assignedTo : 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Last contact</span>
                  <span className="text-sm">{lead.lastContact ? new Date(lead.lastContact).toLocaleString('en-IE') : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Next follow-up</span>
                  <span className="text-sm">{lead.nextFollowup ? new Date(lead.nextFollowup).toLocaleString('en-IE') : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Touchpoints</span>
                  <span className="text-sm font-medium">{lead.touchpoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Response rate</span>
                  <span className="text-sm font-medium">{(lead.responseRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)}>Update status</Button>
                  {lead.status !== 'new' && (
                    <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>Reassign</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {lead.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Enrichment Data</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lead.enrichmentData?.linkedinProfile && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                  <a href={lead.enrichmentData.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5" /> {lead.enrichmentData.linkedinProfile}
                  </a>
                </div>
              )}
              {lead.enrichmentData?.companyInfo && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Company Info</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(lead.enrichmentData.companyInfo, null, 2)}</pre>
                </div>
              )}
              {lead.enrichmentData?.socialProfiles && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Social Profiles</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(lead.enrichmentData.socialProfiles, null, 2)}</pre>
                </div>
              )}
              {lead.enrichmentData?.estimatedNetWorth != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Net Worth</p>
                  <p className="text-sm font-medium">AED {lead.enrichmentData.estimatedNetWorth.toLocaleString()}</p>
                </div>
              )}
              {(!lead.enrichmentData || Object.keys(lead.enrichmentData).length === 0) && (
                <p className="text-sm text-muted-foreground">No enrichment data yet. Enrich this lead to gather additional insights.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="score" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Score Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {scoreExplain && Object.entries(scoreExplain.factors).map(([name, value]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-medium tabular-nums">{value.toFixed(2)} / {scoreExplain.maxPossible}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          value >= 20 ? 'bg-emerald-500' : value >= 10 ? 'bg-amber-500' : 'bg-slate-400',
                        )}
                        style={{ width: `${(value / (scoreExplain.maxPossible || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total Score</span>
                <span className="text-lg font-bold tabular-nums">{scoreExplain?.score ?? 0} / {scoreExplain?.maxPossible ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Profile: {scoreExplain?.profile ?? 'default'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lead Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Lead captured on {new Date(lead.capturedAt).toLocaleString('en-IE')}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Scoring profile:</span>
                <span className="font-medium">{scoreExplain?.profile ?? 'default'}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Source:</span>
                <span className="font-medium capitalize">{lead.source.replace(/_/g, ' ')}</span>
              </div>
              {lead.utmSource && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">UTM Source:</span>
                  <span className="font-medium">{lead.utmSource}</span>
                </div>
              )}
              {lead.utmMedium && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">UTM Medium:</span>
                  <span className="font-medium">{lead.utmMedium}</span>
                </div>
              )}
              {lead.utmCampaign && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">UTM Campaign:</span>
                  <span className="font-medium">{lead.utmCampaign}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Potential duplicates detected for this lead.</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} /> Check again
            </Button>
          </div>
          {duplicates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No duplicates found for this lead.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {duplicates.map((dup) => (
                <Card key={dup.leadId} className="border-l-4 border-l-amber-400 dark:border-l-amber-600">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 text-xs font-medium">
                          {dup.leadId.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">Duplicate #{dup.leadId.slice(0, 8)}</span>
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {dup.similarity.toFixed(0)}% match
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-muted-foreground">Email match:</span> <span className={dup.factors.email ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{dup.factors.email ? 'Yes' : 'No'}</span></div>
                      <div><span className="text-muted-foreground">Phone match:</span> <span className={dup.factors.phone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{dup.factors.phone ? 'Yes' : 'No'}</span></div>
                      <div><span className="text-muted-foreground">Name similarity:</span> {dup.factors.nameSimilarity.toFixed(2)}</div>
                      <div><span className="text-muted-foreground">Budget overlap:</span> <span className={dup.factors.budgetOverlap ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{dup.factors.budgetOverlap ? 'Yes' : 'No'}</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground">{dup.explanation}</p>
                    <p className="text-xs text-muted-foreground">Matched on: {dup.matchedFields.join(', ')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign dialog */}
      <AssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={(userId) => assignAgent(userId)}
        currentAssignee={lead.assignedTo}
      />

      {/* Status dialog */}
      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        currentStatus={lead.status}
        onStatusChange={updateStatus}
      />
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 010 20 14.5 14.5 0 010-20z" />
      <path d="M2 12h20" />
    </svg>
  );
}

function AssignDialog({ open, onOpenChange, onAssigned, currentAssignee }: { open: boolean; onOpenChange: (v: boolean) => void; onAssigned: (id: string) => Promise<void>; currentAssignee?: string }) {
  const [selected, setSelected] = useState(currentAssignee ?? '');
  const [agents, setAgents] = useState<UserListItem[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  useEffect(() => {
    if (!open) return;
    setSelected(currentAssignee ?? '');
    setLoadingAgents(true);
    apiGet<unknown>('/users/agents')
      .then((response) => setAgents(toList<UserListItem>(response).items.filter((agent) => agent.isActive && agent.role === 'agent')))
      .catch((error: unknown) => toast.error(getApiErrorMessage(error, 'Could not load available agents')))
      .finally(() => setLoadingAgents(false));
  }, [open, currentAssignee]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Agent</DialogTitle>
          <DialogDescription>Select an agent to assign this lead to.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger>
            <SelectContent>
            {agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.firstName} {agent.lastName}{agent.team ? ` · ${agent.team}` : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        {!loadingAgents && agents.length === 0 && <p className="text-xs text-muted-foreground">No active agents are available to assign.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void onAssigned(selected)} disabled={!selected || loadingAgents}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusDialog({ open, onOpenChange, currentStatus, onStatusChange }: { open: boolean; onOpenChange: (v: boolean) => void; currentStatus: LeadStatus; onStatusChange: (status: LeadStatus) => void }) {
  const [selected, setSelected] = useState(currentStatus);
  const [submitting, setSubmitting] = useState(false);
  const statuses: LeadStatus[] = ['contacted', 'qualified', 'meeting_scheduled', 'viewing_done', 'negotiating', 'deal_closed', 'lost', 'nurturing'];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>Current status: <Badge className="status-new">{currentStatus.replace(/_/g, ' ')}</Badge></DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
          {statuses.map((s) => (
            <button
              key={s}
              className={cn(
                'flex items-center justify-between p-2 rounded-md border text-left transition-colors',
                selected === s ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-secondary border-transparent',
              )}
              onClick={() => setSelected(s)}
            >
              <span className="text-sm capitalize">{s.replace(/_/g, ' ')}</span>
              {selected === s && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { setSubmitting(true); setTimeout(() => { onStatusChange(selected); setSubmitting(false); onOpenChange(false); }, 300); }} disabled={submitting}>
            {submitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
