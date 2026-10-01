import { redisClient } from '../config';
import { logger } from '../utils';

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redisClient.status !== 'ready') return null;
      const value = await redisClient.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      logger.warn('Cache get failed', { key, error });
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      if (redisClient.status !== 'ready') return;
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      logger.warn('Cache set failed', { key, error });
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (redisClient.status !== 'ready') return;
      await redisClient.del(key);
    } catch (error) {
      logger.warn('Cache delete failed', { key, error });
    }
  },
};
