import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../utils';

const redact = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  const copy = { ...(obj as Record<string, unknown>) };
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'authorization'];
  for (const field of sensitiveFields) {
    if (field in copy) {
      copy[field] = '[REDACTED]';
    }
  }
  return copy;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();
  req.requestId = randomUUID();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const payload = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userId: req.user?.userId,
      body: redact(req.body),
      query: redact(req.query),
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP request completed', payload);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP request completed', payload);
    } else {
      logger.info('HTTP request completed', payload);
    }
  });

  next();
};
