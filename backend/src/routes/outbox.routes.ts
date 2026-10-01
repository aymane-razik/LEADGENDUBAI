import { Router } from 'express';
import { outboxRepository } from '../domain/registry';
import { asyncHandler, authenticate, apiRateLimiter } from '../middleware';
import { successResponse } from '../utils';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/status', asyncHandler(async (_req, res) => {
  const pending = await outboxRepository.countPending();
  successResponse(res, 'Outbox status fetched', { pending });
}));

export default router;
