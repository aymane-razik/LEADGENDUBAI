import type { FilterQuery } from 'mongoose';
import { Lead, type ILead } from '../models';
import { cacheService } from './cache.service';
import {
  eventBus,
  outboxRepository,
  auditLog,
  defaultScoringProfile,
  computeSimilarity,
  prepareMerge,
  validateTransition,
} from '../domain/registry';
import { generateCorrelationId, generateEventId } from '../events/types';
import { NotFoundError, ConflictError } from '../utils';
import {
  calculateLeadScore,
  classifyQuality,
  classifyIntent,
  calculateUrgency,
  calculateProbability,
  recomputeFromProfile,
} from '../domain/lead/scoring';
import { DEFAULT_DEDUP_CONFIG, isDuplicateCandidate as isDup } from '../domain/lead/dedup';
import { scopedCacheKey } from '../tenants/storage';

interface ListLeadsOptions {
  page: number;
  limit: number;
  sort: string;
  filters: FilterQuery<ILead>;
}

const TABLES = {
  lead: 'lead' as const,
};

const publishLeadEvent = async (
  eventType: string,
  lead: ILead,
  payload: Record<string, unknown>,
  context: {
    actorId?: string;
    correlationId: string;
    tenantId: string;
    reason?: string;
  },
): Promise<void> => {
  const correlationId = context.correlationId;
  const eventId = generateEventId();

  await outboxRepository.insert({
    eventType,
    version: 1,
    tenantId: context.tenantId,
    correlationId,
    causationId: context.correlationId,
    actor: context.actorId,
    source: 'lead-service',
    payload: {
      eventId,
      leadId: lead._id.toString(),
      ...payload,
    },
  });

  await eventBus.emit(eventType, payload, {
    tenantId: context.tenantId,
    correlationId,
    causationId: context.correlationId,
    actor: context.actorId,
    source: 'lead-service',
    version: 1,
  });
};

const applyScoring = (lead: ILead, profile = defaultScoringProfile): number => {
  const result = calculateLeadScore(lead, profile);
  lead.score = result.score;
  lead.quality = classifyQuality(result.score, profile.thresholds);
  lead.intent = classifyIntent(lead);
  lead.urgency = calculateUrgency(lead.timeline);
  lead.probability = calculateProbability(result.score);
  return result.score;
};

