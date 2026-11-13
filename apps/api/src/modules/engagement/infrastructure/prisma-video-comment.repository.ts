import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CommentPosition,
  CommentScope,
  CommentStatus,
  StoredComment,
  VideoCommentRepository,
} from '../domain/comments';

const rowColumns = Prisma.sql`
  c.id, c.video_id AS "videoId", v.business_id AS "businessId",
  b.city_id AS "cityId", b.area_id AS "areaId",
  c.author_user_id AS "authorUserId",
  COALESCE(NULLIF(BTRIM(u.display_name), ''), 'Customer') AS "authorLabel",
  c.text, c.status, c.removed_reason AS reason, c.version,
  to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
  to_char(c.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "updatedAt"`;

function scopePredicate(scope: CommentScope) {
  if (scope.platformWide) return Prisma.sql`TRUE`;
  const city = scope.cityWideIds.length
    ? Prisma.sql`b.city_id IN (${Prisma.join(
        scope.cityWideIds.map((id) => Prisma.sql`${id}::uuid`),
      )})`
    : Prisma.sql`FALSE`;
  const area = scope.areaIds.length
    ? Prisma.sql`b.area_id IN (${Prisma.join(
        scope.areaIds.map((id) => Prisma.sql`${id}::uuid`),
      )})`
    : Prisma.sql`FALSE`;
  return Prisma.sql`(${city} OR ${area})`;
}

@Injectable()
export class PrismaVideoCommentRepository implements VideoCommentRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async insert(
    tx: TxContext,
    input: {
      id: string;
      videoId: string;
      authorUserId: string;
      text: string;
      status: CommentStatus;
      at: Date;
    },
  ): Promise<StoredComment> {
    const rows = await this.database.client(tx).$queryRaw<StoredComment[]>(
      Prisma.sql`
        INSERT INTO video_comments (
          id, video_id, author_user_id, text, status, version, created_at, updated_at
        ) VALUES (
          ${input.id}::uuid, ${input.videoId}::uuid, ${input.authorUserId}::uuid,
          ${input.text}, ${input.status}, 1, ${input.at}, ${input.at}
        )
        RETURNING id, video_id AS "videoId", author_user_id AS "authorUserId",
          text, status, removed_reason AS reason, version,
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
          to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "updatedAt"`,
    );
    const result = await this.find(tx, rows[0]!.id);
    if (!result) throw new Error('VIDEO_COMMENT_INSERT_NOT_READABLE');
    return result;
  }

  async find(tx: TxContext, id: string): Promise<StoredComment | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredComment[]>(
      Prisma.sql`
        SELECT ${rowColumns}
        FROM video_comments c
        JOIN videos v ON v.id = c.video_id
        JOIN businesses b ON b.id = v.business_id
        JOIN users u ON u.id = c.author_user_id
        WHERE c.id = ${id}::uuid`,
    );
    return rows[0] ?? null;
  }

  publicPage(
    tx: TxContext,
    input: {
      videoId: string;
      authorUserId: string | null;
      public: boolean;
      limit: number;
      after?: CommentPosition;
    },
  ): Promise<StoredComment[]> {
    const after = input.after
      ? Prisma.sql`AND (c.created_at, c.id) <
          (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    const visible = input.public
      ? Prisma.sql`c.status = 'published' OR
          (c.status = 'pending' AND c.author_user_id = ${input.authorUserId}::uuid)`
      : input.authorUserId
        ? Prisma.sql`c.status = 'pending' AND c.author_user_id = ${input.authorUserId}::uuid`
        : Prisma.sql`FALSE`;
    return this.database.client(tx).$queryRaw<StoredComment[]>(Prisma.sql`
      SELECT ${rowColumns}
      FROM video_comments c
      JOIN videos v ON v.id = c.video_id
      JOIN businesses b ON b.id = v.business_id
      JOIN users u ON u.id = c.author_user_id
      WHERE c.video_id = ${input.videoId}::uuid AND (${visible}) ${after}
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ${input.limit + 1}`);
  }

  adminPage(
    tx: TxContext,
    input: {
      status: CommentStatus;
      scope: CommentScope;
      limit: number;
      after?: CommentPosition;
    },
  ): Promise<StoredComment[]> {
    const after = input.after
      ? Prisma.sql`AND (c.created_at, c.id) >
          (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredComment[]>(Prisma.sql`
      SELECT ${rowColumns}
      FROM video_comments c
      JOIN videos v ON v.id = c.video_id
      JOIN businesses b ON b.id = v.business_id
      JOIN users u ON u.id = c.author_user_id
      WHERE c.status = ${input.status} AND ${scopePredicate(input.scope)} ${after}
      ORDER BY c.created_at ASC, c.id ASC
      LIMIT ${input.limit + 1}`);
  }

  async adminCounts(
    tx: TxContext,
    scope: CommentScope,
  ): Promise<{ pending: number; published: number; removed: number }> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ status: CommentStatus; count: bigint }>
    >(Prisma.sql`
      SELECT c.status, COUNT(*)::bigint AS count
      FROM video_comments c
      JOIN videos v ON v.id = c.video_id
      JOIN businesses b ON b.id = v.business_id
      WHERE ${scopePredicate(scope)}
      GROUP BY c.status`);
    const counts = { pending: 0, published: 0, removed: 0 };
    for (const row of rows) {
      const count = Number(row.count);
      if (!Number.isSafeInteger(count) || count < 0)
        throw new Error('COMMENT_COUNT_OUT_OF_RANGE');
      counts[row.status] = count;
    }
    return counts;
  }

  async publishedCount(tx: TxContext, videoId: string): Promise<number> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ count: bigint }>
    >(Prisma.sql`
      SELECT COUNT(*)::bigint AS count FROM video_comments
      WHERE video_id = ${videoId}::uuid AND status = 'published'`);
    const count = Number(rows[0]?.count ?? 0n);
    if (!Number.isSafeInteger(count)) throw new Error('COMMENT_COUNT_OUT_OF_RANGE');
    return count;
  }

  async transition(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      fromStatus: CommentStatus;
      status: CommentStatus;
      reason: string | null;
      at: Date;
    },
  ): Promise<StoredComment | null> {
    const rows = await this.database.client(tx).$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        UPDATE video_comments
        SET status = ${input.status}, removed_reason = ${input.reason},
            version = version + 1, updated_at = ${input.at}
        WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
          AND status = ${input.fromStatus}
        RETURNING id`,
    );
    return rows[0] ? this.find(tx, rows[0].id) : null;
  }

  async removeByAuthor(
    tx: TxContext,
    input: { id: string; authorUserId: string; at: Date },
  ): Promise<{ comment: StoredComment; fromStatus: CommentStatus } | null> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ id: string; fromStatus: CommentStatus }>
    >(
      Prisma.sql`
        WITH candidate AS (
          SELECT id, status FROM video_comments
          WHERE id = ${input.id}::uuid
            AND author_user_id = ${input.authorUserId}::uuid
            AND status IN ('pending', 'published')
          FOR UPDATE
        )
        UPDATE video_comments c
        SET status = 'removed', removed_reason = NULL,
            version = c.version + 1, updated_at = ${input.at}
        FROM candidate old
        WHERE c.id = old.id
        RETURNING c.id, old.status AS "fromStatus"`,
    );
    if (!rows[0]) return null;
    const comment = await this.find(tx, rows[0].id);
    return comment ? { comment, fromStatus: rows[0].fromStatus } : null;
  }
}
