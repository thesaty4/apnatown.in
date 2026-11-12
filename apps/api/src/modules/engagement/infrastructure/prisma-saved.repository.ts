import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { SavedRelationship, SavedRepository } from '../domain/saved';

@Injectable()
export class PrismaSavedRepository implements SavedRepository {
  constructor(private readonly database: PrismaDatabase) {}

  page(
    tx: TxContext,
    { userId, query, after }: Parameters<SavedRepository['page']>[1],
  ) {
    if (query.tab === 'shops') {
      return this.database.client(tx).$queryRaw<SavedRelationship[]>(Prisma.sql`
        SELECT 'business' AS "targetType", business_id AS "targetId",
          to_char(last_followed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "savedAt",
          bell_on AS "bellOn", NULL::text AS "mediaKind"
        FROM follows
        WHERE user_id = ${userId}::uuid AND unfollowed_at IS NULL
          ${
            after
              ? Prisma.sql`AND (last_followed_at, business_id) <
            (${after.savedAt}::timestamptz, ${after.targetId}::uuid)`
              : Prisma.empty
          }
        ORDER BY last_followed_at DESC, business_id DESC
        LIMIT ${query.limit + 1}`);
    }
    return this.database.client(tx).$queryRaw<SavedRelationship[]>(Prisma.sql`
      SELECT 'video' AS "targetType", target_id AS "targetId",
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "savedAt",
        FALSE AS "bellOn", media_kind AS "mediaKind"
      FROM hearts
      WHERE user_id = ${userId}::uuid AND target_type = 'video'
        ${
          query.mediaFilter === 'all'
            ? Prisma.empty
            : Prisma.sql`AND media_kind = ${query.mediaFilter === 'reels' ? 'reel' : 'video'}`
        }
        ${
          after
            ? Prisma.sql`AND (created_at, target_id) <
          (${after.savedAt}::timestamptz, ${after.targetId}::uuid)`
            : Prisma.empty
        }
      ORDER BY created_at DESC, target_id DESC
      LIMIT ${query.limit + 1}`);
  }
}
