import { Injectable } from '@nestjs/common';
import { Prisma } from './generated/client';
import { PrismaDatabase } from './prisma-database';

const OUTBOX_RETRY_EXHAUSTED = 'OUTBOX_RETRY_EXHAUSTED';

export interface OutboxRecord {
  id: string;
  type: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  payload: Prisma.JsonValue;
  correlationId: string;
  occurredAt: Date;
  attemptCount: number;
  leaseOwner: string;
}

export interface OutboxRelayLimits {
  JOB_RETRY_LIMIT: number;
  JOB_RETRY_DELAY_MS: number;
  OUTBOX_RELAY_BATCH_SIZE: number;
  OUTBOX_RELAY_LEASE_MS: number;
}

@Injectable()
export class OutboxRelayStore {
  constructor(private readonly database: PrismaDatabase) {}

  async claimBatch(
    leaseOwner: string,
    limits: OutboxRelayLimits,
  ): Promise<{ records: OutboxRecord[]; exhausted: number }> {
    await this.database.connect();
    return this.database.transaction(async (tx) => {
      const client = this.database.client(tx);
      const exhausted = await this.markExpiredExhausted(client, limits);
      const capacity = Math.max(0, limits.OUTBOX_RELAY_BATCH_SIZE - exhausted);
      const records = await this.claimReady(
        client,
        leaseOwner,
        limits,
        capacity,
      );
      return { records, exhausted };
    });
  }

  private async markExpiredExhausted(
    client: Prisma.TransactionClient,
    limits: OutboxRelayLimits,
  ): Promise<number> {
    const updated = await client.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        WITH exhausted AS (
          SELECT id
          FROM outbox_events
          WHERE state = 'publishing'
            AND lease_expires_at <= clock_timestamp()
            AND attempt_count > ${limits.JOB_RETRY_LIMIT}
          ORDER BY lease_expires_at, id
          FOR UPDATE SKIP LOCKED
          LIMIT ${limits.OUTBOX_RELAY_BATCH_SIZE}
        )
        UPDATE outbox_events AS event
        SET state = 'dead',
            lease_owner = NULL,
            lease_expires_at = NULL,
            last_error_code = ${OUTBOX_RETRY_EXHAUSTED}
        FROM exhausted
        WHERE event.id = exhausted.id
        RETURNING event.id
      `,
    );
    return updated.length;
  }

  private async claimReady(
    client: Prisma.TransactionClient,
    leaseOwner: string,
    limits: OutboxRelayLimits,
    capacity: number,
  ): Promise<OutboxRecord[]> {
    return client.$queryRaw<OutboxRecord[]>(
      Prisma.sql`
        WITH candidates AS (
          SELECT id
          FROM outbox_events
          WHERE attempt_count <= ${limits.JOB_RETRY_LIMIT}
            AND (
              (state = 'pending' AND available_at <= clock_timestamp())
              OR
              (state = 'publishing' AND lease_expires_at <= clock_timestamp())
            )
          ORDER BY available_at, id
          FOR UPDATE SKIP LOCKED
          LIMIT ${capacity}
        )
        UPDATE outbox_events AS event
        SET state = 'publishing',
            attempt_count = event.attempt_count + 1,
            lease_owner = ${leaseOwner},
            lease_expires_at = clock_timestamp()
              + (${limits.OUTBOX_RELAY_LEASE_MS} * INTERVAL '1 millisecond')
        FROM candidates
        WHERE event.id = candidates.id
        RETURNING event.id,
                  event.type,
                  event.schema_version AS "schemaVersion",
                  event.aggregate_type AS "aggregateType",
                  event.aggregate_id AS "aggregateId",
                  event.aggregate_version AS "aggregateVersion",
                  event.payload,
                  event.correlation_id AS "correlationId",
                  event.occurred_at AS "occurredAt",
                  event.attempt_count AS "attemptCount",
                  event.lease_owner AS "leaseOwner"
      `,
    );
  }

  async markPublished(record: OutboxRecord): Promise<boolean> {
    const updated = await this.database.queryRaw<{ id: string }[]>(
      Prisma.sql`
        UPDATE outbox_events
        SET state = 'published',
            published_at = clock_timestamp(),
            lease_owner = NULL,
            lease_expires_at = NULL,
            last_error_code = NULL
        WHERE id = ${record.id}::uuid
          AND state = 'publishing'
          AND lease_owner = ${record.leaseOwner}
        RETURNING id
      `,
    );
    return updated.length === 1;
  }

  async fail(
    record: OutboxRecord,
    code: string,
    limits: OutboxRelayLimits,
    terminal: boolean,
  ): Promise<'dead' | 'retry' | 'lease_lost'> {
    const dead = terminal || record.attemptCount > limits.JOB_RETRY_LIMIT;
    const retryDelayMs = Math.min(
      limits.JOB_RETRY_DELAY_MS * record.attemptCount,
      limits.JOB_RETRY_DELAY_MS * (limits.JOB_RETRY_LIMIT + 1),
    );
    const updated = await this.database.queryRaw<{ id: string }[]>(
      dead
        ? Prisma.sql`
            UPDATE outbox_events
            SET state = 'dead',
                lease_owner = NULL,
                lease_expires_at = NULL,
                last_error_code = ${code}
            WHERE id = ${record.id}::uuid
              AND state = 'publishing'
              AND lease_owner = ${record.leaseOwner}
            RETURNING id
          `
        : Prisma.sql`
            UPDATE outbox_events
            SET state = 'pending',
                available_at = clock_timestamp()
                  + (${retryDelayMs} * INTERVAL '1 millisecond'),
                lease_owner = NULL,
                lease_expires_at = NULL,
                last_error_code = ${code}
            WHERE id = ${record.id}::uuid
              AND state = 'publishing'
              AND lease_owner = ${record.leaseOwner}
            RETURNING id
          `,
    );
    if (updated.length !== 1) return 'lease_lost';
    return dead ? 'dead' : 'retry';
  }
}
