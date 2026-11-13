import type { EventEnvelope } from '@apnatown/shared';
import type { z } from 'zod';
import type { ConsumerOperation } from '../../../shared/jobs/event-consumer';
import type { OutboxHandler } from '../../../shared/jobs/outbox-dispatcher';
import type { TxContext } from '../../../shared/persistence/ports';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import type { Clock } from '../../../shared/runtime/providers';
import type {
  NotificationPublisher,
  NotifyCommand,
} from './notification-publisher';

/** Trusted matrix row: exact producer event(s) -> recipients/template/link. */
export interface NotificationRule {
  /** Stable handler identity prefix (receipt dedupe key). */
  readonly name: string;
  readonly eventTypes: readonly string[];
  command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand | null>;
}

export const NOTIFICATION_RULES = Symbol('NOTIFICATION_RULES');
const CONSUMER = 'notifications';
// Local retry horizon for consumer receipts, not a retention policy.

/** Producer payloads are canonical; a mismatch is a contract bug (retry/DLQ). */
export function payload<T>(schema: z.ZodType<T>, event: EventEnvelope): T {
  const parsed = schema.safeParse(event.payload);
  if (!parsed.success) throw new Error('NOTIFICATION_EVENT_INVALID');
  return parsed.data;
}

/** Outbox adapter: dedupe per consumer+handler+event, then publish in-tx. */
export class NotificationEventHandler implements OutboxHandler {
  readonly operation: ConsumerOperation;

  constructor(
    private readonly rule: NotificationRule,
    eventType: string,
    private readonly publisher: NotificationPublisher,
    private readonly clock: Clock,
  ) {
    this.operation = Object.freeze({
      consumer: CONSUMER,
      handler: `notifications.${rule.name}.${eventType}`,
      eventType,
      schemaVersion: 1,
    });
  }

  expiresAt(): Date {
    return new Date(this.clock.now().getTime() + RECEIPT_TTL_MS);
  }

  async handle(tx: TxContext, event: EventEnvelope): Promise<void> {
    const command = await this.rule.command(tx, event);
    if (command) await this.publisher.notify(tx, event, command);
  }
}

export function notificationHandlers(
  rules: readonly NotificationRule[],
  publisher: NotificationPublisher,
  clock: Clock,
): OutboxHandler[] {
  return rules.flatMap((rule) =>
    rule.eventTypes.map(
      (eventType) =>
        new NotificationEventHandler(rule, eventType, publisher, clock),
    ),
  );
}
