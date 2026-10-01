import express from 'express';
import { env } from './config';
import { apiRateLimiter, errorHandler, notFoundHandler, requestLogger } from './middleware';
import { tenantMiddleware, correlationMiddleware } from './middleware/tenant';
import routes from './routes';

/** Compatibility adapter: the established Express API remains mounted at /api/v1 during the strangler migration. */
export const createLegacyApi = (): express.Express => {
  const legacy = express();
  legacy.use(express.json({ limit: `${env.MAX_FILE_SIZE}b` }));
  legacy.use(express.urlencoded({ extended: true }));
  legacy.use(requestLogger, tenantMiddleware, correlationMiddleware);
  legacy.use(apiRateLimiter, routes);
  legacy.use(notFoundHandler, errorHandler);
  return legacy;
};
