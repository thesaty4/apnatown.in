import { Prisma } from '../../../shared/persistence/generated/client';
import type { PublicReviewSummaryRow } from '../domain/reviews';

export const iso = (column: Prisma.Sql) =>
  Prisma.sql`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

/** Aggregate columns over a `reviews r` set (one-decimal average + 1★..5★). */
export const SUMMARY_COLUMNS = Prisma.sql`count(*)::integer AS count,
  round(avg(r.rating)::numeric, 1)::float8 AS average,
  count(*) FILTER (WHERE r.rating = 1)::integer AS r1,
  count(*) FILTER (WHERE r.rating = 2)::integer AS r2,
  count(*) FILTER (WHERE r.rating = 3)::integer AS r3,
  count(*) FILTER (WHERE r.rating = 4)::integer AS r4,
  count(*) FILTER (WHERE r.rating = 5)::integer AS r5`;

/** Card columns over `reviews r` joined to its author `users u`. */
export const CARD_COLUMNS = Prisma.sql`r.id::text AS id,
  u.display_name AS "authorDisplayName",
  r.rating::integer AS rating, r.text, r.tags,
  r.helpful_count AS "helpfulCount",
  NULLIF(btrim(r.owner_reply), '') AS "ownerReply",
  ${iso(Prisma.sql`r.owner_replied_at`)} AS "ownerRepliedAt",
  ${iso(Prisma.sql`r.created_at`)} AS "createdAt", r.status`;

/** Visible to the public and owners: published/reported, live active author. */
export const VISIBLE_JOIN = Prisma.sql`JOIN users u ON u.id = r.author_user_id
  AND u.account_status = 'active' AND u.deleted_at IS NULL`;
export const VISIBLE_STATUS = Prisma.sql`r.status IN ('published', 'reported') AND r.deleted_at IS NULL`;

export type SummaryRow = {
  count: number;
  average: number | null;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
};

export function toSummary(row: SummaryRow | undefined): PublicReviewSummaryRow {
  if (!row || row.count === 0)
    return { count: 0, average: null, breakdown: [0, 0, 0, 0, 0] };
  return {
    count: row.count,
    average: row.average,
    breakdown: [row.r1, row.r2, row.r3, row.r4, row.r5],
  };
}
