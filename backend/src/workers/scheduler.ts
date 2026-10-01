import { enqueueJob, scheduleJob } from '../queues/registry';
import { logger } from '../utils';

const analyticsRefreshIntervalMs = 5 * 60 * 1000;

export const scheduler = {
  async start(): Promise<void> {
    await scheduleJob('analytics:refresh', { tenantId: 'default' }, analyticsRefreshIntervalMs);
    logger.info('Durable recurring jobs registered', {
      queue: 'leadgen',
      jobs: [{ name: 'analytics:refresh', everyMs: analyticsRefreshIntervalMs }],
    });
  },
  async stop(): Promise<void> {
    // BullMQ stores repeat schedules in Redis; stopping the API must not remove them.
  },
  async runAnalyticsRefreshNow(tenantId = 'default'): Promise<string> {
    const { id } = await enqueueJob('analytics:refresh', { tenantId });
    return id;
  },
  status(): { enabled: boolean; jobs: Array<{ name: string; intervalMs: number }> } {
    return {
      enabled: true,
      jobs: [{ name: 'analytics:refresh', intervalMs: analyticsRefreshIntervalMs }],
    };
  },
};
