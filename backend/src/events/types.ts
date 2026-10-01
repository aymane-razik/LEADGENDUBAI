export interface EventEnvelope<TEvent extends string, TPayload> {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: TEvent;
  readonly version: number;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly payload: TPayload;
  readonly actor?: string;
  readonly source?: string;
}

export type AnyEventEnvelope = EventEnvelope<string, unknown>;

export interface OutboxEventRecord {
  readonly id: string;
  readonly eventType: string;
  readonly version: number;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly payload: string;
  readonly actor?: string;
  readonly source?: string;
  readonly status: 'pending' | 'processing' | 'delivered' | 'failed';
  readonly attempts: number;
  readonly nextRetryAt?: Date;
  readonly deliveredAt?: Date;
  readonly errorMessage?: string;
  readonly createdAt: Date;
}

export const EVENT_TENANT_KEY = 'tenantId';
export const EVENT_CORRELATION_KEY = 'correlationId';
export const EVENT_CAUSATION_KEY = 'causationId';
export const EVENT_ACTOR_KEY = 'actor';

export const generateCorrelationId = (): string =>
  `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const generateEventId = (): string =>
  `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
