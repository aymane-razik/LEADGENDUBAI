'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, getApiErrorMessage, toList } from '@/lib/api';
import { demoPropertyImage } from '@/lib/demo-api';
import { PageHeader } from '@/components/organisms/page-header';
import { PropertyCard } from '@/components/dashboard/property-card';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PropertyListItem, PropertyType, PropertyPurpose, PropertySource } from '@/types';
import { Plus, Search, Filter, RefreshCw, Grid3X3, List, ChevronLeft, ChevronRight, Maximize2, Building2, MapPin, Bed, Bath, DollarSign } from 'lucide-react';

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<PropertyType | ''>('');
  const [purpose, setPurpose] = useState<PropertyPurpose | ''>('');
  const [source, setSource] = useState<PropertySource | ''>('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit, page };
      if (search) params.search = search;
      if (type) params.type = type;
      if (purpose) params.purpose = purpose;
      if (source) params.source = source;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const res = await apiGet<unknown>('/properties', params);
      const { items, total } = toList<PropertyListItem>(res);
      setProperties(items);
      setTotal(total);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load properties'));
    } finally {
      setLoading(false);
    }
  }, [search, type, purpose, source, minPrice, maxPrice, page, limit]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Dubai real estate listings with market intelligence."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchProperties} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <div className="flex rounded-md border border-border bg-background p-0.5">
              <Button variant={view === 'grid' ? 'default' : 'ghost'} size="sm" className="h-8 w-8" onClick={() => setView('grid')}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" className="h-8 w-8" onClick={() => setView('table')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Search properties..."
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
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Input type="number" placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-24 h-8 text-xs" />
              <span className="text-muted-foreground">–</span>
              <Input type="number" placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24 h-8 text-xs" />
            </div>
            <Select value={type} onValueChange={(v) => setType(v as PropertyType || '')}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as PropertyPurpose || '')}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Purpose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={(v) => setSource(v as PropertySource || '')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bayut">Bayut</SelectItem>
                <SelectItem value="propertyfinder">Property Finder</SelectItem>
                <SelectItem value="dubizzle">Dubizzle</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            {(type || purpose || source || minPrice || maxPrice) && (
              <Button variant="ghost" size="sm" onClick={() => { setType(''); setPurpose(''); setSource(''); setMinPrice(''); setMaxPrice(''); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Properties */}
      {view === 'grid' ? (
        <Card className="p-0 overflow-hidden">
          <div className="p-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No properties found.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} onView={(id) => router.push(`/dashboard/properties/${id}`)} />
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Price/sqft</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Baths</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Listed</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                    </TableRow>
                  ))
                ) : properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">No properties found</TableCell>
                  </TableRow>
                ) : (
                  properties.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                            {p.images.length > 0 || process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? <img src={process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? demoPropertyImage(p.id) : p.images[0]} alt={p.title} className="h-full w-full object-cover" /> : <Maximize2 className="h-4 w-4 mx-auto text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.source}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-2xs capitalize">{p.type}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-2xs capitalize">{p.purpose}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{p.location.area}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {p.currency === 'USD' ? '$' : 'AED '}
                          {p.price >= 1_000_000 ? `${(p.price / 1_000_000).toFixed(2)}M` : `${Math.round(p.price / 1000)}K`}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{p.currency === 'USD' ? '$' : ''}{p.pricePerSqft}</span></TableCell>
                      <TableCell><span className="text-xs"><Bed className="h-3 w-3 inline mr-1" />{p.bedrooms}</span></TableCell>
                      <TableCell><span className="text-xs"><Bath className="h-3 w-3 inline mr-1" />{p.bathrooms}</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{p.size.toLocaleString()} sqft</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{new Date(p.listedDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}</span></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => router.push(`/dashboard/properties/${p.id}`)}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} properties
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
    </div>
  );
}
