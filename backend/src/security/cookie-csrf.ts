import type { NextFunction, Request, Response } from 'express';
import { env } from '../config';

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const hasSessionCookie = (request: Request): boolean => request.headers.cookie
  ?.split(';')
  .some((part) => /^\s*(access_token|refresh_token)=/.test(part)) ?? false;

export const cookieCsrfProtection = (request: Request, response: Response, next: NextFunction): void => {
  if (!mutatingMethods.has(request.method) || !hasSessionCookie(request)) {
    next();
    return;
  }
  if (request.headers.authorization?.startsWith('Bearer ')) {
    next();
    return;
  }
  const allowedOrigin = new URL(env.FRONTEND_URL).origin;
  const origin = request.get('origin');
  if (origin !== allowedOrigin) {
    response.status(403).json({
      success: false,
      message: 'Cookie-authenticated requests must originate from the configured workspace.',
      error: { code: 'CSRF_ORIGIN_REJECTED' },
    });
    return;
  }
  next();
};
