'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, getApiErrorMessage, toList } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { ScraperCard } from '@/components/dashboard/scraper-card';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ScraperListItem, ScraperSource, ScraperType, ScraperStatus } from '@/types';
import { Search, RefreshCw, Play, Settings, Globe2 } from 'lucide-react';

export default function ScrapersPage() {
  const router = useRouter();
  const [scrapers, setScrapers] = useState<ScraperListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<ScraperSource | ''>('');
  const [typeFilter, setTypeFilter] = useState<ScraperType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ScraperStatus | ''>('');

  const fetchScrapers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (sourceFilter) params.source = sourceFilter;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await apiGet<unknown>('/scrapers', params);
      setScrapers(toList<ScraperListItem>(res).items);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load data streams'));
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, typeFilter, statusFilter]);

  useEffect(() => { fetchScrapers(); }, [fetchScrapers]);

  const handleRunScraper = async (id: string) => {
    try {
      const result = await apiPost<{ message?: string }>(`/scrapers/${id}/run`);
      toast.success(result.message ?? 'Data stream action completed');
      await fetchScrapers();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not run this data stream'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scrapers"
        description="Automated property and lead data collection from external sources."
        actions={
          <div className="flex items-center gap-2">
            <Input placeholder="Search scrapers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as ScraperSource || '')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bayut">Bayut</SelectItem>
                <SelectItem value="propertyfinder">Property Finder</SelectItem>
                <SelectItem value="dubizzle">Dubizzle</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ScraperType || '')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="market_data">Market data</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ScraperStatus || '')}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            {(sourceFilter || typeFilter || statusFilter) && (
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => { setSourceFilter(''); setTypeFilter(''); setStatusFilter(''); }}>
                Clear
              </button>
            )}
          </div>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : scrapers.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Globe2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No scrapers configured.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scrapers.map((s) => (
                <ScraperCard
                  key={s.id}
                  scraper={s}
                  onRun={() => handleRunScraper(s.id)}
                  onView={(id) => router.push(`/dashboard/scrapers/${id}`)}
                  onEdit={(id) => router.push(`/dashboard/scrapers/${id}?tab=edit`)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
