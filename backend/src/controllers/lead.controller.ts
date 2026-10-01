import type { Request, Response } from 'express';
import { Lead, Activity, User } from '../models';
import { leadService } from '../services';
import { ConflictError, paginatedResponse, successResponse } from '../utils';
import { assignAgent, computeSimilarity, prepareMerge, calculateLeadScore, defaultScoringProfile } from '../domain/registry';
import type { Agent } from '../domain/lead/assignment';
import { generateCorrelationId } from '../events/types';
import { enqueueJob } from '../queues/registry';
import type { LeadQuery, LeadListItem, SortField, SortOrder } from '../dtos/lead';

const parsePagination = (req: Request): { page: number; limit: number } => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  return { page: Math.max(page, 1), limit: Math.min(Math.max(limit, 1), 100) };
};

const parseLeadQuery = (req: Request): LeadQuery => {
  const query: LeadQuery = {};
  if (req.query.status) query.status = (req.query.status as string).split(',') as LeadQuery['status'];
  if (req.query.quality) query.quality = (req.query.quality as string).split(',') as LeadQuery['quality'];
  if (req.query.intent) query.intent = (req.query.intent as string).split(',') as LeadQuery['intent'];
  if (req.query.source) query.source = (req.query.source as string).split(',') as LeadQuery['source'];
  if (req.query.timeline) query.timeline = (req.query.timeline as string).split(',') as LeadQuery['timeline'];
  if (req.query.propertyType) query.propertyType = (req.query.propertyType as string).split(',') as LeadQuery['propertyType'];
  if (req.query.purpose) query.purpose = (req.query.purpose as string).split(',') as LeadQuery['purpose'];
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo as string;
  if (req.query.unassigned === 'true') query.unassigned = true;
  if (req.query.search) query.search = req.query.search as string;
  if (req.query.minScore) query.minScore = Number(req.query.minScore);
  if (req.query.maxScore) query.maxScore = Number(req.query.maxScore);
  if (req.query.dateFrom) query.dateFrom = req.query.dateFrom as string;
  if (req.query.dateTo) query.dateTo = req.query.dateTo as string;
  if (req.query.enriched !== undefined) query.enriched = req.query.enriched === 'true';
  if (req.query.inactive === 'true') query.inactive = true;
  if (req.query.blacklist === 'true') query.blacklist = true;
  if (req.query.dnc === 'true') query.dnc = true;
  if (req.query.duplicate === 'true') query.duplicate = true;
  if (req.query.tenantId) query.tenantId = req.query.tenantId as string;
  if (req.query.withRole !== undefined) query.withRole = req.query.withRole === 'true';
  return query;
};

