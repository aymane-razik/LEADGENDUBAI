import { webhookDispatcher, type WebhookSubscription } from '../../../src/webhooks/dispatcher';

describe('webhook dispatcher', () => {
  const subscription: WebhookSubscription = {
    id: 'sub-1',
    tenantId: 'default',
    url: 'https://example.com/hooks',
    secret: 'test-secret-123',
    events: ['lead.created', 'lead.assigned'],
    active: true,
    createdAt: new Date(),
  };

  it('signs payload deterministically', () => {
    const payload = JSON.stringify({ id: 'evt-1', type: 'lead.created' });
    const sig1 = webhookDispatcher.signPayload(subscription, payload);
    const sig2 = webhookDispatcher.signPayload(subscription, payload);
    expect(sig1).toBe(sig2);
    expect(sig1.length).toBeGreaterThan(0);
  });

  it('signing differs for different secrets', () => {
    const payload = JSON.stringify({ id: 'evt-1' });
    const other = { ...subscription, secret: 'other-secret' };
    expect(webhookDispatcher.signPayload(subscription, payload)).not.toBe(
      webhookDispatcher.signPayload(other, payload),
    );
  });

  it('computeBackoff grows exponentially up to max', () => {
    expect(webhookDispatcher.computeBackoff(0)).toBe(1000);
    expect(webhookDispatcher.computeBackoff(1)).toBe(2000);
    expect(webhookDispatcher.computeBackoff(5)).toBe(32000);
    expect(webhookDispatcher.computeBackoff(6)).toBe(60000);
    expect(webhookDispatcher.computeBackoff(10)).toBe(60000);
  });

  it('shouldRetry handles failure with next retry', () => {
    const delivery = {
      id: 'whd-1',
      subscriptionId: 'sub-1',
      eventId: 'evt-1',
      eventType: 'lead.created',
      attempt: 1,
      status: 'failed',
      errorMessage: 'timeout',
      nextRetryAt: new Date(Date.now() + 1000),
      createdAt: new Date(),
    } as const;
    expect(webhookDispatcher.shouldRetry(delivery)).toBe(true);
  });

  it('shouldRetry returns false for delivered', () => {
    const delivery = {
      id: 'whd-1',
      subscriptionId: 'sub-1',
      eventId: 'evt-1',
      eventType: 'lead.created',
      attempt: 1,
      status: 'delivered',
      deliveredAt: new Date(),
      createdAt: new Date(),
    } as const;
    expect(webhookDispatcher.shouldRetry(delivery)).toBe(false);
  });
});
