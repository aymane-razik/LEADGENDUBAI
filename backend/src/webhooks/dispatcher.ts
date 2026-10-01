import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import https from 'node:https';
import net from 'node:net';
import { logger } from '../utils';

export interface WebhookSubscription {
  readonly id: string;
  readonly tenantId: string;
  readonly url: string;
  readonly secret: string;
  readonly events: string[];
  readonly active: boolean;
  readonly createdAt: Date;
}

export interface WebhookDelivery {
  readonly id: string;
  readonly subscriptionId: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly attempt: number;
  readonly status: 'pending' | 'delivered' | 'failed';
  readonly responseStatus?: number;
  readonly errorMessage?: string;
  readonly nextRetryAt?: Date;
  readonly createdAt: Date;
  readonly deliveredAt?: Date;
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60_000;

const ipv4ToInt = (address: string): number => address.split('.').reduce((result, part) => ((result << 8) | Number(part)) >>> 0, 0);
const ipv4IsPublic = (address: string): boolean => {
  const value = ipv4ToInt(address);
  const privateNetworks: Array<[string, number]> = [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
    ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
    ['224.0.0.0', 4], ['240.0.0.0', 4],
  ];
  return privateNetworks.every(([network, prefix]) => {
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (value & mask) !== (ipv4ToInt(network) & mask);
  });
};

const addressIsPublic = (address: string): boolean => {
  const version = net.isIP(address);
  if (version === 4) return ipv4IsPublic(address);
  if (version !== 6) return false;
  const normalized = address.toLowerCase().split('%')[0];
  // Only global-unicast 2000::/3 destinations are accepted. This excludes
  // loopback, mapped IPv4, unique-local, link-local, and multicast ranges.
  return (normalized.startsWith('2') || normalized.startsWith('3')) &&
    !normalized.startsWith('2001:db8:') && !normalized.startsWith('2001:10:');
};

export const resolvePublicWebhookAddress = async (urlValue: string): Promise<{ address: string; family: 4 | 6 }> => {
  let url: URL;
  try { url = new URL(urlValue); } catch { throw new Error('Webhook URL is not valid'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('Webhook URLs must use HTTPS on port 443 without embedded credentials');
  }
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => !addressIsPublic(address))) {
    throw new Error('Webhook destination resolves to a restricted network address');
  }
  const pinned = addresses[0];
  return { address: pinned.address, family: pinned.family as 4 | 6 };
};

const postJson = async (
  urlValue: string,
  pinned: { address: string; family: 4 | 6 },
  body: string,
  headers: Record<string, string>,
): Promise<number> => new Promise((resolve, reject) => {
  const url = new URL(urlValue);
  const request = https.request(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Length': Buffer.byteLength(body).toString() },
    timeout: 10_000,
    maxHeaderSize: 16 * 1024,
    lookup: ((_hostname: string, _options: unknown, callback: (...args: unknown[]) => void) => {
      callback(null, pinned.address, pinned.family);
    }) as never,
  }, (response) => {
    response.resume();
    resolve(response.statusCode ?? 0);
  });
  request.on('timeout', () => request.destroy(new Error('Webhook request timed out')));
  request.on('error', reject);
  request.end(body);
});

export const webhookDispatcher = {
  signPayload(subscription: WebhookSubscription, payload: string): string {
    return crypto.createHmac('sha256', subscription.secret).update(payload, 'utf8').digest('hex');
  },

  async deliver(
    subscription: WebhookSubscription,
    eventId: string,
    eventType: string,
    payload: unknown,
    attempt = 1,
  ): Promise<WebhookDelivery> {
    const createdAt = new Date();
    const deliveryId = `whd_${crypto.randomUUID()}`;
    const body = JSON.stringify({ id: eventId, type: eventType, tenantId: subscription.tenantId, occurredAt: createdAt.toISOString(), data: payload });
    if (Buffer.byteLength(body) > 256 * 1024) throw new Error('Webhook event payload exceeds 256 KB');
    try {
      const pinned = await resolvePublicWebhookAddress(subscription.url);
      const responseStatus = await postJson(subscription.url, pinned, body, {
        'Content-Type': 'application/json',
        'User-Agent': 'Dune-Webhook/1.0',
        'X-Webhook-Signature': `sha256=${this.signPayload(subscription, body)}`,
        'X-Webhook-Event': eventType,
        'X-Webhook-Id': eventId,
        'X-Webhook-Tenant': subscription.tenantId,
      });
      if (responseStatus < 200 || responseStatus >= 300) throw Object.assign(new Error(`Remote endpoint returned HTTP ${responseStatus}`), { responseStatus });
      return { id: deliveryId, subscriptionId: subscription.id, eventId, eventType, attempt, status: 'delivered', responseStatus, createdAt, deliveredAt: new Date() };
    } catch (error) {
      const responseStatus = error && typeof error === 'object' && 'responseStatus' in error ? Number(error.responseStatus) : undefined;
      const nextRetryAt = attempt < MAX_RETRIES ? new Date(Date.now() + Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1))) : undefined;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Webhook delivery failed', { subscriptionId: subscription.id, eventId, eventType, attempt, error: errorMessage });
      return { id: deliveryId, subscriptionId: subscription.id, eventId, eventType, attempt, status: 'failed', responseStatus, errorMessage, nextRetryAt, createdAt };
    }
  },

  shouldRetry(delivery: WebhookDelivery): boolean {
    return delivery.status === 'failed' && delivery.nextRetryAt !== undefined;
  },

  computeBackoff(attempt: number): number {
    return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1));
  },
};
