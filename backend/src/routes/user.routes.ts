import { Router } from 'express';
import { userController } from '../controllers';
import { apiRateLimiter, asyncHandler, authenticate, authorize } from '../middleware';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/agents', asyncHandler(userController.agents));
router.get('/', authorize('admin'), asyncHandler(userController.list));
router.post('/', authorize('admin'), asyncHandler(userController.create));
router.get('/:id', asyncHandler(userController.getById));
router.put('/:id', asyncHandler(userController.update));
router.delete('/:id', asyncHandler(userController.remove));
router.patch('/:id/activate', authorize('admin', 'manager'), asyncHandler(userController.activate));
router.patch(
  '/:id/deactivate',
  authorize('admin', 'manager'),
  asyncHandler(userController.deactivate),
);
router.get('/:id/performance', asyncHandler(userController.performance));
router.get('/:id/metrics', asyncHandler(userController.computeMetrics));

export default router;
