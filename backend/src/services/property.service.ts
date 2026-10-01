import type { FilterQuery } from 'mongoose';
import { Property, type IProperty } from '../models';
import { NotFoundError } from '../utils';

interface ListPropertiesOptions {
  page: number;
  limit: number;
  filters: FilterQuery<IProperty>;
}

export const propertyService = {
  async list(options: ListPropertiesOptions): Promise<{ items: IProperty[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [items, total] = await Promise.all([
      Property.find(options.filters).skip(skip).limit(options.limit).sort('-createdAt').lean(),
      Property.countDocuments(options.filters),
    ]);

    return { items: items as unknown as IProperty[], total };
  },

  async create(payload: Partial<IProperty>): Promise<IProperty> {
    return Property.create(payload);
  },

  async getById(id: string): Promise<IProperty> {
    const item = await Property.findById(id);
    if (!item) throw new NotFoundError('Property not found');
    return item;
  },

  async update(id: string, payload: Partial<IProperty>): Promise<IProperty> {
    const item = await this.getById(id);
    Object.assign(item, payload, { lastUpdated: new Date() });
    return item.save();
  },

  async remove(id: string): Promise<void> {
    const item = await this.getById(id);
    item.isActive = false;
    await item.save();
  },

  async search(filters: FilterQuery<IProperty>): Promise<IProperty[]> {
    return Property.find(filters).sort('-createdAt').limit(100).lean() as unknown as IProperty[];
  },

  async nearby(longitude: number, latitude: number, maxDistance = 5000): Promise<IProperty[]> {
    return Property.find({
      'location.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: maxDistance,
        },
      },
      isActive: true,
    }).limit(100);
  },

  async stats(): Promise<Record<string, number>> {
    const [total, active, featured] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ isActive: true }),
      Property.countDocuments({ isFeatured: true, isActive: true }),
    ]);
    return { total, active, featured };
  },
};
