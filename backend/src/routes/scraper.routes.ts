import { Router } from 'express';
import { scraperController } from '../controllers';
import { apiRateLimiter, asyncHandler, authenticate } from '../middleware';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/', asyncHandler(scraperController.list));
router.get('/:id', asyncHandler(scraperController.getById));
router.put('/:id', asyncHandler(scraperController.update));
router.post('/:id/run', asyncHandler(scraperController.run));

export default router;
