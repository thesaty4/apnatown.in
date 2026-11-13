import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../persistence/generated/client';
import { PrismaDatabase } from '../persistence/prisma-database';

export const RATE_LIMIT_REPOSITORY = Symbol('RATE_LIMIT_REPOSITORY');

export interface RateLimitRepository {
  consume(input: {
    policyKey: string;
    subjectHash: Uint8Array;
    windowSeconds: number;
    maximumHits: number;
  }): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
}

@Injectable()
export class PostgresRateLimitRepository implements RateLimitRepository {
  constructor(
    @Inject(PrismaDatabase) private readonly database: PrismaDatabase,
  ) {}

  async consume(input: {
    policyKey: string;
    subjectHash: Uint8Array;
    windowSeconds: number;
    maximumHits: number;
  }): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    const rows = await this.database.queryRaw<
      Array<{ hit_count: bigint; retry_after_seconds: number }>
    >(Prisma.sql`
      WITH bucket AS (
        INSERT INTO rate_limit_buckets
          (policy_key, subject_hash, bucket_start, hit_count, expires_at)
        VALUES (
          ${input.policyKey},
          ${Buffer.from(input.subjectHash)},
          date_bin(
            make_interval(secs => ${input.windowSeconds}),
            clock_timestamp(),
            TIMESTAMPTZ '1970-01-01 00:00:00+00'
          ),
          1,
          date_bin(
            make_interval(secs => ${input.windowSeconds}),
            clock_timestamp(),
            TIMESTAMPTZ '1970-01-01 00:00:00+00'
          ) + make_interval(secs => ${input.windowSeconds})
        )
        ON CONFLICT (policy_key, subject_hash, bucket_start)
        DO UPDATE SET hit_count = CASE
          WHEN rate_limit_buckets.hit_count <= ${input.maximumHits}
            THEN rate_limit_buckets.hit_count + 1
          ELSE rate_limit_buckets.hit_count
        END
        RETURNING hit_count, expires_at
      )
      SELECT
        hit_count,
        GREATEST(
          1,
          CEIL(EXTRACT(EPOCH FROM (expires_at - clock_timestamp())))
        )::int AS retry_after_seconds
      FROM bucket
    `);
    const row = rows[0];
    if (!row) throw new Error('RATE_LIMIT_BUCKET_WRITE_FAILED');
    return {
      allowed: row.hit_count <= BigInt(input.maximumHits),
      retryAfterSeconds: row.retry_after_seconds,
    };
  }
}
