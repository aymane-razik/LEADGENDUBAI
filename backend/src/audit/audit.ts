import { model, Schema, type Document } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { logger } from '../utils';
import type { AuditInput } from './types';

export interface AuditEntry {
  readonly id: string;
  readonly actorId: string;
  readonly tenantId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly correlationId: string;
  readonly occurredAt: Date;
  readonly before?: Record<string, unknown>;
  readonly after?: Record<string, unknown>;
  readonly reason?: string;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly metadata?: Record<string, unknown>;
}

const AuditSchema = new Schema<AuditEntry & { _id: unknown }>(
  {
    actorId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, required: true, index: true },
    correlationId: { type: String, required: true, index: true },
    occurredAt: { type: Date, default: Date.now, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: false },
);

AuditSchema.index({ tenantId: 1, resourceType: 1, resourceId: 1 });
AuditSchema.index({ actorId: 1, occurredAt: -1 });
AuditSchema.index({ tenantId: 1, action: 1, occurredAt: -1 });

const Audit = model<AuditEntry & { _id: unknown }>('AuditEntry', AuditSchema);

export const auditLog = {
  async record(entry: AuditInput): Promise<void> {
    try {
      const doc = new Audit({
        ...entry,
    id: randomUUID(),
        occurredAt: entry.occurredAt ?? new Date(),
      });
      await doc.save();
    } catch (error) {
      // Audit must never throw into the main request path; log and continue.
      logger.error('Audit recording failed', {
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        error,
      });
    }
  },

  async forResource(
    tenantId: string,
    resourceType: string,
    resourceId: string,
    limit = 50,
  ): Promise<AuditEntry[]> {
    const docs = await Audit.find({
      tenantId,
      resourceType,
      resourceId,
    })
      .sort({ occurredAt: -1 })
      .limit(limit)
      .lean();
    return docs as unknown as AuditEntry[];
  },
};
