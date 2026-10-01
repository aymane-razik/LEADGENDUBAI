import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { FilterQuery } from 'mongoose';
import { Lead, type ILead } from '../models';
import { createLeadSchema } from '../validators/lead.validator';
import { leadService } from '../services/lead.service';

const allowedStatuses = new Set([
  'new', 'contacted', 'qualified', 'meeting_scheduled', 'viewing_done',
  'negotiating', 'deal_closed', 'lost', 'nurturing',
]);

@Injectable()
export class LeadsApplication {
  async create(input: unknown, context: { tenantId: string; actorId?: string }): Promise<ILead> {
    const validated = createLeadSchema.validate(input, { abortEarly: false, stripUnknown: true });
    if (validated.error) {
      throw new BadRequestException({
        message: 'Lead validation failed',
        details: validated.error.details.map((detail) => detail.message),
      });
    }
    return leadService.create(validated.value as Partial<ILead>, context);
  }

  async list(input: { page: number; limit: number; status?: string }): Promise<{
    items: ILead[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: FilterQuery<ILead> = { isActive: true };
    if (input.status) {
      if (!allowedStatuses.has(input.status)) throw new BadRequestException('Unsupported lead status filter');
      filter.status = input.status as ILead['status'];
    }
    const [items, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1, _id: -1 }).skip((input.page - 1) * input.limit).limit(input.limit).lean(),
      Lead.countDocuments(filter),
    ]);
    return { items: items as unknown as ILead[], total, page: input.page, limit: input.limit };
  }

  async getById(id: string): Promise<ILead> {
    const lead = await Lead.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async changeStatus(
    id: string,
    status: string,
    context: { tenantId: string; actorId?: string },
  ): Promise<ILead> {
    if (!allowedStatuses.has(status)) throw new BadRequestException('Unsupported lead status');
    return leadService.updateStatus(id, status as ILead['status'], context);
  }
}
