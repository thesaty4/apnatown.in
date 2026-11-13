import { Injectable } from '@nestjs/common';
import type { ReviewPublicTargetType } from '@apnatown/shared/reviews';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type {
  PublicReviewPageInput,
  PublicReviewPageRows,
  PublicReviewRow,
  ReviewPosition,
  ReviewPublicReadRepository,
} from '../domain/reviews';
import {
  CARD_COLUMNS,
  SUMMARY_COLUMNS,
  VISIBLE_JOIN,
  VISIBLE_STATUS,
  toSummary,
  type SummaryRow,
} from './review-sql';

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
    FROM reviews r ${VISIBLE_JOIN}
    WHERE r.target_type = ${input.targetType} AND r.target_id = ${input.targetId}::uuid
      AND ${VISIBLE_STATUS}`;
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
        SELECT ${SUMMARY_COLUMNS} ${visible(input)}`);
      const rows = await client.$queryRaw<PublicReviewRow[]>(Prisma.sql`
        SELECT ${CARD_COLUMNS}
        ${visible(input)} ${after(input.after)}
        ${ORDER[input.sort]}
        LIMIT ${input.take}`);
      return { summary: toSummary(summary), rows };
    });
  }
}
