import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Joi from 'joi';
import { Types } from 'mongoose';
import { Activity, type IActivity } from '../models';

const createActivitySchema = Joi.object({
  leadId: Joi.string().hex().length(24).required(),
  type: Joi.string().valid('call', 'email', 'whatsapp', 'sms', 'meeting', 'viewing', 'note', 'status_change', 'document', 'task').required(),
  channel: Joi.string().valid('phone', 'email', 'whatsapp', 'sms', 'in_person', 'video_call'),
  direction: Joi.string().valid('inbound', 'outbound').required(),
  subject: Joi.string().max(300),
  content: Joi.string().max(10000).required(),
  outcome: Joi.string().valid('positive', 'neutral', 'negative', 'no_response'),
  nextAction: Joi.string().max(1000),
  metadata: Joi.object({ duration: Joi.number().min(0), emailId: Joi.string(), messageId: Joi.string(), attachments: Joi.array().items(Joi.string().uri()), propertyIds: Joi.array().items(Joi.string().hex().length(24)) }),
  relatedTo: Joi.string().hex().length(24),
  scheduledAt: Joi.date(),
}).unknown(false);

const updateActivitySchema = Joi.object({
  subject: Joi.string().max(300),
  content: Joi.string().max(10000),
  outcome: Joi.string().valid('positive', 'neutral', 'negative', 'no_response'),
  nextAction: Joi.string().max(1000),
  scheduledAt: Joi.date().allow(null),
  isCompleted: Joi.boolean(),
}).min(1).unknown(false);

@Injectable()
export class ActivitiesApplication {
  async list(page: number, limit: number) {
    const filter = {};
    const [items, total] = await Promise.all([
      Activity.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Activity.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  upcoming() {
    return Activity.find({ isCompleted: false, scheduledAt: { $gte: new Date() } }).sort({ scheduledAt: 1 }).limit(100).lean();
  }

  overdue() {
    return Activity.find({ isCompleted: false, scheduledAt: { $lt: new Date() } }).sort({ scheduledAt: 1 }).limit(100).lean();
  }

  async create(input: unknown, actorId?: string) {
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Authenticated user id is invalid');
    const { error, value } = createActivitySchema.validate(input, { abortEarly: false, stripUnknown: true });
    if (error) throw new BadRequestException({ message: 'Activity validation failed', details: error.details.map((detail) => detail.message) });
    return Activity.create({ ...value, performedBy: actorId } as Partial<IActivity>);
  }

  async getById(id: string) {
    const activity = await this.findById(id);
    return activity;
  }

  async update(id: string, input: unknown) {
    const { error, value } = updateActivitySchema.validate(input, { abortEarly: false, stripUnknown: true });
    if (error) throw new BadRequestException({ message: 'Activity validation failed', details: error.details.map((detail) => detail.message) });
    const activity = await this.findById(id);
    Object.assign(activity, value);
    return activity.save();
  }

  async complete(id: string) {
    const activity = await this.findById(id);
    activity.isCompleted = true;
    activity.completedAt = new Date();
    return activity.save();
  }

  async remove(id: string) {
    const activity = await this.findById(id);
    await activity.deleteOne();
    return { success: true as const };
  }

  private async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Activity id must be a valid identifier');
    const activity = await Activity.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }
}
