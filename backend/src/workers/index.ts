import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { env } from '../config';
import { runWithTenant } from '../tenants/storage';
import { logger } from '../utils';
import type { JobPayload } from '../queues/registry';

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null,
};

const handleJob = async (job: Job<JobPayload>): Promise<void> => {
  const tenantId = job.data.tenantId;
  if (!tenantId) throw new Error(`Job ${job.name} is missing tenantId`);

  await runWithTenant({ tenantId }, async () => {
    switch (job.name) {
      case 'lead:enrichment': {
        const { Lead } = await import('../models');
        const { cacheService } = await import('../services/cache.service');
        const leadId = String(job.data.leadId ?? '');
        if (!leadId) throw new Error('leadId is required');
        const enrichment = (job.data.enrichmentData ?? {}) as Record<string, unknown>;
        if (Object.keys(enrichment).length === 0) {
          throw new Error('No enrichment provider or enrichment data was supplied; lead was not marked enriched');
        }
        const lead = await Lead.findById(leadId);
        if (!lead) throw new Error('Lead not found');
        lead.enriched = true;
        lead.enrichmentData = {
          ...(lead.enrichmentData ?? {}),
          ...enrichment,
        } as typeof lead.enrichmentData;
        await lead.save();
        await cacheService.del(`tenant:${tenantId}:leads:stats`);
        logger.info('Lead enrichment job completed', { leadId, tenantId, jobId: job.id });
        return;
      }
      case 'analytics:refresh': {
        const { analyticsMaterialized } = await import('../domain/registry');
        await analyticsMaterialized.refresh(tenantId);
        return;
      }
      case 'campaign:dispatch':
        throw new Error('Campaign delivery provider is not configured; dispatch was not performed');
      case 'webhook:deliver': {
        const { decrypt } = await import('../utils');
        const { WebhookDeliveryModel, WebhookSubscriptionModel } = await import('../models');
        const { webhookDispatcher } = await import('../webhooks/dispatcher');
        const subscriptionId = String(job.data.subscriptionId ?? '');
        const subscription = await WebhookSubscriptionModel.findById(subscriptionId).select('+encryptedSecret');
        if (!subscription || !subscription.active) return;
        const delivery = await webhookDispatcher.deliver({
          id: subscription._id.toString(), tenantId, url: subscription.url,
          secret: decrypt(subscription.encryptedSecret), events: subscription.events,
          active: subscription.active, createdAt: subscription.createdAt,
        }, String(job.data.eventId ?? ''), String(job.data.eventType ?? ''), job.data.eventPayload, job.attemptsMade + 1);
        await WebhookDeliveryModel.create({
          deliveryId: delivery.id, subscriptionId: delivery.subscriptionId, eventId: delivery.eventId,
          eventType: delivery.eventType, attempt: delivery.attempt, status: delivery.status,
          responseStatus: delivery.responseStatus, errorMessage: delivery.errorMessage,
          nextRetryAt: delivery.nextRetryAt, deliveredAt: delivery.deliveredAt,
        });
        if (delivery.status === 'failed' && delivery.nextRetryAt) throw new Error(delivery.errorMessage ?? 'Webhook delivery failed');
        return;
      }
      case 'scraper:run':
        if ((job.attemptsMade + 1) >= (job.opts.attempts ?? 1)) {
          const { Scraper } = await import('../models');
          const scraper = await Scraper.findById(String(job.data.scraperId ?? ''));
          if (scraper) {
            const now = new Date();
            scraper.status = 'error';
            scraper.lastRun = {
              startedAt: now,
              completedAt: now,
              duration: 0,
              itemsFound: 0,
              itemsProcessed: 0,
              itemsCreated: 0,
              itemsUpdated: 0,
              itemsSkipped: 0,
              errors: [{ message: 'No scraper adapter is configured for this source', count: 1, lastOccurred: now }],
              status: 'failed',
            };
            scraper.metrics.totalRuns += 1;
            scraper.metrics.failedRuns += 1;
            scraper.metrics.successRate = scraper.metrics.successfulRuns / Math.max(1, scraper.metrics.totalRuns);
            await scraper.save();
            logger.warn('Scraper run recorded as failed because its provider adapter is unavailable', {
              scraperId: scraper.id,
              tenantId,
              jobId: job.id,
            });
          }
        }
        throw new Error('No scraper adapter is configured for this source; run was not performed');
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  });
};

export const createWorker = (): Worker<JobPayload> => {
  const worker = new Worker<JobPayload>('leadgen', handleJob, {
    connection,
    concurrency: 5,
  });
  worker.on('completed', (job) => logger.info('Background job completed', { jobId: job.id, name: job.name }));
  worker.on('failed', (job, error) => logger.error('Background job failed', {
    jobId: job?.id,
    name: job?.name,
    error: error.message,
  }));
  worker.on('error', (error) => logger.error('Worker connection error', { error: error.message }));
  return worker;
};
