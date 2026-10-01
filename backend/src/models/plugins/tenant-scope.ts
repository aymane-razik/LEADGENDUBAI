import type { PipelineStage, Schema } from 'mongoose';
import { currentTenant } from '../../tenants/storage';

const scopedOperations = [
  'find',
  'findOne',
  'countDocuments',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
] as const;

const removeTenantMutation = (update: unknown): unknown => {
  if (!update || typeof update !== 'object' || Array.isArray(update)) return update;
  const safe = { ...(update as Record<string, unknown>) };
  delete safe.tenantId;
  for (const operator of ['$set', '$setOnInsert', '$unset', '$rename']) {
    const values = safe[operator];
    if (values && typeof values === 'object') {
      const fields = { ...(values as Record<string, unknown>) };
      delete fields.tenantId;
      safe[operator] = fields;
    }
  }
  return safe;
};

export const tenantScopePlugin = (schema: Schema): void => {
  schema.add({
    tenantId: {
      type: String,
      required: true,
      default: () => currentTenant().tenantId,
      index: true,
      immutable: true,
    },
  });

  for (const operation of scopedOperations) {
    schema.pre(operation, function scopeQuery() {
      this.setQuery({ ...this.getQuery(), tenantId: currentTenant().tenantId });
      const update = this.getUpdate();
      if (update) this.setUpdate(removeTenantMutation(update) as never);
    });
  }

  schema.pre('aggregate', function scopeAggregate() {
    const tenantId = currentTenant().tenantId;
    const pipeline = this.pipeline() as PipelineStage[];
    const first = pipeline[0] as unknown as Record<string, unknown> | undefined;
    if (first?.$geoNear && typeof first.$geoNear === 'object') {
      const geoNear = first.$geoNear as Record<string, unknown>;
      geoNear.query = { ...((geoNear.query as Record<string, unknown> | undefined) ?? {}), tenantId };
      return;
    }
    if (first?.$search || first?.$searchMeta) {
      pipeline.splice(1, 0, { $match: { tenantId } });
      return;
    }
    pipeline.unshift({ $match: { tenantId } });
  });

  schema.pre('save', function scopeSave() {
    const tenantId = currentTenant().tenantId;
    const document = this as typeof this & { tenantId?: string };
    if (document.tenantId && document.tenantId !== tenantId) {
      throw new Error('A record cannot be moved between tenants');
    }
    document.tenantId = tenantId;
  });
};
