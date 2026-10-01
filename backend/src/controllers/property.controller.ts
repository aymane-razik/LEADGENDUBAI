import type { Request, Response } from 'express';
import type { PipelineStage } from 'mongoose';
import { Property } from '../models';
import { propertyService } from '../services';
import { DUBAI_AREAS, paginatedResponse, successResponse } from '../utils';

const parsePagination = (req: Request): { page: number; limit: number } => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  return { page: Math.max(page, 1), limit: Math.min(Math.max(limit, 1), 100) };
};

export const propertyController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = parsePagination(req);
    const filters: Record<string, unknown> = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.purpose) filters.purpose = req.query.purpose;

    const { items, total } = await propertyService.list({ page, limit, filters });
    paginatedResponse(res, items, page, limit, total, 'Properties fetched');
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const item = await propertyService.create(req.body);
    successResponse(res, 'Property created', item);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await propertyService.getById(id);
    successResponse(res, 'Property fetched', item);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await propertyService.update(id, req.body);
    successResponse(res, 'Property updated', item);
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await propertyService.remove(id);
    successResponse(res, 'Property deleted');
  },

  search: async (req: Request, res: Response): Promise<void> => {
    const filters: Record<string, unknown> = {};
    if (req.query.minPrice || req.query.maxPrice) {
      filters.price = {
        ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}),
        ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {}),
      };
    }
    if (req.query.area) filters['location.area'] = req.query.area;
    const items = await propertyService.search(filters);
    successResponse(res, 'Search completed', items);
  },

  nearby: async (req: Request, res: Response): Promise<void> => {
    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    const maxDistance = Number(req.query.maxDistance ?? 5000);
    const items = await propertyService.nearby(lng, lat, maxDistance);
    successResponse(res, 'Nearby properties fetched', items);
  },

  similar: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const current = await propertyService.getById(id);
    const items = await Property.find({
      _id: { $ne: current._id },
      type: current.type,
      purpose: current.purpose,
      price: { $gte: current.price * 0.8, $lte: current.price * 1.2 },
      'location.area': current.location.area,
    })
      .limit(20)
      .lean();
    successResponse(res, 'Similar properties fetched', items);
  },

  stats: async (_req: Request, res: Response): Promise<void> => {
    const stats = await propertyService.stats();
    successResponse(res, 'Property stats fetched', stats);
  },

  trending: async (_req: Request, res: Response): Promise<void> => {
    const items = await Property.find({ isActive: true })
      .sort({ inquiries: -1, views: -1 })
      .limit(20)
      .lean();
    successResponse(res, 'Trending properties fetched', items);
  },

  areas: async (_req: Request, res: Response): Promise<void> => {
    successResponse(res, 'Dubai areas fetched', DUBAI_AREAS);
  },

  priceTrends: async (_req: Request, res: Response): Promise<void> => {
    const pipeline: PipelineStage[] = [
      { $match: { isActive: true } },
      { $group: { _id: '$location.area', avgPrice: { $avg: '$price' }, count: { $sum: 1 } } },
      { $sort: { avgPrice: -1 } },
    ];
    const trends = await Property.aggregate(pipeline);
    successResponse(res, 'Price trends fetched', trends);
  },
};
