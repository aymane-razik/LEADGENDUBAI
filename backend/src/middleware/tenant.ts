import type { NextFunction, Request, Response } from 'express';
import { TENANT_ID_HEADER, type TenantContext } from '../tenants/context';
import { runWithTenant } from '../tenants/storage';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      correlationId?: string;
    }
  }
}

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Tenant selection comes from a verified access token in authenticate(),
  // never from caller-controlled headers. This phase supports one tenant.
  const tenant: TenantContext = { tenantId: 'default' };
  const requestedTenant = req.headers[TENANT_ID_HEADER.toLowerCase()];
  if (typeof requestedTenant === 'string' && requestedTenant !== tenant.tenantId) {
    res.status(403).json({
      success: false,
      message: 'Tenant selection is not available for this account',
      error: { code: 'TENANT_FORBIDDEN' },
    });
    return;
  }
  req.tenant = tenant;
  runWithTenant(tenant, next);
};

export const correlationMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const incoming = req.headers['x-correlation-id'] as string | undefined;
  req.correlationId = incoming ?? `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  next();
};
