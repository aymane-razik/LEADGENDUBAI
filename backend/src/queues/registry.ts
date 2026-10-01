import { Queue } from 'bullmq';
import { env } from '../config';

export type JobPayload = Record<string, unknown> & {
  tenantId: string;
  correlationId?: string;
};

let queue: Queue | undefined;

const getQueue = (): Queue => {
  queue ??= new Queue('leadgen', {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      maxRetriesPerRequest: null,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    },
  });
  return queue;
};

export const enqueueJob = async (
  name: string,
  payload: JobPayload,
  options: { jobId?: string; delay?: number; attempts?: number; backoff?: { type: 'exponential'; delay: number } } = {},
): Promise<{ id: string }> => {
  if (!payload.tenantId) throw new Error('tenantId is required for background jobs');
  const job = await getQueue().add(name, payload, options);
  return { id: String(job.id) };
};

export const scheduleJob = async (
  name: string,
  payload: JobPayload,
  every: number,
): Promise<void> => {
  await getQueue().upsertJobScheduler(`repeat:${name}`, { every }, {
    name,
    data: payload,
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
  });
};

export const closeQueue = async (): Promise<void> => {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
};
