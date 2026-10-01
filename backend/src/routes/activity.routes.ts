import { Router } from 'express';
import { activityController } from '../controllers';
import { apiRateLimiter, asyncHandler, authenticate } from '../middleware';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/', asyncHandler(activityController.list));
router.post('/', asyncHandler(activityController.create));
router.get('/upcoming', asyncHandler(activityController.upcoming));
router.get('/overdue', asyncHandler(activityController.overdue));
router.get('/:id', asyncHandler(activityController.getById));
router.put('/:id', asyncHandler(activityController.update));
router.delete('/:id', asyncHandler(activityController.remove));
router.patch('/:id/complete', asyncHandler(activityController.complete));

export default router;
