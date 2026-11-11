import { Injectable } from '@nestjs/common';
import {
  canonicalJson,
  EventEnvelopeSchema,
  type EventEnvelope,
} from '@apnatown/shared';
import { IdSchema } from '@apnatown/shared/wire';
import { Prisma } from './generated/client';
import { PrismaDatabase } from './prisma-database';

type EventRow = Omit<EventEnvelope, 'occurredAt' | 'payload'> & {
  occurredAt: Date;
  payload: Prisma.JsonValue;
};

@Injectable()
export class OutboxEventStore {
  constructor(private readonly database: PrismaDatabase) {}

  async load(eventId: string): Promise<EventEnvelope> {
    const id = IdSchema.safeParse(eventId);
    if (!id.success) throw new Error('OUTBOX_EVENT_ID_INVALID');
    await this.database.connect();
    const rows = await this.database.queryRaw<EventRow[]>(Prisma.sql`
      SELECT id, type, schema_version AS "schemaVersion",
             aggregate_type AS "aggregateType", aggregate_id AS "aggregateId",
             aggregate_version AS "aggregateVersion", payload,
             correlation_id AS "correlationId", occurred_at AS "occurredAt"
      FROM outbox_events
      WHERE id = ${id.data}::uuid
    `);
    const row = rows[0];
    if (!row) throw new Error('OUTBOX_EVENT_NOT_FOUND');
    canonicalJson(row.payload);
    const event = EventEnvelopeSchema.safeParse({
      ...row,
      occurredAt: row.occurredAt.toISOString(),
    });
    if (!event.success) throw new Error('OUTBOX_EVENT_INVALID');
    return event.data;
  }
}
