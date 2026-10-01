import type { Request, Response } from 'express';
import { activityService } from '../services';
import { paginatedResponse, successResponse } from '../utils';

export const activityController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const { items, total } = await activityService.list(page, limit);
    paginatedResponse(res, items, page, limit, total, 'Activities fetched');
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const item = await activityService.create({ ...req.body, performedBy: req.user?.userId });
    successResponse(res, 'Activity created', item);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await activityService.getById(id);
    successResponse(res, 'Activity fetched', item);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await activityService.update(id, req.body);
    successResponse(res, 'Activity updated', item);
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await activityService.remove(id);
    successResponse(res, 'Activity deleted');
  },

  complete: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await activityService.complete(id);
    successResponse(res, 'Activity marked complete', item);
  },

  upcoming: async (_req: Request, res: Response): Promise<void> => {
    const items = await activityService.upcoming();
    successResponse(res, 'Upcoming activities fetched', items);
  },

  overdue: async (_req: Request, res: Response): Promise<void> => {
    const items = await activityService.overdue();
    successResponse(res, 'Overdue activities fetched', items);
  },
};
