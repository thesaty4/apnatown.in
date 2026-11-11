import { Injectable } from '@nestjs/common';
import { Prisma } from './generated/client';
import { PrismaDatabase } from './prisma-database';

@Injectable()
export class RuntimeCleanupStore {
  constructor(private readonly database: PrismaDatabase) {}

  async cleanupBatch(
    limit: number,
  ): Promise<{ rateLimitBuckets: number; idempotencyKeys: number }> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500)
      throw new Error('INVALID_RUNTIME_CLEANUP_BATCH_SIZE');
    await this.database.connect();
    return this.database.transaction(async (tx) => {
      const client = this.database.client(tx);
      const rateLimitBuckets = await this.cleanupRateLimits(client, limit);
      const idempotencyKeys = await this.cleanupIdempotency(client, limit);
      return { rateLimitBuckets, idempotencyKeys };
    });
  }

  private cleanupRateLimits(
    client: Prisma.TransactionClient,
    limit: number,
  ): Promise<number> {
    return client.$executeRaw(Prisma.sql`
      WITH expired AS (
        SELECT policy_key, subject_hash, bucket_start
        FROM rate_limit_buckets
        WHERE expires_at <= statement_timestamp()
        ORDER BY expires_at, policy_key, subject_hash, bucket_start
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      DELETE FROM rate_limit_buckets AS bucket
      USING expired
      WHERE bucket.policy_key = expired.policy_key
        AND bucket.subject_hash = expired.subject_hash
        AND bucket.bucket_start = expired.bucket_start
    `);
  }

  private cleanupIdempotency(
    client: Prisma.TransactionClient,
    limit: number,
  ): Promise<number> {
    return client.$executeRaw(Prisma.sql`
      WITH expired AS (
        SELECT id
        FROM idempotency_keys
        WHERE state = 'completed' AND expires_at <= statement_timestamp()
        ORDER BY expires_at, id
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      DELETE FROM idempotency_keys AS receipt
      USING expired
      WHERE receipt.id = expired.id
    `);
  }
}
