import Redis from 'ioredis';
import { env } from './environment';
import { logger } from '../utils';

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: 2,
  lazyConnect: true,
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

redisClient.on('error', (error: Error) => {
  logger.error('Redis error', { error: error.message });
});

export const connectRedis = async (): Promise<void> => {
  if (redisClient.status !== 'ready') {
    await redisClient.connect();
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.status === 'ready') {
    await redisClient.quit();
  }
};
