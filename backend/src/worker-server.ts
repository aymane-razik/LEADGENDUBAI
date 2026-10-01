import 'reflect-metadata';
import { connectDatabase, connectRedis, disconnectDatabase, disconnectRedis } from './config';
import { closeQueue } from './queues/registry';
import { createWorker } from './workers';
import { logger } from './utils';

const start = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();
  const worker = createWorker();
  logger.info('Background worker process started', { queue: 'leadgen' });

  let stopping = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (stopping) return;
    stopping = true;
    logger.info('Stopping background workers', { signal });
    await worker.close();
    await closeQueue();
    await Promise.all([disconnectDatabase(), disconnectRedis()]);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

void start().catch((error: unknown) => {
  logger.error('Worker startup failed', { error });
  process.exit(1);
});
