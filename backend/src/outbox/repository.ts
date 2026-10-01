import { model, Schema, type Document } from 'mongoose';
import { logger } from '../utils';

export interface OutboxEventRecord {
  id: string;
  eventType: string;
  version: number;
  tenantId: string;
  correlationId: string;
  causationId?: string;
  payload: string;
  actor?: string;
  source?: string;
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  attempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface OutboxInsertRecord {
  eventType: string;
  version: number;
  tenantId: string;
  correlationId: string;
  causationId?: string;
  payload: string | Record<string, unknown>;
  actor?: string;
  source?: string;
}

export interface OutboxRepository {
  insert(record: OutboxInsertRecord): Promise<string>;
  findPending(limit: number, now?: Date): Promise<OutboxEventRecord[]>;
  markProcessing(id: string): Promise<boolean>;
  markDelivered(id: string, deliveredAt?: Date): Promise<void>;
  markFailed(id: string, errorMessage: string, nextRetryAt?: Date): Promise<void>;
  countPending(): Promise<number>;
}

interface IOutboxDocument extends Document {
  eventType: string;
  version: number;
  tenantId: string;
  correlationId: string;
  causationId?: string;
  payload: string;
  actor?: string;
  source?: string;
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  attempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

const OutboxSchema = new Schema<IOutboxDocument>(
  {
    eventType: { type: String, required: true },
    version: { type: Number, required: true },
    tenantId: { type: String, required: true },
    correlationId: { type: String, required: true },
    causationId: { type: String },
    payload: { type: String, required: true },
    actor: { type: String },
    source: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'delivered', 'failed'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    nextRetryAt: { type: Date },
    deliveredAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

OutboxSchema.index({ status: 1, nextRetryAt: 1 });
OutboxSchema.index({ tenantId: 1, status: 1, createdAt: 1 });

const Outbox = model<IOutboxDocument>('Outbox', OutboxSchema);

const serializePayload = (payload: string | Record<string, unknown>): string =>
  typeof payload === 'string' ? payload : JSON.stringify(payload);

export const outboxRepository: OutboxRepository = {
  async insert(record: OutboxInsertRecord): Promise<string> {
    try {
      const doc = new Outbox({
        eventType: record.eventType,
        version: record.version,
        tenantId: record.tenantId,
        correlationId: record.correlationId,
        causationId: record.causationId,
        payload: serializePayload(record.payload),
        actor: record.actor,
        source: record.source,
      });
      await doc.save();
      return doc._id.toString();
    } catch (error) {
      // Never break the request path because of outbox failures.
      logger.warn('Outbox insert failed', { eventType: record.eventType, error });
      return '';
    }
  },

  async findPending(limit: number, now = new Date()): Promise<OutboxEventRecord[]> {
    const docs = await Outbox.find({
      status: { $in: ['pending', 'processing'] },
      $or: [
        { status: 'pending' },
        { status: 'processing', nextRetryAt: { $lte: now } },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
    return (docs as unknown as Array<Record<string, unknown>>).map((d) => ({
      id: String(d._id),
      eventType: d.eventType as string,
      version: d.version as number,
      tenantId: d.tenantId as string,
      correlationId: d.correlationId as string,
      causationId: d.causationId as string | undefined,
      payload: d.payload as string,
      actor: d.actor as string | undefined,
      source: d.source as string | undefined,
      status: d.status as OutboxEventRecord['status'],
      attempts: d.attempts as number,
      nextRetryAt: d.nextRetryAt as Date | undefined,
      deliveredAt: d.deliveredAt as Date | undefined,
      errorMessage: d.errorMessage as string | undefined,
      createdAt: d.createdAt as Date,
    }));
  },

  async markProcessing(id: string): Promise<boolean> {
    const result = await Outbox.updateOne(
      { _id: id, status: 'pending' },
      { $set: { status: 'processing' } },
    );
    return result.modifiedCount > 0;
  },

  async markDelivered(id: string, deliveredAt = new Date()): Promise<void> {
    await Outbox.updateOne({ _id: id }, { $set: { status: 'delivered', deliveredAt } });
  },

  async markFailed(id: string, errorMessage: string, nextRetryAt?: Date): Promise<void> {
    await Outbox.updateOne(
      { _id: id },
      {
        $set: { status: 'failed', errorMessage, nextRetryAt: nextRetryAt ?? new Date() },
        $inc: { attempts: 1 },
      },
    );
  },

  async countPending(): Promise<number> {
    return Outbox.countDocuments({ status: { $in: ['pending', 'processing'] } });
  },
};
