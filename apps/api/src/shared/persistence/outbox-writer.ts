import { canonicalJson, EventEnvelopeSchema } from '@apnatown/shared';
import type { DomainEvent } from '../events/event-factory';
import type { OutboxWriter } from '../events/ports';
import { Prisma } from './generated/client';
import type { TxContext } from './ports';
import { PrismaDatabase } from './prisma-database';

export class PrismaOutboxWriter implements OutboxWriter {
  constructor(private readonly database: PrismaDatabase) {}

  async append(tx: TxContext, event: DomainEvent): Promise<void> {
    canonicalJson(event);
    const parsed = EventEnvelopeSchema.safeParse(event);
    if (!parsed.success) throw new Error('INVALID_DOMAIN_EVENT');
    const value = parsed.data;
    await this.database.client(tx).outboxEvent.create({
      data: {
        id: value.id,
        type: value.type,
        schemaVersion: value.schemaVersion,
        aggregateType: value.aggregateType,
        aggregateId: value.aggregateId,
        aggregateVersion: value.aggregateVersion,
        payload: value.payload === null ? Prisma.JsonNull : value.payload,
        correlationId: value.correlationId,
        occurredAt: new Date(value.occurredAt),
        availableAt: new Date(value.occurredAt),
      },
    });
  }
}
