'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPost, apiPut, getApiErrorMessage, toList } from '@/lib/api';
import { demoPropertyImage } from '@/lib/demo-api';
import { PageHeader } from '@/components/organisms/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PropertyListItem } from '@/types';
import {
  MapPin, Bed, Bath, Maximize2, Calendar, Clock, Eye, MessageSquare, Star, Edit2,
  RefreshCw, ChevronLeft, ChevronRight, TrendingUp, Minus, TrendingDown, ExternalLink, Share2, Heart
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [property, setProperty] = useState<PropertyListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [leads, setLeads] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [leadId, setLeadId] = useState('');
  const [viewingAt, setViewingAt] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  const fetchProperty = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: PropertyListItem }>(`/properties/${id}`);
      setProperty(res.data ?? null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load property'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProperty(); }, [id]);
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('dune:saved-properties') ?? '[]') as string[];
    setSaved(ids.includes(id));
  }, [id]);

  const handleRefresh = () => { setRefreshing(true); fetchProperty(); };

  const copyValue = (value: string) => {
    navigator.clipboard?.writeText(value);
    toast.success('Copied');
  };

  const shareProperty = async () => {
    const url = `${window.location.origin}/dashboard/properties/${id}`;
    try { await navigator.clipboard.writeText(url); toast.success('Workspace link copied'); }
    catch { toast.error('Could not copy the property link'); }
  };

  const toggleSaved = () => {
    const ids = new Set(JSON.parse(localStorage.getItem('dune:saved-properties') ?? '[]') as string[]);
    saved ? ids.delete(id) : ids.add(id);
    localStorage.setItem('dune:saved-properties', JSON.stringify([...ids]));
    setSaved(!saved);
    toast.success(saved ? 'Removed from saved properties' : 'Property saved to this browser');
  };

  const openViewing = async () => {
    setViewingOpen(true);
    if (leads.length) return;
    try {
      const response = await apiGet<unknown>('/leads?limit=100');
      setLeads(toList<{ id: string; firstName: string; lastName: string }>(response).items);
    } catch (error) { toast.error(getApiErrorMessage(error, 'Could not load leads')); }
  };

  const scheduleViewing = async () => {
    if (!leadId || !viewingAt) return;
    setSavingAction(true);
    try {
      const result = await apiPost<{ message?: string }>('/activities', {
        leadId, type: 'viewing', direction: 'outbound', channel: 'in_person',
        subject: `Property viewing: ${property?.title}`, content: `Viewing scheduled for ${property?.title}`,
        relatedTo: id, metadata: { propertyIds: [id] }, scheduledAt: new Date(viewingAt).toISOString(),
      });
      toast.success(result.message ?? 'Property viewing scheduled');
      setViewingOpen(false);
    } catch (error) { toast.error(getApiErrorMessage(error, 'Could not schedule viewing')); }
    finally { setSavingAction(false); }
  };

  const saveListing = async () => {
    const price = Number(editPrice);
    if (!editTitle.trim() || !Number.isFinite(price) || price <= 0 || !property) return;
    setSavingAction(true);
    try {
      const result = await apiPut<{ message?: string; data?: PropertyListItem }>(`/properties/${id}`, {
        title: editTitle.trim(), price, pricePerSqft: Math.round(price / property.size),
      });
      if (result.data) setProperty(result.data);
      else await fetchProperty();
      toast.success(result.message ?? 'Listing updated');
      setEditOpen(false);
    } catch (error) { toast.error(getApiErrorMessage(error, 'Could not update listing')); }
    finally { setSavingAction(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-medium">Property not found</h2>
        <p className="text-sm text-muted-foreground mt-1">This property may have been removed.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/properties')}>Back to properties</Button>
      </div>
    );
  }

  const heroImage = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? demoPropertyImage(property.id) : property.images[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.title}
        description={`${property.source} • ${property.purpose} • ${property.type} • ${property.location.area}, ${property.location.city}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} /> Refresh
            </Button>
            {property.url && (
              <a href={property.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> Source
              </a>
            )}
            <Button variant="outline" size="sm" onClick={shareProperty}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={toggleSaved}>
              <Heart className={cn('h-4 w-4 mr-2', saved && 'fill-current text-rose-500')} /> {saved ? 'Saved' : 'Save'}
            </Button>
            <Button size="sm" onClick={openViewing}>
              <Calendar className="h-4 w-4 mr-2" /> Schedule Viewing
            </Button>
          </div>
        }
      />

      {/* Hero image */}
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
        {heroImage ? (
          <img src={heroImage} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Maximize2 className="h-16 w-16 opacity-40" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1">
          {property.isFeatured && <Badge className="bg-white/90 text-foreground shadow">Featured</Badge>}
          {property.isPremium && <Badge className="bg-amber-400 text-[#1a1a1a] shadow">Premium</Badge>}
          {property.isVerified && <Badge className="bg-emerald-500 text-white shadow">Verified</Badge>}
          {property.isOwner && <Badge variant="destructive" className="text-2xs">Owner</Badge>}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <span className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Eye className="h-3 w-3" /> {property.views}
          </span>
          <span className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {property.inquiries}
          </span>
          {property.favorites > 0 && (
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Heart className="h-3 w-3" /> {property.favorites}
            </span>
          )}
        </div>
      </div>

      {/* Price + quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-900/10 dark:to-sky-900/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Asking Price</span>
              <Badge variant="secondary" className="text-2xs capitalize">{property.currency}</Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {property.currency === 'USD' ? '$' : 'AED '}
                {property.price >= 1_000_000 ? `${(property.price / 1_000_000).toFixed(2)}M` : `${Math.round(property.price / 1000)}K`}
              </span>
              <span className="text-muted-foreground">/{property.currency === 'USD' ? 'sqft' : 'sqft'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Price per sqft</p>
                <p className="text-lg font-medium">{property.currency === 'USD' ? '$' : ''}{property.pricePerSqft}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Market trend</p>
                <Badge className={cn(
                  property.marketTrend === 'increasing' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                  property.marketTrend === 'decreasing' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
                )}>{property.marketTrend}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Days on market</p>
                <p className="text-lg font-medium">{property.daysOnMarket} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-base font-medium">{property.location.area}</p>
            {property.location.subArea && <p className="text-sm text-muted-foreground">{property.location.subArea}</p>}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Bed className="h-3 w-3" /> {property.location.city}, {property.location.country}
            </p>
            <div className="flex gap-1 pt-1">
              {property.location.coordinates && (
                <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => {
                  const [lng, lat] = property.location.coordinates.coordinates;
                  window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
                }}>
                  <MapPin className="h-3 w-3 mr-1" /> View on map
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Specs */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Property Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Bed className="h-4 w-4 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Bedrooms</p><p className="text-sm font-medium">{property.bedrooms}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Bath className="h-4 w-4 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Bathrooms</p><p className="text-sm font-medium">{property.bathrooms}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Maximize2 className="h-4 w-4 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Size</p><p className="text-sm font-medium">{property.size.toLocaleString()} sqft</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Calendar className="h-4 w-4 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Listed</p><p className="text-sm">{new Date(property.listedDate).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Clock className="h-4 w-4 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Last updated</p><p className="text-sm">{new Date(property.lastUpdated).toLocaleDateString('en-IE')}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Star className="h-4 w-4 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Completion</p><p className="text-sm capitalize">{property.completionStatus ?? '—'}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{property.description}</p>
            </CardContent>
          </Card>

          {property.priceHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Price History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {property.priceHistory.slice(-10).reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{new Date(h.date).toLocaleDateString('en-IE')}</span>
                      <span className={cn(
                        h.changePercent > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                        h.changePercent < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-muted-foreground',
                      )}>
                        {h.changePercent > 0 ? '+' : ''}{h.changePercent.toFixed(1)}%
                      </span>
                      <span className="font-medium">AED {h.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {property.amenities.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Amenities</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <Badge key={a} variant="secondary">{a}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Agent Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {property.agentName && <div><p className="text-xs text-muted-foreground">Agent</p><p className="text-sm font-medium">{property.agentName}</p></div>}
              {property.agency && <div><p className="text-xs text-muted-foreground">Agency</p><p className="text-sm">{property.agency}</p></div>}
              {property.agentPhone && (
                <a href={`tel:${property.agentPhone}`} className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1">
                  <PhoneIcon className="h-3.5 w-3.5" /> {property.agentPhone}
                </a>
              )}
              {property.agentEmail && (
                <a href={`mailto:${property.agentEmail}`} className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1">
                  <MailIcon className="h-3.5 w-3.5" /> {property.agentEmail}
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Market Intelligence</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {property.avgAreaPrice != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Avg area price</p>
                  <p className="font-medium">AED {property.avgAreaPrice.toLocaleString()}</p>
                </div>
              )}
              {property.competitorCount != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Competitor listings</p>
                  <p className="font-medium">{property.competitorCount}</p>
                </div>
              )}
              {property.priceComparison != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Price vs area avg</p>
                  <p className={cn(
                    property.priceComparison! > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                    property.priceComparison! < 0 ? 'text-red-600 dark:text-red-400' :
                    'text-muted-foreground',
                  )}>
                    {property.priceComparison > 0 ? '+' : ''}{property.priceComparison?.toFixed(1)}%
                  </p>
                </div>
              )}
              {property.permitNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">Permit number</p>
                  <p className="font-medium font-mono text-xs">{property.permitNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {property.scrapingErrors && property.scrapingErrors.length > 0 && (
            <Card className="border-l-4 border-l-rose-400 dark:border-l-rose-600">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">Scraping Errors</CardTitle></CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  {property.scrapingErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={shareProperty}><Share2 className="h-4 w-4 mr-2" /> Share property</Button>
              <Button variant="outline" className="w-full justify-start" onClick={openViewing}><Calendar className="h-4 w-4 mr-2" /> Schedule viewing</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => property.agentEmail ? window.location.assign(`mailto:${property.agentEmail}?subject=${encodeURIComponent(`Inquiry: ${property.title}`)}`) : toast.info('No agent email is listed for this property')}><MessageSquare className="h-4 w-4 mr-2" /> Send inquiry</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => { setEditTitle(property.title); setEditPrice(String(property.price)); setEditOpen(true); }}><Edit2 className="h-4 w-4 mr-2" /> Edit listing</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={viewingOpen} onOpenChange={setViewingOpen}>
        <DialogContent><DialogHeader><DialogTitle>Schedule a property viewing</DialogTitle><DialogDescription>Choose the lead and time. The appointment will be added to the activity timeline.</DialogDescription></DialogHeader>
          <div className="space-y-4"><div className="space-y-2"><Label htmlFor="viewing-lead">Lead</Label><select id="viewing-lead" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={leadId} onChange={(event) => setLeadId(event.target.value)}><option value="">Choose a lead…</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.firstName} {lead.lastName}</option>)}</select></div><div className="space-y-2"><Label htmlFor="viewing-at">Date and time</Label><Input id="viewing-at" type="datetime-local" value={viewingAt} onChange={(event) => setViewingAt(event.target.value)} min={new Date().toISOString().slice(0, 16)} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setViewingOpen(false)}>Cancel</Button><Button onClick={scheduleViewing} disabled={savingAction || !leadId || !viewingAt}>{savingAction ? 'Scheduling…' : 'Schedule viewing'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit listing</DialogTitle><DialogDescription>Update the display title and asking price for this property.</DialogDescription></DialogHeader>
          <div className="space-y-4"><div className="space-y-2"><Label htmlFor="listing-title">Title</Label><Input id="listing-title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="listing-price">Asking price (AED)</Label><Input id="listing-price" type="number" min="1" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveListing} disabled={savingAction}>{savingAction ? 'Saving…' : 'Save listing'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>;
}

function MailIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" /></svg>;
}
