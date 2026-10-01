import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils';
import type { TokenPayload } from '../types';
import { setCurrentTenant } from '../tenants/storage';

export const extractAccessToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const accessCookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('access_token='));
  if (accessCookie) {
    try {
      return decodeURIComponent(accessCookie.slice('access_token='.length));
    } catch {
      return null;
    }
  }
  return null;
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }
    req.user = verifyAccessToken(token);
    const tenantId = req.user.tenantId ?? 'default';
    if (req.tenant?.tenantId !== 'default' && req.tenant?.tenantId !== tenantId) {
      throw new ForbiddenError('Token does not grant access to the requested tenant');
    }
    setCurrentTenant(tenantId);
    req.tenant = { tenantId };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractAccessToken(req);
    if (token) {
      req.user = verifyAccessToken(token);
    }
    next();
  } catch {
    next();
  }
};

export const authorize =
  (...roles: TokenPayload['role'][]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient role'));
      return;
    }
    next();
  };

export const checkPermission =
  (...permissions: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    const hasPermissions = permissions.every((permission) =>
      req.user?.permissions.includes(permission),
    );
    if (!hasPermissions) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};
