import type { Request, Response } from 'express';
import { Campaign } from '../models';
import { paginatedResponse, successResponse } from '../utils';
import { resolveRecipient, isEligibleForCampaign, computeDripSchedule, applyDeliveryOutcome } from '../domain/registry';
import { generateCorrelationId } from '../events/types';
import { ServiceUnavailableError } from '../utils';

export const campaignController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Campaign.find().sort('-createdAt').skip(skip).limit(limit).lean(),
      Campaign.countDocuments(),
    ]);
    paginatedResponse(res, items, page, limit, total, 'Campaigns fetched');
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const item = await Campaign.create({
      ...req.body,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    });
    successResponse(res, 'Campaign created', item);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const item = await Campaign.findById(req.params.id);
    successResponse(res, 'Campaign fetched', item);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const item = await Campaign.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.userId },
      { new: true },
    );
    successResponse(res, 'Campaign updated', item);
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    await Campaign.findByIdAndDelete(req.params.id);
    successResponse(res, 'Campaign deleted');
  },

  start: async (req: Request, res: Response): Promise<void> => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    if (process.env.DEMO_MODE === 'true') {
      campaign.status = 'active';
      campaign.updatedBy = req.user?.userId as never;
      await campaign.save();
      successResponse(res, 'Campaign activated in demo simulation. No messages were sent.', {
        campaignId: campaign.id,
        status: campaign.status,
        simulated: true,
        noMessagesSent: true,
      });
      return;
    }
    throw new ServiceUnavailableError(`Campaign "${campaign.name}" cannot start because no delivery adapter is configured. No messages were sent.`);
  },

  pause: async (req: Request, res: Response): Promise<void> => {
    const item = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'paused' },
      { new: true },
    );
    successResponse(res, 'Campaign paused', item);
  },

  resume: async (req: Request, res: Response): Promise<void> => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    if (process.env.DEMO_MODE === 'true') {
      campaign.status = 'active';
      campaign.updatedBy = req.user?.userId as never;
      await campaign.save();
      successResponse(res, 'Campaign resumed in demo simulation. No messages were sent.', {
        campaignId: campaign.id,
        status: campaign.status,
        simulated: true,
        noMessagesSent: true,
      });
      return;
    }
    throw new ServiceUnavailableError(`Campaign "${campaign.name}" cannot resume because no delivery adapter is configured. No messages were sent.`);
  },

  recipients: async (req: Request, res: Response): Promise<void> => {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    const Lead = (await import('../models')).Lead;
    const leadFilter: Record<string, unknown> = { status: { $nin: ['lost', 'deal_closed'] } };
    if (campaign.targeting.includeLeadIds?.length) leadFilter._id = { $in: campaign.targeting.includeLeadIds };
    if (campaign.targeting.excludeLeadIds?.length) {
      const currentIdFilter = leadFilter._id as { $in?: unknown[] } | undefined;
      leadFilter._id = { ...(currentIdFilter ?? {}), $nin: campaign.targeting.excludeLeadIds };
    }
    const limit = Math.max(1, Math.min(campaign.targeting.maxRecipients ?? 25, 100));
    const recipients = await Lead.find(leadFilter).sort({ score: -1, createdAt: -1 }).limit(limit)
      .select('firstName lastName email phone status quality score intent source').lean();
    successResponse(res, 'Campaign recipients preview fetched', {
      targeting: campaign.targeting,
      recipients,
      total: recipients.length,
      simulated: process.env.DEMO_MODE === 'true',
    });
  },

  analytics: async (req: Request, res: Response): Promise<void> => {
    const campaign = await Campaign.findById(req.params.id).lean();
    successResponse(res, 'Campaign analytics fetched', campaign?.metrics);
  },

  test: async (req: Request, res: Response): Promise<void> => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    if (process.env.DEMO_MODE === 'true') {
      successResponse(res, 'Test message simulated. No email, SMS, or WhatsApp message was sent.', {
        campaignId: campaign.id,
        simulated: true,
        noMessagesSent: true,
      });
      return;
    }
    throw new ServiceUnavailableError(`Test message for "${campaign.name}" was not sent because no channel provider is configured.`);
  },

  dripSchedule: async (req: Request, res: Response): Promise<void> => {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    const startedAt = campaign.schedule.startDate ? new Date(campaign.schedule.startDate) : new Date();
    const schedule = computeDripSchedule(campaign as never, startedAt);
    successResponse(res, 'Drip schedule computed', {
      campaignId: campaign._id.toString(),
      timezone: campaign.schedule.timezone,
      steps: schedule.map((s) => ({
        step: s.step,
        scheduledAt: s.scheduledAt.toISOString(),
        condition: s.condition,
      })),
    });
  },

  eligibilityCheck: async (req: Request, res: Response): Promise<void> => {
    const { leadId } = req.query as { leadId?: string };
    if (!leadId) {
      res.status(400).json({ success: false, message: 'leadId is required', error: { code: 'VALIDATION_ERROR' } });
      return;
    }
    const lead = await (await import('../models')).Lead.findById(leadId).lean();
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    const eligible = isEligibleForCampaign(lead as never);
    const recipient = resolveRecipient(lead as never, lead as never);
    successResponse(res, 'Eligibility check completed', {
      leadId,
      eligible,
      recipient,
    });
  },

  applyOutcome: async (req: Request, res: Response): Promise<void> => {
    const { leadId, channel, status, opened, clicked } = req.body as {
      leadId: string;
      channel: string;
      status: string;
      opened?: boolean;
      clicked?: boolean;
    };
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    const outcome = {
      leadId,
      channel: channel as 'email' | 'sms' | 'whatsapp',
      status: status as 'sent' | 'delivered' | 'bounced' | 'failed' | 'unsubscribed',
      opened: opened ?? false,
      clicked: clicked ?? false,
      timestamp: new Date(),
    };
    const metricsUpdate = applyDeliveryOutcome(campaign as never, outcome);
    await Campaign.findByIdAndUpdate(req.params.id, { $set: { metrics: { ...campaign.metrics, ...metricsUpdate } } });
    successResponse(res, 'Outcome applied', metricsUpdate);
  },
};
