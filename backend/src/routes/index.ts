import { Router } from 'express';
import activityRoutes from './activity.routes';
import authRoutes from './auth.routes';
import campaignRoutes from './campaign.routes';
import healthRoutes from './health.routes';
import leadRoutes from './lead.routes';
import propertyRoutes from './property.routes';
import userRoutes from './user.routes';
import scraperRoutes from './scraper.routes';
import analyticsRoutes from './analytics.routes';
import webhookRoutes from './webhooks.routes';
import outboxRoutes from './outbox.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/properties', propertyRoutes);
router.use('/activities', activityRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/users', userRoutes);
router.use('/scrapers', scraperRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/outbox', outboxRoutes);

export default router;
