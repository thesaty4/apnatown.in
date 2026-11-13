import {
  REALTIME_MAX_RECIPIENTS,
  RealtimeSignalPayloadSchema,
} from '@apnatown/shared/realtime';
import {
  REALTIME_CHANNEL,
  type RealtimeSignal,
  type RealtimeSignalInput,
} from '../realtime/ports';
import { Prisma } from './generated/client';
import type { TxContext } from './ports';
import { PrismaDatabase } from './prisma-database';

/**
 * `pg_notify` inside the caller's transaction: PostgreSQL delivers NOTIFY
 * only on commit, so a rolled-back transition never signals. Recipients are
 * de-duplicated and chunked so each payload stays far below the 8000-byte
 * NOTIFY limit. Payload = IDs + kind only (validated before sending).
 */
export class PgRealtimeSignal implements RealtimeSignal {
  constructor(private readonly database: PrismaDatabase) {}

  async signal(tx: TxContext, input: RealtimeSignalInput): Promise<void> {
    const userIds = [...new Set(input.userIds)];
    for (let start = 0; start < userIds.length; start += REALTIME_MAX_RECIPIENTS) {
      const payload = RealtimeSignalPayloadSchema.parse({
        v: 1,
        kind: input.kind,
        userIds: userIds.slice(start, start + REALTIME_MAX_RECIPIENTS),
        ...(input.orderId ? { orderId: input.orderId } : {}),
        ...(input.jobId ? { jobId: input.jobId } : {}),
      });
      await this.database
        .client(tx)
        .$executeRaw(
          Prisma.sql`SELECT pg_notify(${REALTIME_CHANNEL}, ${JSON.stringify(payload)})`,
        );
    }
  }
}
