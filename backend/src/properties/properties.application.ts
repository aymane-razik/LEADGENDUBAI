import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types, type PipelineStage } from 'mongoose';
import { Property, type IProperty } from '../models';
import { propertyService } from '../services/property.service';
import { DUBAI_AREAS, NotFoundError } from '../utils';
import { createPropertySchema, updatePropertySchema } from '../validators/property.validator';

@Injectable()
export class PropertiesApplication {
  async list(input: { page: number; limit: number; type?: string; purpose?: string }) {
    const filters: Record<string, unknown> = { isActive: true };
    if (input.type) filters.type = input.type;
    if (input.purpose) filters.purpose = input.purpose;
    const { items, total } = await propertyService.list({
      page: input.page,
      limit: input.limit,
      filters,
    });
    return { items, total, page: input.page, limit: input.limit };
  }

  async create(input: unknown): Promise<IProperty> {
    const { error, value } = createPropertySchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      throw new BadRequestException({
        message: 'Property validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }
    return propertyService.create(value as Partial<IProperty>);
  }

  async getById(id: string): Promise<IProperty> {
    this.ensureId(id);
    try {
      return await propertyService.getById(id);
    } catch (error) {
      this.translateNotFound(error);
    }
  }

  async update(id: string, input: unknown): Promise<IProperty> {
    this.ensureId(id);
    const { error, value } = updatePropertySchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      throw new BadRequestException({
        message: 'Property validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }
    if (Object.keys(value).length === 0) throw new BadRequestException('At least one property field is required');
    try {
      return await propertyService.update(id, value as Partial<IProperty>);
    } catch (error) {
      this.translateNotFound(error);
    }
  }

  async remove(id: string): Promise<{ success: true }> {
    this.ensureId(id);
    try {
      await propertyService.remove(id);
      return { success: true };
    } catch (error) {
      this.translateNotFound(error);
    }
  }

  search(input: { minPrice?: number; maxPrice?: number; area?: string }) {
    if (input.minPrice !== undefined && input.maxPrice !== undefined && input.minPrice > input.maxPrice) {
      throw new BadRequestException('minPrice cannot exceed maxPrice');
    }
    const filters: Record<string, unknown> = { isActive: true };
    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      filters.price = {
        ...(input.minPrice !== undefined ? { $gte: input.minPrice } : {}),
        ...(input.maxPrice !== undefined ? { $lte: input.maxPrice } : {}),
      };
    }
    if (input.area) filters['location.area'] = input.area;
    return propertyService.search(filters);
  }

  nearby(input: { longitude: number; latitude: number; maxDistance: number }) {
    if (input.longitude < -180 || input.longitude > 180 || input.latitude < -90 || input.latitude > 90) {
      throw new BadRequestException('Coordinates are outside the valid longitude/latitude range');
    }
    if (input.maxDistance < 1 || input.maxDistance > 100_000) {
      throw new BadRequestException('maxDistance must be between 1 and 100000 meters');
    }
    return propertyService.nearby(input.longitude, input.latitude, input.maxDistance);
  }

  stats() {
    return propertyService.stats();
  }

  trending() {
    return Property.find({ isActive: true }).sort({ inquiries: -1, views: -1, _id: 1 }).limit(20).lean();
  }

  async similar(id: string) {
    const current = await this.getById(id);
    return Property.find({
      _id: { $ne: current._id },
      type: current.type,
      purpose: current.purpose,
      price: { $gte: current.price * 0.8, $lte: current.price * 1.2 },
      'location.area': current.location.area,
      isActive: true,
    }).sort({ _id: 1 }).limit(20).lean();
  }

  priceTrends() {
    const pipeline: PipelineStage[] = [
      { $match: { isActive: true } },
      { $group: { _id: '$location.area', avgPrice: { $avg: '$price' }, count: { $sum: 1 } } },
      { $sort: { avgPrice: -1 } },
    ];
    return Property.aggregate(pipeline);
  }

  areas() {
    return DUBAI_AREAS;
  }

  private ensureId(id: string): void {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Property id must be a valid identifier');
  }

  private translateNotFound(error: unknown): never {
    if (error instanceof NotFoundError) throw new NotFoundException(error.message);
    throw error;
  }
}
