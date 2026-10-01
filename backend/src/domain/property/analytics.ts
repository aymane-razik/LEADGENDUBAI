import type { IProperty } from '../../models';

export interface AreaPriceTrend {
  readonly area: string;
  readonly avgPrice: number;
  readonly count: number;
  readonly medianPrice?: number;
  readonly trend: 'increasing' | 'stable' | 'decreasing';
  readonly priceRange: {
    min: number;
    max: number;
  };
}

export interface PropertyIntel {
  readonly property: IProperty;
  readonly pricePercentile?: number;
  readonly areaAvgPrice?: number;
  readonly marketTrend?: 'increasing' | 'stable' | 'decreasing';
  readonly competitorsCount?: number;
  readonly priceComparison?: number;
  readonly daysOnMarket?: number;
}

export const classifyMarketTrend = (priceHistory: Array<{ price: number; date: Date }>): 'increasing' | 'stable' | 'decreasing' => {
  if (!priceHistory || priceHistory.length < 2) return 'stable';
  const sorted = [...priceHistory].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0].price;
  const last = sorted[sorted.length - 1].price;
  if (first === 0) return 'stable';
  const change = (last - first) / first;
  if (change > 0.05) return 'increasing';
  if (change < -0.05) return 'decreasing';
  return 'stable';
};

export const computeAreaPriceTrends = (
  properties: Array<{ area: string; price: number }>,
): AreaPriceTrend[] => {
  const grouped = new Map<string, number[]>();
  for (const p of properties) {
    const list = grouped.get(p.area) ?? [];
    list.push(p.price);
    grouped.set(p.area, list);
  }

  return Array.from(grouped.entries()).map(([area, prices]) => {
    const sorted = [...prices].sort((a, b) => a - b);
    const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const trend: AreaPriceTrend['trend'] = 'stable';
    return {
      area,
      avgPrice: Math.round(avg),
      count: prices.length,
      medianPrice: Math.round(median),
      trend,
      priceRange: {
        min: Math.round(sorted[0]),
        max: Math.round(sorted[sorted.length - 1]),
      },
    };
  }).sort((a, b) => b.avgPrice - a.avgPrice);
};

export const enrichPropertyIntel = (
  property: IProperty,
  areaAvgPrice?: number,
  competitorsCount?: number,
): PropertyIntel => {
  const trend = classifyMarketTrend(property.priceHistory);
  const priceComparison = areaAvgPrice && areaAvgPrice > 0
    ? Math.round((property.price - areaAvgPrice) / areaAvgPrice * 100)
    : undefined;

  return {
    property,
    marketTrend: trend,
    areaAvgPrice: areaAvgPrice ?? property.avgAreaPrice,
    competitorsCount,
    priceComparison,
    daysOnMarket: property.daysOnMarket,
    pricePercentile: undefined,
  };
};
