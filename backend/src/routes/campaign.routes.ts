import { Router } from 'express';
import { campaignController } from '../controllers';
import { apiRateLimiter, asyncHandler, authenticate } from '../middleware';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/', asyncHandler(campaignController.list));
router.post('/', asyncHandler(campaignController.create));
router.get('/:id', asyncHandler(campaignController.getById));
router.put('/:id', asyncHandler(campaignController.update));
router.delete('/:id', asyncHandler(campaignController.remove));
router.post('/:id/start', asyncHandler(campaignController.start));
router.post('/:id/pause', asyncHandler(campaignController.pause));
router.post('/:id/resume', asyncHandler(campaignController.resume));
router.get('/:id/recipients', asyncHandler(campaignController.recipients));
router.get('/:id/analytics', asyncHandler(campaignController.analytics));
router.post('/:id/test', asyncHandler(campaignController.test));
router.get('/:id/drip-schedule', asyncHandler(campaignController.dripSchedule));
router.post('/:id/eligibility-check', asyncHandler(campaignController.eligibilityCheck));
router.post('/:id/outcome', asyncHandler(campaignController.applyOutcome));

export default router;
