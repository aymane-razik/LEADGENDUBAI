'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Users } from 'lucide-react';
import { apiGet, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface RecipientPreview {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  status: string;
  quality: string;
  score: number;
}

interface RecipientResponse {
  data?: { targeting: { filters?: Record<string, unknown>; maxRecipients?: number }; recipients: RecipientPreview[]; total: number; simulated?: boolean };
}

export default function CampaignRecipientsScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaignName, setCampaignName] = useState('Campaign recipients');
  const [recipients, setRecipients] = useState<RecipientPreview[]>([]);
  const [limit, setLimit] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<{ data?: { name?: string } }>(`/campaigns/${id}`),
      apiGet<RecipientResponse>(`/campaigns/${id}/recipients`),
    ]).then(([campaign, result]) => {
      if (!active) return;
      setCampaignName(campaign.data?.name ?? 'Campaign recipients');
      setRecipients(result.data?.recipients ?? []);
      setLimit(result.data?.targeting.maxRecipients);
    }).catch((error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Could not load the recipient preview'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return <div className="space-y-6">
    <PageHeader title={campaignName} eyebrow="CAMPAIGN / RECIPIENT PREVIEW" description="A tenant-scoped preview of the leads this campaign can target." actions={<Button variant="outline" onClick={() => router.push(`/dashboard/campaigns/${id}`)}><ArrowLeft className="mr-2 size-4"/>Back to campaign</Button>} />
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="flex items-center gap-4 p-5"><Users className="size-5 text-[#d6f66d]"/><div><p className="text-2xl font-semibold">{loading ? '—' : recipients.length}</p><p className="text-xs text-muted-foreground">Preview recipients</p></div></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Campaign cap</p><p className="mt-2 text-2xl font-semibold">{limit ?? 'All eligible'}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Delivery mode</p><p className="mt-2 text-sm font-semibold">Demo preview · no messages sent</p></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="text-sm">People in this preview</CardTitle></CardHeader><CardContent className="space-y-2">
      {loading ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full"/>) : recipients.length ? recipients.map((lead) => <div key={lead._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"><div className="grid size-9 place-items-center rounded-full bg-[#26344a] text-xs font-semibold text-[#d6f66d]">{lead.firstName[0]}{lead.lastName?.[0] ?? ''}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{lead.firstName} {lead.lastName}</p><p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Mail className="size-3"/>{lead.email}</p></div><Badge variant="secondary" className="capitalize">{lead.status.replace(/_/g, ' ')}</Badge><Badge variant="outline" className="capitalize">{lead.quality} · {lead.score}</Badge></div>) : <div className="py-12 text-center text-sm text-muted-foreground">No matching leads are available for this preview.</div>}
    </CardContent></Card>
  </div>;
}
