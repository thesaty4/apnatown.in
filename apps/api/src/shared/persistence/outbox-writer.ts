import { canonicalJson, EventEnvelopeSchema } from '@apnatown/shared';
import type { DomainEvent } from '../events/event-factory';
import type { OutboxWriter } from '../events/ports';
import { Prisma } from './generated/client';
import type { TxContext } from './ports';
import { PrismaDatabase } from './prisma-database';

function outboxRow(event: DomainEvent) {
  canonicalJson(event);
  const parsed = EventEnvelopeSchema.safeParse(event);
  if (!parsed.success) throw new Error('INVALID_DOMAIN_EVENT');
  const value = parsed.data;
  return {
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
  };
}

export class PrismaOutboxWriter implements OutboxWriter {
  constructor(private readonly database: PrismaDatabase) {}

  async append(tx: TxContext, event: DomainEvent): Promise<void> {
    await this.database
      .client(tx)
      .outboxEvent.create({ data: outboxRow(event) });
  }

  async appendMany(
    tx: TxContext,
    events: readonly DomainEvent[],
  ): Promise<void> {
    if (!events.length) return;
    // Validate every envelope before writing any of them.
    const data = events.map(outboxRow);
    await this.database.client(tx).outboxEvent.createMany({ data });
  }
}
