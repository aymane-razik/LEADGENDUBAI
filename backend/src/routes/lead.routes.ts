import { Router } from 'express';
import { leadController } from '../controllers';
import { apiRateLimiter, asyncHandler, authenticate, validate } from '../middleware';
import {
  assignLeadSchema,
  createLeadSchema,
  deduplicationSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
} from '../validators';

const router = Router();

router.use(authenticate, apiRateLimiter);

router.get('/', asyncHandler(leadController.list));
router.post('/', validate({ body: createLeadSchema }), asyncHandler(leadController.create));
router.get('/stats', asyncHandler(leadController.stats));
router.get('/export', asyncHandler(leadController.export));
router.post('/import', asyncHandler(leadController.import));
router.post('/bulk', asyncHandler(leadController.bulkCreate));
router.put('/bulk', asyncHandler(leadController.bulkUpdate));
router.post(
  '/deduplicate',
  validate({ body: deduplicationSchema }),
  asyncHandler(leadController.deduplicate),
);
router.get('/:id/duplicates', asyncHandler(leadController.findDuplicates));
router.post('/:id/enrich/job', asyncHandler(leadController.enrichJob));
router.get('/:id/score/explain', asyncHandler(leadController.scoreExplain));
router.patch('/:id/auto-assign', asyncHandler(leadController.autoAssign));
router.get('/:id', asyncHandler(leadController.getById));
router.put('/:id', validate({ body: updateLeadSchema }), asyncHandler(leadController.update));
router.delete('/:id', asyncHandler(leadController.remove));
router.patch(
  '/:id/status',
  validate({ body: updateLeadStatusSchema }),
  asyncHandler(leadController.updateStatus),
);
router.patch(
  '/:id/assign',
  validate({ body: assignLeadSchema }),
  asyncHandler(leadController.assign),
);
router.patch('/:id/score', asyncHandler(leadController.recalculateScore));
router.post('/:id/enrich', asyncHandler(leadController.enrich));
router.get('/:id/activities', asyncHandler(leadController.getActivities));
router.post('/:id/activities', asyncHandler(leadController.addActivity));
router.get('/:id/timeline', asyncHandler(leadController.timeline));

export default router;