export const leadController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = parsePagination(req);
    const query = parseLeadQuery(req);
    const sortParam = String(req.query.sort ?? '-createdAt');
    const allowedFields: SortField[] = ['createdAt', 'updatedAt', 'score', 'status', 'quality', 'assignedTo', 'lastContact', 'nextFollowup'];
    const defaultField: SortField = 'createdAt';
    const defaultOrder: SortOrder = 'desc';

    const parseSortField = (value: string): { field: SortField; order: SortOrder } => {
      const parts = value.split(':');
      const field = parts[0] && allowedFields.includes(parts[0] as SortField)
        ? (parts[0] as SortField)
        : defaultField;
      const order = parts[1] && (parts[1] === 'asc' || parts[1] === 'desc')
        ? (parts[1] as SortOrder)
        : defaultOrder;
      return { field, order };
    };

    const { field, order } = parseSortField(sortParam);
    const sort = `${order === 'asc' ? '' : '-'}${field}`;

    const filters: Record<string, unknown> = { isActive: query.inactive !== true };
    if (query.status?.length) filters.status = { $in: query.status };
    if (query.quality?.length) filters.quality = { $in: query.quality };
    if (query.intent?.length) filters.intent = { $in: query.intent };
    if (query.source?.length) filters.source = { $in: query.source };
    if (query.timeline?.length) filters.timeline = { $in: query.timeline };
    if (query.propertyType?.length) filters.propertyType = { $in: query.propertyType };
    if (query.purpose?.length) filters.purpose = { $in: query.purpose };
    if (query.minScore != null || query.maxScore != null) {
      filters.score = {};
      if (query.minScore != null) (filters.score as Record<string, number>).$gte = query.minScore;
      if (query.maxScore != null) (filters.score as Record<string, number>).$lte = query.maxScore;
    }
    if (query.enriched === true) filters.enriched = true;
    if (query.blacklist === true) filters.isBlacklisted = true;
    if (query.dnc === true) filters.doNotContact = true;
    if (query.duplicate === true) filters.isDuplicate = true;
    if (query.assignedTo) filters.assignedTo = query.assignedTo;
    if (query.unassigned) filters.assignedTo = null;

    if (query.dateFrom || query.dateTo) {
      filters.createdAt = {};
      if (query.dateFrom) (filters.createdAt as Record<string, string>).$gte = query.dateFrom;
      if (query.dateTo) (filters.createdAt as Record<string, string>).$lte = query.dateTo;
    }

    const correlationId = req.correlationId ?? generateCorrelationId();
    const result = await leadService.list({
      page,
      limit,
      sort,
      filters,
    });

    const items = result.items.map((lead) => {
      const item: LeadListItem = {
        id: lead._id.toString(),
        source: lead.source,
        sourceId: lead.sourceId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
        language: lead.language,
        propertyType: lead.propertyType,
        purpose: lead.purpose,
        budget: lead.budget,
        locations: lead.locations,
        timeline: lead.timeline,
        score: lead.score,
        quality: lead.quality,
        intent: lead.intent,
        urgency: lead.urgency,
        probability: lead.probability,
        status: lead.status,
        substatus: lead.substatus,
        assignedTo: lead.assignedTo?.toString(),
        lastContact: lead.lastContact?.toISOString(),
        nextFollowup: lead.nextFollowup?.toISOString(),
        touchpoints: lead.touchpoints,
        responseRate: lead.responseRate,
        enriched: lead.enriched,
        tags: lead.tags,
        isDuplicate: lead.isDuplicate,
        duplicateOf: lead.duplicateOf?.toString(),
        duplicateScore: lead.duplicateScore,
        isActive: lead.isActive,
        isQualified: lead.isQualified,
        isBlacklisted: lead.isBlacklisted,
        doNotContact: lead.doNotContact,
        capturedAt: lead.capturedAt.toISOString(),
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      };
      if (query.withRole) {
        // populate name would go here
      }
      return item;
    });

    paginatedResponse(res, items, page, limit, result.total, 'Leads fetched');
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const correlationId = req.correlationId ?? generateCorrelationId();
    const item = await leadService.create(req.body, {
      actorId: req.user?.userId,
      tenantId: req.tenant?.tenantId ?? 'default',
    });
    successResponse(res, 'Lead created', {
      id: item._id.toString(),
      score: item.score,
      quality: item.quality,
      isDuplicate: item.isDuplicate,
      duplicateOf: item.duplicateOf?.toString(),
      duplicateScore: item.duplicateScore,
    });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await leadService.getById(id);
    successResponse(res, 'Lead fetched', {
      id: item._id.toString(),
      source: item.source,
      sourceId: item.sourceId,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      phone: item.phone,
      whatsapp: item.whatsapp,
      nationality: item.nationality,
      language: item.language,
      occupation: item.occupation,
      company: item.company,
      income: item.income,
      employmentStatus: item.employmentStatus,
      propertyType: item.propertyType,
      purpose: item.purpose,
      budget: item.budget,
      locations: item.locations,
      bedrooms: item.bedrooms,
      timeline: item.timeline,
      financing: item.financing,
      score: item.score,
      quality: item.quality,
      intent: item.intent,
      urgency: item.urgency,
      probability: item.probability,
      enriched: item.enriched,
      enrichmentData: item.enrichmentData,
      status: item.status,
      substatus: item.substatus,
      assignedTo: item.assignedTo?.toString(),
      lastContact: item.lastContact?.toISOString(),
      nextFollowup: item.nextFollowup?.toISOString(),
      touchpoints: item.touchpoints,
      responseRate: item.responseRate,
      tags: item.tags,
      notes: item.notes,
      customFields: Object.fromEntries(item.customFields),
      isDuplicate: item.isDuplicate,
      duplicateOf: item.duplicateOf?.toString(),
      duplicateScore: item.duplicateScore,
      isActive: item.isActive,
      isQualified: item.isQualified,
      isBlacklisted: item.isBlacklisted,
      doNotContact: item.doNotContact,
      utmSource: item.utmSource,
      utmMedium: item.utmMedium,
      utmCampaign: item.utmCampaign,
      utmContent: item.utmContent,
      referrer: item.referrer,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      deviceType: item.deviceType,
      capturedAt: item.capturedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    });
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const correlationId = req.correlationId ?? generateCorrelationId();
    const item = await leadService.update(id, req.body, {
      actorId: req.user?.userId,
      tenantId: req.tenant?.tenantId ?? 'default',
      correlationId,
    });
    successResponse(res, 'Lead updated', {
      id: item._id.toString(),
      score: item.score,
      quality: item.quality,
      intent: item.intent,
      urgency: item.urgency,
      probability: item.probability,
    });
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const correlationId = req.correlationId ?? generateCorrelationId();
    const item = await leadService.softDelete(id, {
      actorId: req.user?.userId,
      tenantId: req.tenant?.tenantId ?? 'default',
      correlationId,
    });
    successResponse(res, 'Lead deleted', { id: item._id.toString() });
  },

  updateStatus: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { status } = req.body as { status: string };
    const correlationId = req.correlationId ?? generateCorrelationId();
    const item = await leadService.updateStatus(id, status as never, {
      actorId: req.user?.userId,
      tenantId: req.tenant?.tenantId ?? 'default',
      reason: req.body.reason as string | undefined,
    });
    successResponse(res, 'Lead status updated', {
      id: item._id.toString(),
      status: item.status,
      nextFollowup: item.nextFollowup?.toISOString(),
      isQualified: item.isQualified,
    });
  },

  assign: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { userId } = req.body as { userId: string };
    const correlationId = req.correlationId ?? generateCorrelationId();
    const item = await leadService.assign(id, userId, {
      actorId: req.user?.userId,
      tenantId: req.tenant?.tenantId ?? 'default',
      reason: req.body.reason as string | undefined,
    });
    successResponse(res, 'Lead assigned', {
      id: item._id.toString(),
      assignedTo: item.assignedTo?.toString(),
    });
  },

  autoAssign: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const correlationId = req.correlationId ?? generateCorrelationId();

    const lead = await leadService.getById(id);
    const tenantId = req.tenant?.tenantId ?? 'default';
    const agents = await User.find({ role: 'agent', isActive: true }).select(
      'firstName lastName team assignment metrics settings',
    ).lean();
    const loadRows = await Lead.aggregate([
      { $match: { isActive: true, assignedTo: { $in: agents.map((agent) => agent._id) } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]);
    const loadByAgent = new Map<string, number>(loadRows.map((row: { _id: unknown; count: number }) => [String(row._id), row.count]));
    const candidates: Agent[] = agents.map((agent) => ({
      id: agent._id.toString(),
      name: `${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim(),
      role: 'agent',
      isActive: true,
      team: agent.team,
      territory: agent.assignment?.territory,
      propertyTypes: agent.assignment?.propertyTypes as Agent['propertyTypes'],
      preferredTimeline: agent.assignment?.preferredTimeline as Agent['preferredTimeline'],
      capacity: agent.assignment?.capacity ?? 25,
      currentLoad: loadByAgent.get(agent._id.toString()) ?? 0,
      avgResponseTimeMinutes: agent.metrics?.avgResponseTime,
      conversionRate: agent.metrics?.conversionRate,
      language: agent.settings?.preferences?.language,
    }));
    const result = assignAgent(candidates, {
      tenantId,
      lead: {
        id,
        locations: lead.locations,
        propertyType: lead.propertyType,
        timeline: lead.timeline,
        source: lead.source,
        purpose: lead.purpose,
        language: lead.language,
        budget: lead.budget,
      },
    });
    const selectedAgent = candidates.find((agent) => agent.id === result.agentId);
    if (!selectedAgent || result.afterLoad > selectedAgent.capacity) {
      throw new ConflictError('No eligible agents have available capacity');
    }
    const updated = await leadService.autoAssign(id, result.agentId, {
      actorId: req.user?.userId,
      tenantId,
    });

    successResponse(res, 'Lead auto-assigned', {
      id: updated._id.toString(),
      assignedTo: updated.assignedTo?.toString(),
      assignment: result,
    });
  },

  recalculateScore: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await leadService.recalculateScore(id);
    successResponse(res, 'Lead score recalculated', {
      id: item._id.toString(),
      score: item.score,
      quality: item.quality,
      intent: item.intent,
      urgency: item.urgency,
      probability: item.probability,
      profile: defaultScoringProfile.id,
    });
  },

  scoreExplain: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const lead = await leadService.getById(id);
    const result = calculateLeadScore(lead, defaultScoringProfile);
    successResponse(res, 'Lead score explained', {
      id: lead._id.toString(),
      score: result.score,
      maxPossible: result.maxPossible,
      profile: result.appliedProfile,
      factors: result.factors,
    });
  },

  enrich: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const item = await leadService.update(id, {
      enriched: true,
      enrichmentData: req.body.enrichmentData,
    }, {
      actorId: req.user?.userId,
      tenantId: req.tenant?.tenantId ?? 'default',
    });
    successResponse(res, 'Lead enriched', {
      id: item._id.toString(),
      enriched: item.enriched,
    });
  },

  enrichJob: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const correlationId = req.correlationId ?? generateCorrelationId();
    const { id: jobId } = await enqueueJob('lead:enrichment', {
      leadId: id,
      enrichmentData: req.body.enrichmentData ?? {},
      tenantId: req.tenant?.tenantId ?? 'default',
      correlationId,
    }, { jobId: `lead-enrichment:${id}:${Date.now()}` });
    successResponse(res, 'Enrichment job queued', {
      leadId: id,
      jobId,
      correlationId,
      status: 'queued',
    });
  },

  getActivities: async (req: Request, res: Response): Promise<void> => {
    const items = await Activity.find({ leadId: req.params.id }).sort('-createdAt').lean();
    successResponse(res, 'Lead activities fetched', items);
  },

  addActivity: async (req: Request, res: Response): Promise<void> => {
    const item = await Activity.create({
      ...req.body,
      leadId: req.params.id,
      performedBy: req.user?.userId,
    });
    successResponse(res, 'Activity added', item);
  },

  timeline: async (req: Request, res: Response): Promise<void> => {
    const activities = await Activity.find({ leadId: req.params.id }).sort('-createdAt').lean();
    successResponse(res, 'Lead timeline fetched', activities);
  },

  bulkCreate: async (req: Request, res: Response): Promise<void> => {
    const records = req.body.leads as Record<string, unknown>[];
    const correlationId = req.correlationId ?? generateCorrelationId();
    const created = await Promise.all(
      records.map((item) => leadService.create(item, {
        actorId: req.user?.userId,
        tenantId: req.tenant?.tenantId ?? 'default',
      })),
    );
    successResponse(res, 'Bulk leads created', created.map((c) => ({ id: c._id.toString(), score: c.score })));
  },

  bulkUpdate: async (req: Request, res: Response): Promise<void> => {
    const updates = req.body.updates as Array<{ id: string; payload: Record<string, unknown> }>;
    const correlationId = req.correlationId ?? generateCorrelationId();
    const result = await Promise.all(
      updates.map((item) => leadService.update(item.id, item.payload, {
        actorId: req.user?.userId,
        tenantId: req.tenant?.tenantId ?? 'default',
        correlationId,
      })),
    );
    successResponse(res, 'Bulk leads updated', result.map((c) => ({ id: c._id.toString(), score: c.score })));
  },

  deduplicate: async (req: Request, res: Response): Promise<void> => {
    const { primaryId, duplicateId } = req.body as { primaryId: string; duplicateId: string };
    const correlationId = req.correlationId ?? generateCorrelationId();
    const result = await leadService.deduplicate(primaryId, duplicateId, {
      actorId: req.user?.userId,
      tenantId: req.tenant?.tenantId ?? 'default',
      correlationId,
    });
    successResponse(res, 'Leads deduplicated', {
      primaryId: result.primary._id.toString(),
      mergedId: result.secondary._id.toString(),
      similarity: result.similarity,
      mergedFields: result.mergedFields,
    });
  },

  findDuplicates: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const lead = await leadService.getById(id);
    const duplicates = await leadService.findDuplicates(lead);
    const enriched = duplicates.map((d) => {
      const similarity = computeSimilarity(lead, d);
      return {
        leadId: d._id.toString(),
        similarity: similarity.score,
        factors: similarity.factors,
        matchedFields: similarity.matchedFields,
        explanation: similarity.explanation,
      };
    });
    successResponse(res, 'Duplicates found', enriched);
  },

  stats: async (_req: Request, res: Response): Promise<void> => {
    const stats = await leadService.stats();
    successResponse(res, 'Lead stats fetched', stats);
  },

  export: async (_req: Request, res: Response): Promise<void> => {
    const leads = await Lead.find({ isActive: true }).lean();
    successResponse(res, 'Lead export generated', leads);
  },

  import: async (req: Request, res: Response): Promise<void> => {
    const records = req.body.leads as Record<string, unknown>[];
    const correlationId = req.correlationId ?? generateCorrelationId();
    const created = await Promise.all(
      records.map((item) => leadService.create(item, {
        actorId: req.user?.userId,
        tenantId: req.tenant?.tenantId ?? 'default',
      })),
    );
    successResponse(res, 'Lead import completed', created.map((c) => ({ id: c._id.toString(), score: c.score })));
  },
};
