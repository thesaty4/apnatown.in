import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  ListingReportRepository,
  ReportVisibility,
  StoredListingReport,
} from '../domain/listing-report';

/** ISO-8601 UTC text with microseconds (matches `TimestampSchema`). */
const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );

// Never selects `reporter_subject_hash`.
const columns = Prisma.sql`
  r.id, r.target_type AS "targetType", r.target_id AS "targetId",
  r.reporter_user_id AS "reporterUserId", r.reason, r.details,
  r.city_id AS "cityId", r.area_id AS "areaId", r.status, r.resolution,
  r.resolution_note AS "resolutionNote", r.resolved_by AS "resolvedBy",
  ${timestamp('r.resolved_at')} AS "resolvedAt",
  ${timestamp('r.created_at')} AS "createdAt", r.version`;

/** Fails closed: a missing or empty visibility matches no rows. */
function visible(visibility: ReportVisibility | undefined): Prisma.Sql {
  if (!visibility) return Prisma.sql`FALSE`;
  if (visibility.platformWide) return Prisma.sql`TRUE`;
  if (!visibility.areaIds.length && !visibility.cityIds.length)
    return Prisma.sql`FALSE`;
  return Prisma.sql`(r.area_id = ANY(${[...visibility.areaIds]}::uuid[])
    OR r.city_id = ANY(${[...visibility.cityIds]}::uuid[]))`;
}

/** Parameterized SQL only; Admin owns `listing_reports`. */
@Injectable()
export class PrismaListingReportRepository implements ListingReportRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async openOrExisting(
    tx: TxContext,
    row: Parameters<ListingReportRepository['openOrExisting']>[1],
  ) {
    const client = this.database.client(tx);
    const inserted = await client.$queryRaw<StoredListingReport[]>`
      INSERT INTO listing_reports AS r (id, target_type, target_id,
        reporter_user_id, reporter_subject_hash, reason, details, city_id,
        area_id, created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.targetType}, ${row.targetId}::uuid,
        ${row.reporterUserId}::uuid, ${row.subjectHash}, ${row.reason},
        ${row.details}, ${row.cityId}::uuid, ${row.areaId}::uuid, ${row.at},
        ${row.at})
      ON CONFLICT (target_id, reporter_subject_hash) WHERE status = 'open'
      DO NOTHING
      RETURNING ${columns}`;
    if (inserted[0]) return { report: inserted[0], created: true };
    const existing = await client.$queryRaw<StoredListingReport[]>`
      SELECT ${columns} FROM listing_reports r
      WHERE r.target_id = ${row.targetId}::uuid
        AND r.reporter_subject_hash = ${row.subjectHash}
        AND r.status = 'open'`;
    // A concurrent resolve between the conflict and this read: retry later.
    if (!existing[0]) throw new DomainError('COMMON_CONFLICT');
    return { report: existing[0], created: false };
  }

  async find(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredListingReport | null> {
    const rows = await this.database
      .client(tx)
      .$queryRaw<StoredListingReport[]>(
        Prisma.sql`SELECT ${columns} FROM listing_reports r
        WHERE r.id = ${id}::uuid ${lock ? Prisma.sql`FOR UPDATE` : Prisma.empty}`,
      );
    return rows[0] ?? null;
  }

  page(
    tx: TxContext,
    input: Parameters<ListingReportRepository['page']>[1],
  ): Promise<StoredListingReport[]> {
    return this.database.client(tx).$queryRaw<StoredListingReport[]>(
      Prisma.sql`SELECT ${columns} FROM listing_reports r
        WHERE ${visible(input.visibility)}
          ${input.status ? Prisma.sql`AND r.status = ${input.status}` : Prisma.empty}
          ${
            input.targetId
              ? Prisma.sql`AND r.target_id = ${input.targetId}::uuid`
              : Prisma.empty
          }
          ${
            input.after
              ? Prisma.sql`AND (r.created_at, r.id) <
                  (${input.after[0]}::timestamptz, ${input.after[1]}::uuid)`
              : Prisma.empty
          }
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT ${input.limit + 1}`,
    );
  }

  async openCounts(
    tx: TxContext,
    targetIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (!targetIds.length) return new Map();
    if (targetIds.length > 50)
      throw new Error('LISTING_REPORT_BATCH_TOO_LARGE');
    const rows = await this.database.client(tx).$queryRaw<
      { targetId: string; count: number }[]
    >`
      SELECT target_id AS "targetId", count(*)::int AS count
      FROM listing_reports
      WHERE target_id = ANY(${[...targetIds]}::uuid[]) AND status = 'open'
      GROUP BY target_id`;
    return new Map(rows.map((row) => [row.targetId, row.count]));
  }

  async resolve(
    tx: TxContext,
    input: Parameters<ListingReportRepository['resolve']>[1],
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE listing_reports SET status = 'resolved',
        resolution = ${input.resolution}, resolution_note = ${input.note},
        resolved_by = ${input.resolvedBy}::uuid, resolved_at = ${input.at},
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
        AND status = 'open'`;
    return count === 1;
  }
}
