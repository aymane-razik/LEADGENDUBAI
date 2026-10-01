import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request } from 'express';
import { env, redisClient } from '../config';

const getKeyGenerator = (req: Request): string => {
  const userId = req.user?.userId;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return userId ? `u:${userId}` : `ip:${ip}`;
};

const createStore = (namespace: string): RedisStore | undefined => {
  if (redisClient.status !== 'ready') {
    return undefined;
  }
  return new RedisStore({
    sendCommand: (...args: string[]) =>
      redisClient.call(args[0] as string, ...args.slice(1)) as Promise<number | string>,
    // Each limiter owns a separate counter space. Reusing one Redis prefix caused
    // the broad API quota and strict login quota to overwrite each other's state.
    prefix: `rl:${namespace}:`,
  });
};

const createLimiter = (namespace: string, windowMs: number, max: number) => {
  const store = createStore(namespace);
  const options: Parameters<typeof rateLimit>[0] = {
    windowMs,
    max,
    keyGenerator: getKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      error: {
        code: 'TOO_MANY_REQUESTS',
      },
    },
    skipFailedRequests: false,
  };

  if (store) {
    options.store = store;
  }

  return rateLimit(options);
};

export const authRateLimiter = createLimiter('auth', 60_000, 5);
export const apiRateLimiter = createLimiter('api', env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX_REQUESTS);
export const scrapingRateLimiter = createLimiter('scrape', 60_000, 10);
