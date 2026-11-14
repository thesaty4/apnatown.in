import { Injectable } from '@nestjs/common';
import { FollowResultSchema } from '@apnatown/shared';
import { CountSchema } from '@apnatown/shared/wire';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { FollowRepository } from '../domain/follows';

@Injectable()
export class PrismaFollowRepository implements FollowRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async state(tx: TxContext, userId: string | null, businessIds: readonly string[]) {
    if (businessIds.length === 0) return [];
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ businessId: string; following: boolean; bellOn: boolean }>
    >`
      SELECT requested.id AS "businessId",
        COALESCE(f.unfollowed_at IS NULL AND f.user_id IS NOT NULL, false) AS following,
        COALESCE(f.bell_on AND f.unfollowed_at IS NULL, false) AS "bellOn"
      FROM unnest(${[...businessIds]}::uuid[]) AS requested(id)
      LEFT JOIN follows f
        ON f.business_id = requested.id AND f.user_id = ${userId}::uuid
      ORDER BY requested.id`;
    return rows;
  }

  async set(
    tx: TxContext,
    input: {
      userId: string;
      businessId: string;
      following: boolean;
      bellOn?: boolean;
      at: Date;
    },
  ) {
    const client = this.database.client(tx);
    let changed = false;

    if (input.following) {
      const inserted = await client.$executeRaw`
        INSERT INTO follows (
          user_id, business_id, bell_on, created_at, last_followed_at
        ) VALUES (
          ${input.userId}::uuid, ${input.businessId}::uuid,
          ${input.bellOn ?? true}, ${input.at}, ${input.at}
        )
        ON CONFLICT (user_id, business_id) DO NOTHING`;
      if (inserted === 0) {
        const [current] = await client.$queryRaw<
          Array<{ bellOn: boolean; unfollowedAt: Date | null }>
        >`
          SELECT bell_on AS "bellOn", unfollowed_at AS "unfollowedAt"
          FROM follows
          WHERE user_id = ${input.userId}::uuid
            AND business_id = ${input.businessId}::uuid
          FOR UPDATE`;
        if (!current) throw new Error('FOLLOW_ROW_MISSING');
        if (current.unfollowedAt !== null) {
          await client.$executeRaw`
            UPDATE follows
            SET bell_on = ${input.bellOn ?? true},
                last_followed_at = ${input.at},
                unfollowed_at = NULL
            WHERE user_id = ${input.userId}::uuid
              AND business_id = ${input.businessId}::uuid`;
          changed = true;
        } else if (input.bellOn !== undefined && current.bellOn !== input.bellOn) {
          await client.$executeRaw`
            UPDATE follows SET bell_on = ${input.bellOn}
            WHERE user_id = ${input.userId}::uuid
              AND business_id = ${input.businessId}::uuid`;
          changed = true;
        }
      } else {
        changed = true;
      }
    } else {
      const affected = await client.$executeRaw`
        UPDATE follows
        SET unfollowed_at = ${input.at}, bell_on = false
        WHERE user_id = ${input.userId}::uuid
          AND business_id = ${input.businessId}::uuid
          AND unfollowed_at IS NULL`;
      changed = affected > 0;
    }

    const [row] = await client.$queryRaw<
      Array<{ following: boolean; bellOn: boolean; followerCount: bigint }>
    >`
      SELECT EXISTS (
          SELECT 1 FROM follows
          WHERE user_id = ${input.userId}::uuid
            AND business_id = ${input.businessId}::uuid
            AND unfollowed_at IS NULL
        ) AS following,
        COALESCE((
          SELECT bell_on FROM follows
          WHERE user_id = ${input.userId}::uuid
            AND business_id = ${input.businessId}::uuid
            AND unfollowed_at IS NULL
        ), false) AS "bellOn",
        (
          SELECT COUNT(*) FROM follows
          WHERE business_id = ${input.businessId}::uuid
            AND unfollowed_at IS NULL
        ) AS "followerCount"`;
    if (!row) throw new Error('FOLLOW_RESULT_MISSING');
    return {
      ...FollowResultSchema.parse({
        following: row.following,
        bellOn: row.bellOn,
        followerCount: CountSchema.parse(Number(row.followerCount)),
      }),
      changed,
    };
  }
}
