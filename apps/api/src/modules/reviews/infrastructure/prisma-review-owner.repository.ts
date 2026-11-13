import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  OwnerReviewPageInput,
  OwnerReviewPageRows,
  OwnerReviewRow,
  ReviewOwnerRepository,
} from '../domain/owner-reviews';
import {
  CARD_COLUMNS,
  SUMMARY_COLUMNS,
  VISIBLE_JOIN,
  VISIBLE_STATUS,
  toSummary,
  type SummaryRow,
} from './review-sql';

const FILTER = {
  all: Prisma.empty,
  needs_reply: Prisma.sql`AND NULLIF(btrim(r.owner_reply), '') IS NULL`,
  reported: Prisma.sql`AND r.status = 'reported'`,
} as const;

const ownedVisible = (businessId: string, joins = Prisma.empty) => Prisma.sql`
  FROM reviews r ${VISIBLE_JOIN} ${joins}
  WHERE r.business_id = ${businessId}::uuid
    AND r.target_type IN ('business', 'product', 'service') AND ${VISIBLE_STATUS}`;

const ownerColumns = (subjectHash: Buffer) => Prisma.sql`${CARD_COLUMNS},
  r.target_type AS "targetType",
  COALESCE(p.name_en, s.name_en) AS "targetNameEn",
  COALESCE(p.name_hi, s.name_hi) AS "targetNameHi",
  EXISTS (SELECT 1 FROM review_reports rr WHERE rr.review_id = r.id
    AND rr.reporter_subject_hash = ${subjectHash}) AS "reportedByMe"`;

const targetNames = Prisma.sql`
  LEFT JOIN products p ON r.target_type = 'product' AND p.id = r.target_id
  LEFT JOIN services s ON r.target_type = 'service' AND s.id = r.target_id`;

/** Parameterized SQL only; filters/sort are allow-listed fragments. */
@Injectable()
export class PrismaReviewOwnerRepository implements ReviewOwnerRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async page(tx: TxContext, input: OwnerReviewPageInput): Promise<OwnerReviewPageRows> {
    const client = this.db.client(tx);
    const [summary] = await client.$queryRaw<
      (SummaryRow & { needsReply: number; reported: number })[]
    >(Prisma.sql`
      SELECT ${SUMMARY_COLUMNS},
        count(*) FILTER (WHERE NULLIF(btrim(r.owner_reply), '') IS NULL)::integer AS "needsReply",
        count(*) FILTER (WHERE r.status = 'reported')::integer AS reported
      ${ownedVisible(input.businessId)}`);
    const rating = input.rating ? Prisma.sql`AND r.rating = ${input.rating}` : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (r.created_at, r.id) < (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    const rows = await client.$queryRaw<OwnerReviewRow[]>(Prisma.sql`
      SELECT ${ownerColumns(input.subjectHash)}
      ${ownedVisible(input.businessId, targetNames)}
        ${FILTER[input.filter]} ${rating} ${after}
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT ${input.take}`);
    return {
      summary: toSummary(summary),
      counts: {
        all: summary?.count ?? 0,
        needs_reply: summary?.needsReply ?? 0,
        reported: summary?.reported ?? 0,
      },
      rows,
    };
  }

  async find(
    tx: TxContext,
    input: { reviewId: string; businessId: string; subjectHash: Buffer },
  ): Promise<OwnerReviewRow | null> {
    const rows = await this.db.client(tx).$queryRaw<OwnerReviewRow[]>(Prisma.sql`
      SELECT ${ownerColumns(input.subjectHash)}
      ${ownedVisible(input.businessId, targetNames)} AND r.id = ${input.reviewId}::uuid`);
    return rows[0] ?? null;
  }

  async businessOf(tx: TxContext, reviewId: string): Promise<string | null> {
    const rows = await this.db.client(tx).$queryRaw<{ businessId: string | null }[]>(Prisma.sql`
      SELECT r.business_id::text AS "businessId"
      FROM reviews r ${VISIBLE_JOIN}
      WHERE r.id = ${reviewId}::uuid AND ${VISIBLE_STATUS}`);
    return rows[0]?.businessId ?? null;
  }

  async setReply(
    tx: TxContext,
    input: { reviewId: string; businessId: string; text: string | null; at: Date },
  ): Promise<boolean> {
    const updated = await this.db.client(tx).$executeRaw(Prisma.sql`
      UPDATE reviews r SET owner_reply = ${input.text},
        owner_replied_at = ${input.text === null ? null : input.at},
        version = r.version + 1, updated_at = ${input.at}
      WHERE r.id = ${input.reviewId}::uuid AND r.business_id = ${input.businessId}::uuid
        AND ${VISIBLE_STATUS}`);
    return updated === 1;
  }

  async report(
    tx: TxContext,
    input: Parameters<ReviewOwnerRepository['report']>[1],
  ): Promise<void> {
    const client = this.db.client(tx);
    const inserted = await client.$executeRaw(Prisma.sql`
      INSERT INTO review_reports (id, review_id, reporter_user_id, reporter_subject_hash,
        reason, details, status, created_at)
      VALUES (${input.id}::uuid, ${input.reviewId}::uuid, ${input.reporterUserId}::uuid,
        ${input.subjectHash}, ${input.report.reason}, ${input.report.details ?? null}, 'open', ${input.at})
      ON CONFLICT ON CONSTRAINT review_reports_subject_key DO NOTHING`);
    if (!inserted) return;
    await client.$executeRaw(Prisma.sql`
      UPDATE reviews r SET status = 'reported', version = r.version + 1, updated_at = ${input.at}
      WHERE r.id = ${input.reviewId}::uuid AND r.status = 'published' AND r.deleted_at IS NULL`);
  }
}
