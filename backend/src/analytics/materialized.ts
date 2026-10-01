import { cacheService } from '../services/cache.service';
import { Lead, Property, Campaign, Activity, User } from '../models';
import { logger } from '../utils';
import { currentTenant, runWithTenant, scopedCacheKey } from '../tenants/storage';

interface LeadStats {
  total: number;
  active: number;
  hot: number;
  qualified: number;
  converted: number;
  byQuality: Record<string, number>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byAssignment: Record<string, number>;
}

interface PropertyStats {
  total: number;
  active: number;
  featured: number;
  byType: Record<string, number>;
  byPurpose: Record<string, number>;
  byArea: Record<string, number>;
  totalListingsValue: number;
}

interface CampaignStats {
  total: number;
  active: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalSent: number;
  totalDelivered: number;
  totalOpen: number;
  totalClicked: number;
  totalConverted: number;
  totalRevenue: number;
}

interface DashboardStats {
  leads: LeadStats;
  properties: PropertyStats;
  campaigns: CampaignStats;
}

const KEY = 'analytics:dashboard:stats';
const TTL = 120;

async function computeLeadStats(): Promise<LeadStats> {
  const pipelines = await Promise.all([
    Lead.countDocuments().then((n) => n),
    Lead.countDocuments({ isActive: true }).then((n) => n),
    Lead.countDocuments({ quality: 'hot', isActive: true }).then((n) => n),
    Lead.countDocuments({ isQualified: true, isActive: true }).then((n) => n),
    Lead.countDocuments({ status: 'deal_closed', isActive: true }).then((n) => n),
  ]);

  const byQuality = await Lead.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$quality', count: { $sum: 1 } } },
    { $project: { _id: 0, quality: '$_id', count: 1 } },
  ]);
  const byStatus = await Lead.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);
  const bySource = await Lead.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $project: { _id: 0, source: '$_id', count: 1 } },
  ]);
  const byAssignment = await Lead.aggregate([
    { $match: { isActive: true, assignedTo: { $exists: true } } },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    { $project: { _id: 0, assignedTo: '$_id', count: 1 } },
  ]);

  const map = <T extends { [k: string]: unknown }>(arr: T[], key: string, val: string) =>
    arr.reduce((acc, item) => {
      acc[String(item[key])] = Number(item[val]);
      return acc;
    }, {} as Record<string, number>);

  return {
    total: pipelines[0],
    active: pipelines[1],
    hot: pipelines[2],
    qualified: pipelines[3],
    converted: pipelines[4],
    byQuality: map(byQuality, 'quality', 'count'),
    byStatus: map(byStatus, 'status', 'count'),
    bySource: map(bySource, 'source', 'count'),
    byAssignment: map(byAssignment, 'assignedTo', 'count'),
  };
}

async function computePropertyStats(): Promise<PropertyStats> {
  const [total, active, featured] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments({ isActive: true }),
    Property.countDocuments({ isFeatured: true, isActive: true }),
  ]);

  const byType = await Property.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
  ]);
  const byPurpose = await Property.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$purpose', count: { $sum: 1 } } },
    { $project: { _id: 0, purpose: '$_id', count: 1 } },
  ]);
  const byArea = await Property.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$location.area', count: { $sum: 1 } } },
    { $project: { _id: 0, area: '$_id', count: 1 } },
  ]);
  const totalValue = await Property.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, total: { $sum: '$price' } } },
  ]);

  const map = <T extends { [k: string]: unknown }>(arr: T[], key: string, val: string) =>
    arr.reduce((acc, item) => {
      acc[String(item[key])] = Number(item[val]);
      return acc;
    }, {} as Record<string, number>);

  return {
    total,
    active,
    featured,
    byType: map(byType, 'type', 'count'),
    byPurpose: map(byPurpose, 'purpose', 'count'),
    byArea: map(byArea, 'area', 'count'),
    totalListingsValue: totalValue.length ? Number(totalValue[0].total) : 0,
  };
}

async function computeCampaignStats(): Promise<CampaignStats> {
  const [total, active] = await Promise.all([
    Campaign.countDocuments(),
    Campaign.countDocuments({ status: 'active' }),
  ]);

  const byType = await Campaign.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
  ]);
  const byStatus = await Campaign.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);

  const m = await Campaign.aggregate([
    { $group: {
      _id: null,
      sent: { $sum: '$metrics.sent' },
      delivered: { $sum: '$metrics.delivered' },
      opened: { $sum: '$metrics.opened' },
      clicked: { $sum: '$metrics.clicked' },
      converted: { $sum: '$metrics.converted' },
      revenue: { $sum: '$metrics.revenue' },
    } },
  ]);

  const map = <T extends { [k: string]: unknown }>(arr: T[], key: string, val: string) =>
    arr.reduce((acc, item) => {
      acc[String(item[key])] = Number(item[val]);
      return acc;
    }, {} as Record<string, number>);

  return {
    total,
    active,
    byType: map(byType, 'type', 'count'),
    byStatus: map(byStatus, 'status', 'count'),
    totalSent: Number(m[0]?.sent ?? 0),
    totalDelivered: Number(m[0]?.delivered ?? 0),
    totalOpen: Number(m[0]?.opened ?? 0),
    totalClicked: Number(m[0]?.clicked ?? 0),
    totalConverted: Number(m[0]?.converted ?? 0),
    totalRevenue: Number(m[0]?.revenue ?? 0),
  };
}

export const analyticsMaterialized = {
  async refresh(tenantId = 'default'): Promise<DashboardStats> {
    return runWithTenant({ tenantId }, async () => {
      const [leads, properties, campaigns] = await Promise.all([
        computeLeadStats(),
        computePropertyStats(),
        computeCampaignStats(),
      ]);

      const payload: DashboardStats = { leads, properties, campaigns };
      await cacheService.set(scopedCacheKey(KEY, tenantId), payload, TTL).catch(() => {});
      return payload;
    });
  },

  async get(tenantId = currentTenant().tenantId): Promise<DashboardStats> {
    const cached = await cacheService.get<DashboardStats>(scopedCacheKey(KEY, tenantId));
    if (cached) return cached;
    return this.refresh(tenantId);
  },

  async invalidate(tenantId = currentTenant().tenantId): Promise<void> {
    await cacheService.del(scopedCacheKey(KEY, tenantId)).catch(() => {});
    logger.info('Dashboard stats cache invalidated');
  },
};
