import { Activity, type IActivity } from '../models';
import { NotFoundError } from '../utils';

export const activityService = {
  async list(page: number, limit: number): Promise<{ items: IActivity[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Activity.find().sort('-createdAt').skip(skip).limit(limit).lean(),
      Activity.countDocuments(),
    ]);
    return { items: items as unknown as IActivity[], total };
  },

  async create(payload: Partial<IActivity>): Promise<IActivity> {
    return Activity.create(payload);
  },

  async getById(id: string): Promise<IActivity> {
    const item = await Activity.findById(id);
    if (!item) throw new NotFoundError('Activity not found');
    return item;
  },

  async update(id: string, payload: Partial<IActivity>): Promise<IActivity> {
    const item = await this.getById(id);
    Object.assign(item, payload);
    return item.save();
  },

  async remove(id: string): Promise<void> {
    const item = await this.getById(id);
    await item.deleteOne();
  },

  async complete(id: string): Promise<IActivity> {
    const item = await this.getById(id);
    item.isCompleted = true;
    item.completedAt = new Date();
    return item.save();
  },

  async upcoming(): Promise<IActivity[]> {
    return Activity.find({ isCompleted: false, scheduledAt: { $gte: new Date() } }).sort(
      'scheduledAt',
    );
  },

  async overdue(): Promise<IActivity[]> {
    return Activity.find({ isCompleted: false, scheduledAt: { $lt: new Date() } }).sort(
      'scheduledAt',
    );
  },
};
