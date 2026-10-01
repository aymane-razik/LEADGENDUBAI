import type { NextFunction, Request, Response } from 'express';
import { AppError, errorResponse, InternalServerError, logger } from '../utils';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const normalizedError = err instanceof AppError ? err : new InternalServerError();
  const isProd = process.env.NODE_ENV === 'production';

  logger.error('Request failed', {
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
    statusCode: normalizedError.statusCode,
    code: normalizedError.code,
    details: normalizedError.details,
    message: normalizedError.message,
    stack: isProd ? undefined : normalizedError.stack,
  });

  errorResponse(res, normalizedError.statusCode, normalizedError.message, {
    code: normalizedError.code,
    details: isProd ? undefined : normalizedError.details,
  });
};
