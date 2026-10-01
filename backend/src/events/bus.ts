import type { EventEnvelope, AnyEventEnvelope } from './types';
import { logger } from '../utils';

export type EventHandler<TEvent extends string, TPayload> = (
  envelope: EventEnvelope<TEvent, TPayload>,
) => Promise<void> | void;

export type EventHandlerAny = (envelope: AnyEventEnvelope) => Promise<void> | void;

export interface SubscriberEntry<TEvent extends string, TPayload> {
  readonly event: TEvent;
  readonly handler: EventHandler<TEvent, TPayload>;
  readonly ordered: boolean;
}

export interface EventBusOptions {
  readonly ordered?: boolean;
}

export class EventBus {
  private subscribers = new Map<string, Set<SubscriberEntry<string, unknown>>>();
  private globalHandlers = new Set<EventHandlerAny>();

  subscribe<TEvent extends string, TPayload = unknown>(
    event: TEvent,
    handler: EventHandler<TEvent, TPayload>,
    options?: { ordered?: boolean },
  ): void {
    const entry: SubscriberEntry<string, unknown> = {
      event,
      handler: handler as EventHandlerAny,
      ordered: options?.ordered ?? false,
    };
    const handlers = this.subscribers.get(event) ?? new Set();
    handlers.add(entry);
    this.subscribers.set(event, handlers);
  }

  subscribeGlobal(handler: EventHandlerAny): void {
    this.globalHandlers.add(handler);
  }

  unsubscribeGlobal(handler: EventHandlerAny): void {
    this.globalHandlers.delete(handler);
  }

  async emit<TEvent extends string, TPayload>(
    eventType: TEvent,
    payload: TPayload,
    options: {
      tenantId: string;
      correlationId: string;
      causationId?: string;
      actor?: string;
      source?: string;
      version?: number;
    },
  ): Promise<void> {
    const envelope: EventEnvelope<TEvent, TPayload> = {
      eventId: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      occurredAt: new Date(),
      eventType,
      version: options.version ?? 1,
      tenantId: options.tenantId,
      correlationId: options.correlationId,
      causationId: options.causationId,
      payload,
      actor: options.actor,
      source: options.source,
    };

    const handlers = this.subscribers.get(eventType) ?? new Set();
    const ordered = Array.from(handlers).filter((h) => h.ordered);
    const unordered = Array.from(handlers).filter((h) => !h.ordered);

    for (const handler of unordered) {
      try {
        await handler.handler(envelope as AnyEventEnvelope);
      } catch (error) {
        logger.error('Event subscriber failed', { eventType, eventId: envelope.eventId, error });
      }
    }

    for (const handler of ordered) {
      try {
        await handler.handler(envelope as AnyEventEnvelope);
      } catch (error) {
        logger.error('Ordered event subscriber failed', { eventType, eventId: envelope.eventId, error });
      }
    }

    for (const handler of this.globalHandlers) {
      try {
        await handler(envelope);
      } catch (error) {
        logger.error('Global event subscriber failed', { eventType, eventId: envelope.eventId, error });
      }
    }
  }
}

export const eventBus = new EventBus();

export const createChildBus = (): EventBus => new EventBus();
