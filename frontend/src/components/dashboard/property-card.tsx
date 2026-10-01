'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PropertyListItem } from '@/types';
import { demoPropertyImage } from '@/lib/demo-api';
import { ArrowUpRight, Bath, Bed, Eye, MapPin, Maximize2, MessageSquare, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

interface PropertyCardProps { property: PropertyListItem; onView?: (id: string) => void; onSimilar?: (id: string) => void; }

export function PropertyCard({ property, onView, onSimilar }: PropertyCardProps) {
  const image = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? demoPropertyImage(property.id) : property.images?.[0];
  const price = property.price >= 1_000_000 ? `AED ${(property.price / 1_000_000).toFixed(2)}m` : `AED ${Math.round(property.price / 1000)}k`;
  const market = property.marketTrend === 'increasing' ? 'text-[#74dfb2]' : property.marketTrend === 'decreasing' ? 'text-[#ff9b93]' : 'text-slate-400';
  return (
    <Card className="group overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.15]">
      <button onClick={() => onView?.(property.id)} className="relative block aspect-[1.75/1] w-full overflow-hidden bg-[#182337] text-left">
        {image ? <img src={image} alt={property.title} className="size-full object-cover opacity-75 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-90"/> : <div className="grid size-full place-items-center text-slate-600"><Maximize2 className="size-9"/></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08101c] via-[#08101c]/10 to-black/10"/>
        <div className="absolute left-3 top-3 flex gap-1.5">{property.isFeatured && <span className="rounded-full border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[8px] font-semibold text-white backdrop-blur">Featured</span>}{property.isPremium && <span className="flex items-center gap-1 rounded-full border border-[#d6f66d]/20 bg-[#d6f66d]/15 px-2 py-1 text-[8px] font-semibold text-[#e3ff9b] backdrop-blur"><Sparkles className="size-2.5"/>Private</span>}</div>
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-[#0b1220]/70 p-1.5 text-white/70 backdrop-blur"><ArrowUpRight className="size-3.5"/></div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2"><div><p className="text-[8px] font-semibold uppercase tracking-[.15em] text-white/55">{property.purpose} · {property.type}</p><p className="mt-1 text-[20px] font-semibold tracking-[-.04em] text-white">{price}</p></div><div className="flex items-center gap-2 text-[8px] text-white/70"><span className="flex items-center gap-1 rounded-lg bg-black/35 px-2 py-1 backdrop-blur"><Eye className="size-3"/>{property.views}</span><span className="flex items-center gap-1 rounded-lg bg-black/35 px-2 py-1 backdrop-blur"><MessageSquare className="size-3"/>{property.inquiries}</span></div></div>
      </button>
      <CardContent className="space-y-3 p-3.5 sm:p-4">
        <div className="min-w-0"><h3 className="truncate text-[11px] font-semibold text-slate-100">{property.title}</h3><p className="mt-1 flex items-center gap-1 text-[9px] text-slate-500"><MapPin className="size-3 shrink-0 text-[#79d8ef]"/><span className="truncate">{property.location.area}, {property.location.city}</span><span className="ml-auto flex shrink-0 items-center gap-1 capitalize"><span className={cn('size-1 rounded-full bg-current', market)}/>{property.marketTrend}</span></p></div>
        <div className="flex items-center gap-3 border-t border-white/[0.06] pt-3 text-[9px] text-slate-400"><span className="flex items-center gap-1"><Bed className="size-3.5 text-slate-500"/>{property.bedrooms}</span><span className="flex items-center gap-1"><Bath className="size-3.5 text-slate-500"/>{property.bathrooms}</span><span className="flex items-center gap-1"><Maximize2 className="size-3 text-slate-500"/>{property.size.toLocaleString()} sqft</span><span className="ml-auto flex items-center gap-1 font-medium text-slate-300">{property.priceComparison !== undefined ? (property.priceComparison > 0 ? <TrendingUp className="size-3 text-[#74dfb2]"/> : property.priceComparison < 0 ? <TrendingDown className="size-3 text-[#ff9b93]"/> : null) : null}{property.priceComparison !== undefined ? `${property.priceComparison > 0 ? '+' : ''}${property.priceComparison}%` : 'Market'}</span></div>
        <div className="flex items-center justify-between"><span className="text-[8px] uppercase tracking-[.12em] text-slate-600">{property.source} · verified feed</span><button onClick={() => onSimilar?.(property.id)} className="text-[9px] font-semibold text-[#d6f66d] transition hover:text-white">Find similar ↗</button></div>
      </CardContent>
    </Card>
  );
}
