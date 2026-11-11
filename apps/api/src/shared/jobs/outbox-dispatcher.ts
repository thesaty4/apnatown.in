import { Inject, Injectable } from '@nestjs/common';
import type { EventEnvelope } from '@apnatown/shared';
import { IdSchema } from '@apnatown/shared/wire';
import type { Logger } from 'pino';
import { z } from 'zod';
import { withCorrelation } from '../logger/context';
import { RUNTIME_LOGGER } from '../logger/logger';
import { OutboxEventStore } from '../persistence/outbox-event-store';
import type { TxContext } from '../persistence/ports';
import {
  ConsumerOperationSchema,
  EVENT_CONSUMER,
  type ConsumerOperation,
  type EventConsumer,
} from './event-consumer';

export const OUTBOX_HANDLERS = Symbol('OUTBOX_HANDLERS');

export interface OutboxHandler {
  readonly operation: ConsumerOperation;
  expiresAt(event: EventEnvelope): Date;
  handle(tx: TxContext, event: EventEnvelope): Promise<void>;
}

const jobSchema = z.strictObject({ eventId: IdSchema });

@Injectable()
export class OutboxDispatcher {
  private readonly handlers = new Map<string, OutboxHandler[]>();
  readonly handlerCount: number;

  constructor(
    private readonly store: OutboxEventStore,
    @Inject(EVENT_CONSUMER) private readonly consumer: EventConsumer,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
    @Inject(OUTBOX_HANDLERS) registrations: readonly OutboxHandler[],
  ) {
    const identities = new Set<string>();
    for (const registration of registrations) {
      const parsed = ConsumerOperationSchema.safeParse(registration.operation);
      if (
        !parsed.success ||
        typeof registration.expiresAt !== 'function' ||
        typeof registration.handle !== 'function'
      )
        throw new Error('OUTBOX_HANDLER_INVALID');
      const operation = Object.freeze(parsed.data);
      const identity = `${operation.consumer}\0${operation.handler}`;
      if (identities.has(identity)) throw new Error('OUTBOX_HANDLER_DUPLICATE');
      identities.add(identity);
      const key = this.eventKey(operation.eventType, operation.schemaVersion);
      const handlers = this.handlers.get(key) ?? [];
      handlers.push({
        operation,
        expiresAt: (event) => registration.expiresAt(event),
        handle: (tx, event) => registration.handle(tx, event),
      });
      this.handlers.set(key, handlers);
    }
    this.handlerCount = registrations.length;
  }

  async dispatch(jobData: unknown): Promise<void> {
    const job = jobSchema.safeParse(jobData);
    if (!job.success) throw new Error('OUTBOX_JOB_INVALID');
    const event = await this.store.load(job.data.eventId);
    const handlers = this.handlers.get(
      this.eventKey(event.type, event.schemaVersion),
    );
    if (!handlers?.length) throw new Error('OUTBOX_EVENT_UNHANDLED');
    await withCorrelation(event.correlationId, async () => {
      let failed = false;
      for (const handler of handlers) {
        try {
          await this.consumer.run(
            handler.operation,
            event,
            handler.expiresAt(event),
            (tx, envelope) => handler.handle(tx, envelope),
          );
        } catch {
          failed = true;
          this.logger.error({
            event: 'outbox.handler_failed',
            eventId: event.id,
            consumer: handler.operation.consumer,
            handler: handler.operation.handler,
            code: 'OUTBOX_HANDLER_FAILED',
          });
        }
      }
      if (failed) throw new Error('OUTBOX_EVENT_HANDLERS_FAILED');
    });
  }

  private eventKey(type: string, version: number): string {
    return `${type}\0${version}`;
  }
}