export const leadService = {
  async list(options: ListLeadsOptions): Promise<{ items: ILead[]; total: number }> {
    const { page, limit, sort, filters } = options;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Lead.find(filters).sort(sort).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filters),
    ]);
    return { items: items as unknown as ILead[], total };
  },

  async create(
    payload: Partial<ILead>,
    context: { actorId?: string; tenantId: string } = { tenantId: 'default' },
  ): Promise<ILead> {
    const correlationId = generateCorrelationId();
    const lead = new Lead(payload);
    const scoreResult = applyScoring(lead);

    const duplicates = await this.findDuplicates(lead);
    let isDuplicate = false;
    let duplicateOf: typeof lead._id | undefined = undefined;
    let duplicateScore = 0;

    if (duplicates.length > 0) {
      const first = duplicates[0] as ILead;
      const similarity = computeSimilarity(lead, first);
      isDuplicate = isDup(similarity.score, DEFAULT_DEDUP_CONFIG);
      duplicateScore = similarity.score;
      if (isDuplicate) {
        duplicateOf = first._id;
      }
      lead.isDuplicate = isDuplicate;
      lead.duplicateOf = duplicateOf;
      lead.duplicateScore = duplicateScore;
    }

    const saved = await lead.save();

    await publishLeadEvent('lead.created', saved, { score: saved.score }, {
      actorId: context.actorId,
      correlationId,
      tenantId: context.tenantId,
      reason: isDuplicate ? 'Duplicate detected during ingestion' : undefined,
    });

    await cacheService.del(scopedCacheKey('leads:stats', context.tenantId)).catch(() => {});
    return saved;
  },

  async getById(id: string): Promise<ILead> {
    const lead = await Lead.findById(id);
    if (!lead) throw new NotFoundError('Lead not found');
    return lead;
  },

  async update(
    id: string,
    payload: Partial<ILead>,
    context: { actorId?: string; tenantId: string; correlationId?: string } = { tenantId: 'default' },
  ): Promise<ILead> {
    const lead = await this.getById(id);
    const before = {
      status: lead.status,
      score: lead.score,
      quality: lead.quality,
      intent: lead.intent,
      urgency: lead.urgency,
      probability: lead.probability,
    };

    Object.assign(lead, payload);
    const scoreResult = applyScoring(lead);

    const correlationId = context.correlationId ?? generateCorrelationId();

    const updated = await lead.save();

    await publishLeadEvent('lead.updated', updated, {
      score: updated.score,
      quality: updated.quality,
      changes: Object.keys(payload),
    }, {
      actorId: context.actorId,
      correlationId,
      tenantId: context.tenantId,
    });

    await auditLog.record({
      actorId: context.actorId ?? 'system',
      tenantId: context.tenantId,
      action: 'lead.updated',
      resourceType: TABLES.lead,
      resourceId: id,
      correlationId,
      occurredAt: new Date(),
      before: before as Record<string, unknown>,
      after: {
        status: updated.status,
        score: updated.score,
        quality: updated.quality,
        intent: updated.intent,
        urgency: updated.urgency,
        probability: updated.probability,
      } as Record<string, unknown>,
      metadata: { fields: Object.keys(payload) },
    }).catch(() => {});

    await cacheService.del(scopedCacheKey('leads:stats', context.tenantId)).catch(() => {});
    return updated;
  },

  async softDelete(id: string, context: { actorId?: string; tenantId: string; correlationId?: string } = { tenantId: 'default' }): Promise<ILead> {
    const lead = await this.getById(id);
    const correlationId = context.correlationId ?? generateCorrelationId();

    lead.isActive = false;
    const updated = await lead.save();

    await publishLeadEvent('lead.deleted', updated, { previousStatus: updated.status }, {
      actorId: context.actorId,
      correlationId,
      tenantId: context.tenantId,
    });

    await cacheService.del(scopedCacheKey('leads:stats', context.tenantId)).catch(() => {});
    return updated;
  },

  async updateStatus(
    id: string,
    status: ILead['status'],
    context: { actorId?: string; tenantId: string; reason?: string } = { tenantId: 'default' },
  ): Promise<ILead> {
    const lead = await this.getById(id);
    const correlationId = generateCorrelationId();
    const transitionContext = {
      leadId: id,
      tenantId: context.tenantId,
      actorId: context.actorId,
      correlationId,
      reason: context.reason,
    };

    const transition = validateTransition(lead.status, status, transitionContext);
    if (!transition.allowed) {
      throw new ConflictError(`Cannot transition to ${status}: ${transition.reasons.join('; ')}`);
    }

    const previousStatus = lead.status;
    lead.status = status;

    if (transition.nextFollowup) {
      lead.nextFollowup = transition.nextFollowup;
    }
    if (transition.markQualified) {
      lead.isQualified = true;
    }
    if (transition.clearAssigned) {
      lead.assignedTo = undefined;
    }
    if (transition.recomputeScore) {
      applyScoring(lead);
    }

    const updated = await lead.save();

    await publishLeadEvent('lead.status_changed', updated, {
      previousStatus,
      newStatus: status,
      sideEffects: transition.sideEffects,
    }, {
      actorId: context.actorId,
      correlationId,
      tenantId: context.tenantId,
      reason: context.reason,
    });

    await auditLog.record({
      actorId: context.actorId ?? 'system',
      tenantId: context.tenantId,
      action: 'lead.status_changed',
      resourceType: TABLES.lead,
      resourceId: id,
      correlationId,
      occurredAt: new Date(),
      before: { status: previousStatus } as Record<string, unknown>,
      after: { status: status, nextFollowup: lead.nextFollowup?.toISOString() } as Record<string, unknown>,
      reason: context.reason,
      metadata: { sideEffects: transition.sideEffects },
    }).catch(() => {});

    await cacheService.del(scopedCacheKey('leads:stats', context.tenantId)).catch(() => {});
    return updated;
  },

  async assign(
    id: string,
    userId: string,
    context: { actorId?: string; tenantId: string; reason?: string } = { tenantId: 'default' },
  ): Promise<ILead> {
    const lead = await this.getById(id);
    const user = await Lead.db.model('User').findById(userId);
    if (!user) throw new NotFoundError('Agent not found');

    const previousAssignee = lead.assignedTo?.toString();
    lead.assignedTo = user._id;
    const updated = await lead.save();

    const correlationId = generateCorrelationId();
    await publishLeadEvent('lead.assigned', updated, {
      assigneeId: userId,
      previousAssignee,
    }, {
      actorId: context.actorId,
      correlationId,
      tenantId: context.tenantId,
      reason: context.reason,
    });

    await auditLog.record({
      actorId: context.actorId ?? 'system',
      tenantId: context.tenantId,
      action: 'lead.assigned',
      resourceType: TABLES.lead,
      resourceId: id,
      correlationId,
      occurredAt: new Date(),      before: { assignedTo: previousAssignee } as Record<string, unknown>,
      after: { assignedTo: userId } as Record<string, unknown>,
      reason: context.reason,
    }).catch(() => {});

    await cacheService.del(scopedCacheKey('leads:stats', context.tenantId)).catch(() => {});
    return updated;
  },

  async autoAssign(
    id: string,
    agentId: string,
    context: { actorId?: string; tenantId: string } = { tenantId: 'default' },
  ): Promise<ILead> {
    const lead = await this.getById(id);
    const previousAssignee = lead.assignedTo?.toString();
    (lead as unknown as { assignedTo: unknown }).assignedTo = agentId;
    const updated = await lead.save();

    const correlationId = generateCorrelationId();
    await publishLeadEvent('lead.assigned', updated, {
      assigneeId: agentId,
      previousAssignee,
      auto: true,
    }, {
      actorId: context.actorId,
      correlationId,
      tenantId: context.tenantId,
    });

    await auditLog.record({
      actorId: context.actorId ?? 'system',
      tenantId: context.tenantId,
      action: 'lead.assigned',
      resourceType: TABLES.lead,
      resourceId: id,
      correlationId,
      occurredAt: new Date(),      before: { assignedTo: previousAssignee } as Record<string, unknown>,
      after: { assignedTo: agentId } as Record<string, unknown>,
      reason: 'Auto-assignment',
      metadata: { auto: true },
    }).catch(() => {});

    await cacheService.del(scopedCacheKey('leads:stats', context.tenantId)).catch(() => {});
    return updated;
  },

  async recalculateScore(id: string, profileId = 'default'): Promise<ILead> {
    const lead = await this.getById(id);
    const profile = defaultScoringProfile;
    const result = recomputeFromProfile(lead, profile);
    lead.score = result.score;
    lead.quality = result.quality;
    lead.intent = result.intent;
    lead.urgency = result.urgency;
    lead.probability = result.probability;
    const updated = await lead.save();
    return updated;
  },

  async deduplicate(
    primaryId: string,
    duplicateId: string,
    context: { actorId?: string; tenantId: string; correlationId?: string } = { tenantId: 'default' },
  ): Promise<{ primary: ILead; secondary: ILead; mergedFields: string[]; similarity: number }> {
    const lead = await this.getById(primaryId);
    const duplicate = await this.getById(duplicateId);
    const correlationId = context.correlationId ?? generateCorrelationId();

    const similarity = computeSimilarity(lead, duplicate);
    if (similarity.score < 0.6) {
      throw new ConflictError('Similarity too low to merge');
    }

    const primary = lead.score >= duplicate.score ? lead : duplicate;
    const secondary = lead.score >= duplicate.score ? duplicate : lead;

    const merge = prepareMerge(primary, secondary, DEFAULT_DEDUP_CONFIG, similarity.score);

    secondary.isDuplicate = true;
    secondary.duplicateOf = primary._id;
    secondary.duplicateScore = similarity.score;
    secondary.isActive = false;
    await secondary.save();

    await primary.save();

    await publishLeadEvent('lead.merged', primary, {
      secondaryId: secondary._id.toString(),
      similarity: similarity.score,
      mergedFields: merge.mergedFields,
    }, {
      actorId: context.actorId,
      correlationId,
      tenantId: context.tenantId,
    });

    await auditLog.record({
      actorId: context.actorId ?? 'system',
      tenantId: context.tenantId,
      action: 'lead.merged',
      resourceType: TABLES.lead,
      resourceId: primary._id.toString(),
      correlationId,
      occurredAt: new Date(),      before: { duplicateId: duplicate._id.toString(), score: duplicate.score } as Record<string, unknown>,
      after: { mergedId: secondary._id.toString(), similarity: similarity.score } as Record<string, unknown>,
      reason: merge.auditReason,
      metadata: {
        mergedFields: merge.mergedFields,
        primaryScore: primary.score,
        secondaryScore: duplicate.score,
      },
    }).catch(() => {});

    await cacheService.del(scopedCacheKey('leads:stats')).catch(() => {});
    return { primary, secondary, mergedFields: merge.mergedFields, similarity: similarity.score };
  },

  async findDuplicates(lead: ILead): Promise<ILead[]> {
    const idQuery = lead._id ? { _id: { $ne: lead._id } } : {};
    const candidates = await Lead.find({
      ...idQuery,
      $or: [
        { email: lead.email },
        { phone: lead.phone },
        { whatsapp: lead.whatsapp },
      ],
    });

    const nameMatches = await Lead.find({
      ...idQuery,
      firstName: lead.firstName ? new RegExp(lead.firstName, 'i') : null,
      lastName: lead.lastName ? new RegExp(lead.lastName || '', 'i') : null,
    });

    const all = [...candidates, ...nameMatches];
    const seen = new Set<string>();
    return all.filter((item) => {
      const key = item._id.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  async stats(): Promise<Record<string, number>> {
    const key = scopedCacheKey('leads:stats');
    const cached = await cacheService.get<Record<string, number>>(key);
    if (cached) return cached;

    const [total, active, hot, qualified] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ isActive: true }),
      Lead.countDocuments({ quality: 'hot', isActive: true }),
      Lead.countDocuments({ isQualified: true, isActive: true }),
    ]);

    const payload = { total, active, hot, qualified };
    await cacheService.set(key, payload, 120).catch(() => {});
    return payload;
  },
};
