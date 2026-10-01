'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch, apiPost, getApiErrorMessage, toList, unwrap } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { LeadTable } from '@/components/dashboard/lead-table';
import { CreateLeadDialog } from '@/components/dashboard/create-lead-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/ui/session-provider';
import { toast } from 'sonner';
import type { LeadListItem, CreateLeadInput, LeadStatus, LeadSource, LeadQuality, LeadTimeline, LeadPurpose, LeadPropertyType, LeadBudget, LeadLanguage } from '@/types';
import { Plus, Search, Filter, RefreshCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LeadsPage() {
  const router = useRouter();
  const { user } = useSession();
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [quality, setQuality] = useState<LeadQuality | ''>('');
  const [source, setSource] = useState<LeadSource | ''>('');
  const [intent, setIntent] = useState<'high' | 'medium' | 'low' | ''>('');
  const [timeline, setTimeline] = useState<LeadTimeline | ''>('');
  const [purpose, setPurpose] = useState<LeadPurpose | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportLeads = async () => {
    setExporting(true);
    try {
      const response = await apiGet<unknown>('/leads/export');
      const records = unwrap<LeadListItem[]>(response) ?? [];
      if (!records.length) { toast.info('There are no leads to export'); return; }
      const columns: Array<keyof LeadListItem> = ['firstName', 'lastName', 'email', 'phone', 'source', 'status', 'quality', 'intent', 'score', 'timeline'];
      const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const csv = [columns.join(','), ...records.map((lead) => columns.map((column) => csvCell(lead[column])).join(','))].join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = `dune-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast.success(`Exported ${records.length} leads`);
    } catch (error) { toast.error(getApiErrorMessage(error, 'Could not export leads')); }
    finally { setExporting(false); }
  };

  const autoAssignLead = async (id: string) => {
    try {
      const response = await apiPatch<{ message?: string }>(`/leads/${id}/auto-assign`);
      toast.success(response.message ?? 'Lead assigned to the best-fit agent');
      await fetchLeads();
    } catch (error) { toast.error(getApiErrorMessage(error, 'Could not assign lead')); }
  };

  const changeLeadStatus = async (id: string, nextStatus: LeadStatus) => {
    try {
      const response = await apiPatch<{ message?: string }>(`/leads/${id}/status`, { status: nextStatus });
      toast.success(response.message ?? `Lead marked ${nextStatus.replace(/_/g, ' ')}`);
      await fetchLeads();
    } catch (error) { toast.error(getApiErrorMessage(error, 'Could not update lead status')); }
  };

  const checkDuplicates = async (id: string) => {
    try {
      const response = await apiGet<unknown>(`/leads/${id}/duplicates`);
      const matches = unwrap<unknown[]>(response) ?? [];
      toast.info(matches.length ? `${matches.length} possible duplicate${matches.length === 1 ? '' : 's'} found. Review the lead details.` : 'No likely duplicates found.');
    } catch (error) { toast.error(getApiErrorMessage(error, 'Could not check duplicates')); }
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit, page };
      if (search) params.search = search;
      if (status) params.status = status;
      if (quality) params.quality = quality;
      if (source) params.source = source;
      if (intent) params.intent = intent;
      if (timeline) params.timeline = timeline;
      if (purpose) params.purpose = purpose;
      const res = await apiGet<unknown>('/leads', params);
      const { items, total } = toList<LeadListItem>(res);
      setLeads(items);
      setTotal(total);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load leads'));
    } finally {
      setLoading(false);
    }
  }, [search, status, quality, source, intent, timeline, purpose, page, limit]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Manage and prioritize your Dubai real estate leads with smart scoring."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLeads} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" /> {exporting ? 'Exporting…' : 'Export'}
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Lead
            </Button>
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
              disabled={loading}
            />
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus || '')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="meeting_scheduled">Meeting</SelectItem>
                <SelectItem value="viewing_done">Viewing</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="deal_closed">Deal Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="nurturing">Nurturing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={quality} onValueChange={(v) => setQuality(v as LeadQuality || '')}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Quality" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="junk">Junk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={(v) => setSource(v as LeadSource || '')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bayut">Bayut</SelectItem>
                <SelectItem value="propertyfinder">Property Finder</SelectItem>
                <SelectItem value="dubizzle">Dubizzle</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="landing_page">Landing Page</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={intent} onValueChange={(v) => setIntent(v as 'high' | 'medium' | 'low' || '')}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Intent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeline} onValueChange={(v) => setTimeline(v as LeadTimeline || '')}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Timeline" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="1-3months">1-3 Months</SelectItem>
                <SelectItem value="3-6months">3-6 Months</SelectItem>
                <SelectItem value="6-12months">6-12 Months</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as LeadPurpose || '')}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Purpose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="invest">Invest</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
            {(status || quality || source || intent || timeline || purpose) && (
              <Button variant="ghost" size="sm" onClick={() => { setStatus(''); setQuality(''); setSource(''); setIntent(''); setTimeline(''); setPurpose(''); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lead table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <LeadTable
              leads={leads}
              onView={(id) => router.push(`/dashboard/leads/${id}`)}
              onAssign={autoAssignLead}
              onStatus={changeLeadStatus}
              onDeduplicate={checkDuplicates}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} leads
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create lead dialog */}
      <CreateLeadDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => { fetchLeads(); toast.success('Lead created'); }}
      />
    </div>
  );
}
