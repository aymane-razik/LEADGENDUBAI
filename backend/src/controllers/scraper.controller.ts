import type { Request, Response } from 'express';
import { Scraper } from '../models';
import { enqueueJob } from '../queues/registry';
import { successResponse } from '../utils';
import { generateCorrelationId } from '../events/types';

export const scraperController = {
  list: async (_req: Request, res: Response): Promise<void> => {
    const items = await Scraper.find().lean();
    successResponse(res, 'Scrapers fetched', items);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const item = await Scraper.findById(req.params.id).lean();
    if (!item) {
      res.status(404).json({ success: false, message: 'Data stream not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    successResponse(res, 'Scraper fetched', item);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const scraper = await Scraper.findById(req.params.id);
    if (!scraper) {
      res.status(404).json({ success: false, message: 'Data stream not found', error: { code: 'NOT_FOUND' } });
      return;
    }
    const { name, schedule, timezone, enabled, url } = req.body as {
      name?: unknown; schedule?: unknown; timezone?: unknown; enabled?: unknown; url?: unknown;
    };
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
        res.status(400).json({ success: false, message: 'Name must contain 2 to 100 characters', error: { code: 'VALIDATION_ERROR' } });
        return;
      }
      scraper.name = name.trim();
    }
    if (schedule !== undefined) {
      if (typeof schedule !== 'string' || schedule.length > 80) {
        res.status(400).json({ success: false, message: 'Schedule must be a valid cron expression', error: { code: 'VALIDATION_ERROR' } });
        return;
      }
      scraper.schedule = schedule;
    }
    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || timezone.length > 80) {
        res.status(400).json({ success: false, message: 'Timezone is invalid', error: { code: 'VALIDATION_ERROR' } });
        return;
      }
      scraper.timezone = timezone;
    }
    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') {
        res.status(400).json({ success: false, message: 'enabled must be a boolean', error: { code: 'VALIDATION_ERROR' } });
        return;
      }
      scraper.enabled = enabled;
      scraper.status = enabled ? 'idle' : 'paused';
    }
    if (url !== undefined) {
      if (typeof url !== 'string' || !/^https:\/\//i.test(url)) {
        res.status(400).json({ success: false, message: 'Source URL must use HTTPS', error: { code: 'VALIDATION_ERROR' } });
        return;
      }
      scraper.config.url = url;
    }
    scraper.updatedBy = req.user?.userId as never;
    await scraper.save();
    successResponse(res, 'Data stream updated', scraper);
  },

  run: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string | undefined;
    if (!id) {
      res.status(400).json({ success: false, message: 'scraper id is required', error: { code: 'VALIDATION_ERROR' } });
      return;
    }
    const scraper = await Scraper.findById(id);
    if (!scraper || !scraper.isActive || !scraper.enabled) {
      res.status(scraper ? 409 : 404).json({ success: false, message: scraper ? 'Scraper is disabled' : 'Scraper not found' });
      return;
    }
    if (process.env.DEMO_MODE === 'true') {
      const now = new Date();
      const itemCount = 4 + (Number.parseInt(id.slice(-2), 16) % 7);
      const duration = 760 + (Number.parseInt(id.slice(-4, -2), 16) % 940);
      scraper.status = 'idle';
      scraper.lastRun = {
        startedAt: new Date(now.getTime() - duration),
        completedAt: now,
        duration,
        itemsFound: itemCount,
        itemsProcessed: itemCount,
        itemsCreated: Math.min(3, itemCount),
        itemsUpdated: Math.max(0, itemCount - 3),
        itemsSkipped: 0,
        errors: [],
        status: 'success',
      };
      scraper.metrics.totalRuns += 1;
      scraper.metrics.successfulRuns += 1;
      scraper.metrics.totalItems += itemCount;
      scraper.metrics.avgDuration = Math.round(
        ((scraper.metrics.avgDuration * (scraper.metrics.totalRuns - 1)) + duration) / scraper.metrics.totalRuns,
      );
      scraper.metrics.avgItemsPerRun = Math.round(scraper.metrics.totalItems / scraper.metrics.totalRuns);
      scraper.metrics.successRate = scraper.metrics.successfulRuns / scraper.metrics.totalRuns;
      scraper.metrics.lastSuccessAt = now;
      await scraper.save();
      successResponse(res, 'Demo run simulated successfully. No external source was contacted and no listings were imported.', {
        scraperId: id,
        status: 'success',
        itemsProcessed: itemCount,
        simulated: true,
        noExternalRequests: true,
      });
      return;
    }
    const correlationId = generateCorrelationId();
    const { id: jobId } = await enqueueJob('scraper:run', {
      scraperId: id,
      tenantId: req.tenant?.tenantId ?? 'default',
      correlationId,
    }, { jobId: `scraper:${id}:${Date.now()}` });
    successResponse(res, 'Scraper run started', {
      scraperId: id,
      jobId,
      correlationId,
      status: 'queued',
    });
  },
};
