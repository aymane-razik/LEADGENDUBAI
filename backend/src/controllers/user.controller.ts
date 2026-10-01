import type { Request, Response } from 'express';
import { User } from '../models';
import { hashPassword, paginatedResponse, successResponse } from '../utils';

export const userController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find({ deletedAt: { $exists: false } })
        .select('-password')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ deletedAt: { $exists: false } }),
    ]);
    paginatedResponse(res, items, page, limit, total, 'Users fetched');
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const item = await User.create({
      ...req.body,
      password: await hashPassword(req.body.password as string),
    });
    successResponse(res, 'User created', item);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const item = await User.findById(req.params.id).select('-password').lean();
    successResponse(res, 'User fetched', item);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const payload = { ...req.body };
    if (payload.password) {
      payload.password = await hashPassword(payload.password as string);
    }
    const item = await User.findByIdAndUpdate(req.params.id, payload, { new: true })
      .select('-password')
      .lean();
    successResponse(res, 'User updated', item);
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    await User.findByIdAndUpdate(req.params.id, { deletedAt: new Date(), isActive: false });
    successResponse(res, 'User deleted');
  },

  activate: async (req: Request, res: Response): Promise<void> => {
    const item = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true },
    ).lean();
    successResponse(res, 'User activated', item);
  },

  deactivate: async (req: Request, res: Response): Promise<void> => {
    const item = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    ).lean();
    successResponse(res, 'User deactivated', item);
  },

  performance: async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id).lean();
    successResponse(res, 'User performance fetched', user?.metrics);
  },

  computeMetrics: async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    const activities = await (await import('../models')).Activity.find({ performedBy: user._id }).lean();
    const leads = await (await import('../models')).Lead.find({ assignedTo: user._id }).lean();
    const snapshot = {
      leadsAssigned: user.metrics.leadsAssigned,
      leadsContacted: user.metrics.leadsContacted,
      leadsQualified: user.metrics.leadsQualified,
      leadsConverted: user.metrics.leadsConverted,
      conversionRate: user.metrics.conversionRate,
      avgResponseTime: user.metrics.avgResponseTime,
      avgDealValue: user.metrics.avgDealValue,
      totalRevenue: user.metrics.totalRevenue,
      activitiesLogged: user.metrics.activitiesLogged,
    };
    successResponse(res, 'User metrics computed', snapshot);
  },

  agents: async (_req: Request, res: Response): Promise<void> => {
    const items = await User.find({ role: 'agent', isActive: true }).select('-password').lean();
    successResponse(res, 'Agents fetched', items);
  },
};
