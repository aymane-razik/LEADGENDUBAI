import { Router } from 'express';
import crypto from 'node:crypto';
import type { FilterQuery } from 'mongoose';
import { WebhookDeliveryModel, WebhookSubscriptionModel, type IWebhookSubscription } from '../models';
import { webhookDispatcher, resolvePublicWebhookAddress } from '../webhooks/dispatcher';
import { asyncHandler, authenticate, apiRateLimiter } from '../middleware';
import { decrypt, encrypt, NotFoundError, successResponse, ValidationError } from '../utils';

const router = Router();
router.use(authenticate, apiRateLimiter);

const allowedEvents = new Set([
  'lead.created', 'lead.updated', 'lead.deleted', 'lead.status_changed', 'lead.assigned', 'lead.merged', 'lead.enriched',
  'property.scraped', 'property.updated', 'campaign.message_dispatched', 'campaign.batch_dispatched',
  'scraper.run_completed', 'scraper.run_failed',
]);

const safeSubscription = (subscription: IWebhookSubscription) => ({
  id: subscription._id.toString(),
  tenantId: subscription.tenantId,
  url: subscription.url,
  events: subscription.events,
  active: subscription.active,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
});

const findSubscription = async (id: string, includeSecret = false): Promise<IWebhookSubscription> => {
  const query = WebhookSubscriptionModel.findById(id);
  if (includeSecret) query.select('+encryptedSecret');
  const subscription = await query;
  if (!subscription) throw new NotFoundError('Webhook subscription not found');
  return subscription;
};

const validatePayload = async (body: Record<string, unknown>, partial = false) => {
  const url = body.url;
  const events = body.events;
  const secret = body.secret;
  const active = body.active;
  if (!partial || url !== undefined) {
    if (typeof url !== 'string' || url.length > 2048) throw new ValidationError('A valid HTTPS endpoint URL is required');
    const demoSink = process.env.DEMO_MODE === 'true' && (() => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname.endsWith('.invalid');
      } catch { return false; }
    })();
    if (!demoSink) {
      try { await resolvePublicWebhookAddress(url); } catch (error) { throw new ValidationError(error instanceof Error ? error.message : 'Webhook destination is not allowed'); }
    }
  }
  if (!partial || events !== undefined) {
    if (!Array.isArray(events) || events.length < 1 || events.length > 25 || events.some((event) => typeof event !== 'string' || !allowedEvents.has(event))) {
      throw new ValidationError('Select one or more supported webhook events');
    }
  }
  if (!partial || secret !== undefined) {
    if (typeof secret !== 'string' || secret.length < 24 || secret.length > 256) throw new ValidationError('Signing secrets must be between 24 and 256 characters');
  }
  if (active !== undefined && typeof active !== 'boolean') throw new ValidationError('active must be a boolean');
};

router.get('/', asyncHandler(async (req, res) => {
  const filter: FilterQuery<IWebhookSubscription> = {};
  const items = await WebhookSubscriptionModel.find(filter).sort({ createdAt: -1 }).lean();
  successResponse(res, 'Webhook subscriptions fetched', items.map((item) => ({
    id: String(item._id), tenantId: item.tenantId, url: item.url, events: item.events,
    active: item.active, createdAt: item.createdAt, updatedAt: item.updatedAt,
  })));
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body as Record<string, unknown>;
  await validatePayload(body);
  const demoSink = process.env.DEMO_MODE === 'true' && (() => {
    try { const parsed = new URL(String(body.url)); return parsed.hostname.endsWith('.invalid'); } catch { return false; }
  })();
  const subscription = await WebhookSubscriptionModel.create({
    url: body.url,
    encryptedSecret: encrypt(body.secret as string),
    events: body.events,
    active: demoSink ? false : (body.active ?? true),
    createdBy: req.user?.userId,
  });
  res.status(201);
  successResponse(res, 'Webhook subscription created', { ...safeSubscription(subscription), secret: body.secret });
}));

router.get('/:id/deliveries', asyncHandler(async (req, res) => {
  const subscription = await findSubscription(req.params.id);
  const deliveries = await WebhookDeliveryModel.find({ subscriptionId: subscription._id.toString() })
    .sort({ createdAt: -1 }).limit(100).lean();
  successResponse(res, 'Webhook deliveries fetched', deliveries.map((item) => ({
    id: item.deliveryId, subscriptionId: item.subscriptionId, eventId: item.eventId,
    eventType: item.eventType, attempt: item.attempt, status: item.status,
    responseStatus: item.responseStatus, errorMessage: item.errorMessage,
    nextRetryAt: item.nextRetryAt, createdAt: item.createdAt, deliveredAt: item.deliveredAt,
  })));
}));

router.post('/:id/test', asyncHandler(async (req, res) => {
  const subscription = await findSubscription(req.params.id, true);
  const demoMode = process.env.DEMO_MODE === 'true';
  const delivery = demoMode ? {
    id: crypto.randomUUID(),
    subscriptionId: subscription._id.toString(),
    eventId: crypto.randomUUID(),
    eventType: 'webhook.test',
    attempt: 1,
    status: 'delivered' as const,
    responseStatus: 200,
    errorMessage: 'Demo simulation only; no outbound request was made.',
    nextRetryAt: null,
    deliveredAt: new Date(),
  } : await webhookDispatcher.deliver({
    id: subscription._id.toString(), tenantId: subscription.tenantId, url: subscription.url,
    secret: decrypt(subscription.encryptedSecret), events: subscription.events, active: subscription.active,
    createdAt: subscription.createdAt,
  }, crypto.randomUUID(), 'webhook.test', { message: 'Dune webhook endpoint verification' });
  const record = await WebhookDeliveryModel.create({
    deliveryId: delivery.id, subscriptionId: delivery.subscriptionId, eventId: delivery.eventId,
    eventType: delivery.eventType, attempt: delivery.attempt, status: delivery.status,
    responseStatus: delivery.responseStatus, errorMessage: delivery.errorMessage,
    nextRetryAt: delivery.nextRetryAt, deliveredAt: delivery.deliveredAt,
  });
  res.status(delivery.status === 'delivered' ? 200 : 502);
  successResponse(res, demoMode ? 'Demo webhook test simulated. No outbound request was made.' : delivery.status === 'delivered' ? 'Webhook endpoint responded successfully' : 'Webhook endpoint delivery failed', {
    id: record.deliveryId, status: record.status, responseStatus: record.responseStatus, errorMessage: record.errorMessage,
    simulated: demoMode,
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  successResponse(res, 'Webhook subscription fetched', safeSubscription(await findSubscription(req.params.id)));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const subscription = await findSubscription(req.params.id);
  const body = req.body as Record<string, unknown>;
  await validatePayload(body, true);
  if (body.url !== undefined) subscription.url = body.url as string;
  if (body.events !== undefined) subscription.events = body.events as string[];
  if (body.active !== undefined) subscription.active = body.active as boolean;
  if (body.secret !== undefined) subscription.encryptedSecret = encrypt(body.secret as string);
  await subscription.save();
  successResponse(res, 'Webhook subscription updated', safeSubscription(subscription));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const subscription = await findSubscription(req.params.id);
  await subscription.deleteOne();
  successResponse(res, 'Webhook subscription deleted', { id: req.params.id });
}));

export default router;
