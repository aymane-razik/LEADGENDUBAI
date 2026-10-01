// Outbox helpers: record factory for building outbox insert payloads.

export interface OutboxRecordOptions {
  eventType: string;
  version: number;
  tenantId: string;
  correlationId: string;
  causationId?: string;
  actor?: string;
  source?: string;
}

export const createOutboxRecord = (
  payload: Record<string, unknown>,
  options: OutboxRecordOptions,
) => ({
  eventType: options.eventType,
  version: options.version,
  tenantId: options.tenantId,
  correlationId: options.correlationId,
  causationId: options.causationId,
  payload,
  actor: options.actor,
  source: options.source,
});
