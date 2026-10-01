import { Router } from 'express';
import { propertyController } from '../controllers';
import { apiRateLimiter, asyncHandler, authenticate, validate } from '../middleware';
import { createPropertySchema, updatePropertySchema } from '../validators';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/', asyncHandler(propertyController.list));
router.post('/', validate({ body: createPropertySchema }), asyncHandler(propertyController.create));
router.get('/search', asyncHandler(propertyController.search));
router.get('/nearby', asyncHandler(propertyController.nearby));
router.get('/stats', asyncHandler(propertyController.stats));
router.get('/trending', asyncHandler(propertyController.trending));
router.get('/areas', asyncHandler(propertyController.areas));
router.get('/price-trends', asyncHandler(propertyController.priceTrends));
router.get('/similar/:id', asyncHandler(propertyController.similar));
router.get('/:id', asyncHandler(propertyController.getById));
router.put(
  '/:id',
  validate({ body: updatePropertySchema }),
  asyncHandler(propertyController.update),
);
router.delete('/:id', asyncHandler(propertyController.remove));

export default router;
