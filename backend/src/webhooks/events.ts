import { eventBus } from '../events/bus';
import { enqueueJob } from '../queues/registry';
import { runWithTenant } from '../tenants/storage';
import { logger } from '../utils';

let registered = false;

export const registerWebhookEventDelivery = (): void => {
  if (registered) return;
  registered = true;
  eventBus.subscribeGlobal(async (envelope) => {
    await runWithTenant({ tenantId: envelope.tenantId }, async () => {
      const { WebhookSubscriptionModel } = await import('../models');
      const subscriptions = await WebhookSubscriptionModel.find({ active: true, events: envelope.eventType }).lean();
      for (const subscription of subscriptions) {
        try {
          await enqueueJob('webhook:deliver', {
            tenantId: envelope.tenantId,
            correlationId: envelope.correlationId,
            subscriptionId: String(subscription._id),
            eventId: envelope.eventId,
            eventType: envelope.eventType,
            eventPayload: envelope.payload,
          }, {
            jobId: `webhook-${envelope.eventId}-${String(subscription._id)}`,
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
          });
        } catch (error) {
          logger.error('Failed to enqueue webhook delivery from the persisted event', {
            tenantId: envelope.tenantId,
            subscriptionId: String(subscription._id),
            eventId: envelope.eventId,
            error,
          });
          throw error;
        }
      }
    });
  });
};
