import { Inject, Injectable } from '@nestjs/common';
import {
  canonicalJson,
  EventEnvelopeSchema,
  type EventEnvelope,
} from '@apnatown/shared';
import { z } from 'zod';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { IdempotencyHasher } from '../idempotency/hasher';
import { withCorrelation } from '../logger/context';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandContext,
  type CommandUnitOfWork,
  type IdempotencyResultPolicy,
  type TxContext,
} from '../persistence/ports';

export const EVENT_CONSUMER = Symbol('EVENT_CONSUMER');

export const ConsumerOperationSchema = z.strictObject({
  consumer: z.string().regex(/^[A-Za-z0-9:_-]{1,200}$/),
  handler: z.string().regex(/^[A-Za-z0-9._:-]{1,200}$/),
  eventType: EventEnvelopeSchema.shape.type,
  schemaVersion: EventEnvelopeSchema.shape.schemaVersion,
});

export type ConsumerOperation = z.infer<typeof ConsumerOperationSchema>;

export interface EventConsumer {
  run(
    operation: ConsumerOperation,
    event: EventEnvelope,
    expiresAt: Date,
    work: (tx: TxContext, event: EventEnvelope) => Promise<void>,
  ): Promise<void>;
}

const receiptPolicy: IdempotencyResultPolicy<null> = {
  store: () => null,
  replay: async (_tx, stored) => {
    if (stored !== null) throw new Error('CONSUMER_RECEIPT_INVALID');
    return null;
  },
};

@Injectable()
export class TransactionalEventConsumer implements EventConsumer {
  private readonly hasher: IdempotencyHasher;

  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(RUNTIME_CONFIG) config: RuntimeConfig,
  ) {
    this.hasher = new IdempotencyHasher(config.IDEMPOTENCY_HASH_KEY);
  }

  async run(
    operation: ConsumerOperation,
    event: EventEnvelope,
    expiresAt: Date,
    work: (tx: TxContext, event: EventEnvelope) => Promise<void>,
  ): Promise<void> {
    const policy = ConsumerOperationSchema.safeParse(operation);
    if (!policy.success) throw new Error('INVALID_CONSUMER_OPERATION');
    const envelope = this.validateEvent(event);
    if (
      envelope.type !== policy.data.eventType ||
      envelope.schemaVersion !== policy.data.schemaVersion
    )
      throw new Error('CONSUMER_EVENT_UNSUPPORTED');
    const command = this.command(policy.data, envelope, expiresAt);
    await withCorrelation(envelope.correlationId, async () => {
      await this.commands.run(
        command,
        async (tx) => {
          await work(tx, envelope);
          return null;
        },
        receiptPolicy,
      );
    });
  }

  private validateEvent(event: EventEnvelope): EventEnvelope {
    if (!event || typeof event !== 'object')
      throw new Error('CONSUMER_EVENT_INVALID');
    canonicalJson(event.payload);
    const parsed = EventEnvelopeSchema.safeParse(event);
    if (!parsed.success) throw new Error('CONSUMER_EVENT_INVALID');
    return parsed.data;
  }

  private command(
    operation: ConsumerOperation,
    event: EventEnvelope,
    expiresAt: Date,
  ): CommandContext {
    if (!(expiresAt instanceof Date) || !Number.isFinite(expiresAt.getTime()))
      throw new Error('IDEMPOTENCY_EXPIRY_INVALID');
    const { payload, ...metadata } = event;
    const fingerprint = `${canonicalJson({
      consumer: operation.consumer,
      handler: operation.handler,
      event: metadata,
    })}\0${canonicalJson(payload)}`;
    return Object.freeze({
      actor: Object.freeze({ kind: 'consumer', id: operation.consumer }),
      operation: operation.handler,
      keyHash: this.hasher.hash('consumer-key', event.id),
      requestHash: this.hasher.hash('consumer-request', fingerprint),
      correlationId: event.correlationId,
      successStatus: 204,
      expiresAt: new Date(expiresAt.getTime()),
    });
  }
}
