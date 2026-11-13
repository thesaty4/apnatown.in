import { Injectable } from '@nestjs/common';
import type { ReviewPublicTargetType } from '@apnatown/shared/reviews';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type {
  PublicReviewPageInput,
  PublicReviewPageRows,
  PublicReviewRow,
  PublicReviewSummaryRow,
  ReviewPosition,
  ReviewPublicReadRepository,
} from '../domain/reviews';

const iso = (column: Prisma.Sql) =>
  Prisma.sql`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

// Allow-listed owner public projections; never built from client input.
function targetVisible(type: ReviewPublicTargetType, id: string): Prisma.Sql {
  switch (type) {
    case 'product':
      return Prisma.sql`EXISTS (SELECT 1 FROM products_public_discovery t WHERE t.id = ${id}::uuid)`;
    case 'service':
      return Prisma.sql`EXISTS (SELECT 1 FROM services_public_discovery t WHERE t.id = ${id}::uuid)`;
    case 'business':
      return Prisma.sql`EXISTS (SELECT 1 FROM businesses_public_context t WHERE t.id = ${id}::uuid)`;
  }
}

// Publicly visible set shared by the summary and the page (spec rule 4):
// published/reported, not deleted, by a live active author.
function visible(input: PublicReviewPageInput): Prisma.Sql {
  return Prisma.sql`
    FROM reviews r
    JOIN users u ON u.id = r.author_user_id
      AND u.account_status = 'active' AND u.deleted_at IS NULL
    WHERE r.target_type = ${input.targetType} AND r.target_id = ${input.targetId}::uuid
      AND r.status IN ('published', 'reported') AND r.deleted_at IS NULL`;
}

function after(position: ReviewPosition | null): Prisma.Sql {
  if (!position) return Prisma.empty;
  if (position.sort === 'recent')
    return Prisma.sql`AND (r.created_at, r.id)
      < (${position.createdAt}::timestamptz, ${position.id}::uuid)`;
  return Prisma.sql`AND (r.helpful_count, r.created_at, r.id)
    < (${position.helpfulCount}::integer, ${position.createdAt}::timestamptz, ${position.id}::uuid)`;
}

const ORDER = {
  recent: Prisma.sql`ORDER BY r.created_at DESC, r.id DESC`,
  helpful: Prisma.sql`ORDER BY r.helpful_count DESC, r.created_at DESC, r.id DESC`,
} as const;

type SummaryRow = {
  count: number;
  average: number | null;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
};

@Injectable()
export class PrismaReviewPublicReadRepository implements ReviewPublicReadRepository {
  constructor(private readonly db: PrismaDatabase) {}

  page(input: PublicReviewPageInput): Promise<PublicReviewPageRows | null> {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      // One snapshot: target visibility, summary and page agree.
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const [target] = await client.$queryRaw<{ visible: boolean }[]>(
        Prisma.sql`SELECT ${targetVisible(input.targetType, input.targetId)} AS visible`,
      );
      if (!target?.visible) return null;
      const [summary] = await client.$queryRaw<SummaryRow[]>(Prisma.sql`
        SELECT count(*)::integer AS count,
          round(avg(r.rating)::numeric, 1)::float8 AS average,
          count(*) FILTER (WHERE r.rating = 1)::integer AS r1,
          count(*) FILTER (WHERE r.rating = 2)::integer AS r2,
          count(*) FILTER (WHERE r.rating = 3)::integer AS r3,
          count(*) FILTER (WHERE r.rating = 4)::integer AS r4,
          count(*) FILTER (WHERE r.rating = 5)::integer AS r5
        ${visible(input)}`);
      const rows = await client.$queryRaw<PublicReviewRow[]>(Prisma.sql`
        SELECT r.id::text AS id, u.display_name AS "authorDisplayName",
          r.rating::integer AS rating, r.text, r.tags,
          r.helpful_count AS "helpfulCount",
          NULLIF(btrim(r.owner_reply), '') AS "ownerReply",
          ${iso(Prisma.sql`r.owner_replied_at`)} AS "ownerRepliedAt",
          ${iso(Prisma.sql`r.created_at`)} AS "createdAt", r.status
        ${visible(input)} ${after(input.after)}
        ${ORDER[input.sort]}
        LIMIT ${input.take}`);
      return { summary: toSummary(summary), rows };
    });
  }
}

function toSummary(row: SummaryRow | undefined): PublicReviewSummaryRow {
  if (!row || row.count === 0)
    return { count: 0, average: null, breakdown: [0, 0, 0, 0, 0] };
  return {
    count: row.count,
    average: row.average,
    breakdown: [row.r1, row.r2, row.r3, row.r4, row.r5],
  };
}
