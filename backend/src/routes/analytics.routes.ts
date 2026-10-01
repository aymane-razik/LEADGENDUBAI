import { Router } from 'express';
import { analyticsMaterialized } from '../domain/registry';
import { asyncHandler, authenticate, apiRateLimiter } from '../middleware';
import { successResponse } from '../utils';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await analyticsMaterialized.get(req.tenant?.tenantId ?? 'default');
  successResponse(res, 'Dashboard stats fetched', stats);
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const stats = await analyticsMaterialized.refresh(req.tenant?.tenantId ?? 'default');
  successResponse(res, 'Dashboard stats refreshed', stats);
}));

export default router;
