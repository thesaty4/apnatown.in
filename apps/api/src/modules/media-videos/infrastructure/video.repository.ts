import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  StoredModerationVideo,
  StoredVideo,
  StoredVideoReport,
  VideoModerationCounts,
  VideoModerationScope,
  VideoPosition,
  VideoReportPosition,
  VideoRepository,
} from '../domain/videos';

const createdAtSql = Prisma.raw(
  `to_char(v.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
);
const videoColumns = Prisma.sql`
  v.id, v.business_id AS "businessId", v.source AS provider,
  v.provider_kind AS kind, v.provider_video_id AS "providerId",
  v.caption, v.hashtags, v.show_in_gallery AS "showInGallery",
  v.show_in_reels AS "showInReels", v.status, v.version,
  ${createdAtSql} AS "createdAt"`;
const moderationColumns = Prisma.sql`
  ${videoColumns},
  v.decision_reason AS "decisionReason",
  ${Prisma.raw(`to_char(v.approved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`)} AS "approvedAt",
  v.owner_deleted_at AS "ownerDeletedAt",
  b.name_en AS "businessNameEn", b.name_hi AS "businessNameHi",
  b.city_id AS "cityId", b.area_id AS "areaId"`;

function scopePredicate(scope: VideoModerationScope, businessAlias = 'b') {
  const business = Prisma.raw(businessAlias);
  if (scope.platformWide) return Prisma.sql`TRUE`;
  const cities = scope.cityWideIds.length
    ? Prisma.sql`${business}.city_id IN (${Prisma.join(
        scope.cityWideIds.map((id) => Prisma.sql`${id}::uuid`),
      )})`
    : Prisma.sql`FALSE`;
  const areas = scope.areaIds.length
    ? Prisma.sql`${business}.area_id IN (${Prisma.join(
        scope.areaIds.map((id) => Prisma.sql`${id}::uuid`),
      )})`
    : Prisma.sql`FALSE`;
  return Prisma.sql`(${cities} OR ${areas})`;
}

type VideoReportRow = {
  reportId: string;
  videoId: string;
  reason: StoredVideoReport['reason'];
  details: string | null;
  reportStatus: StoredVideoReport['status'];
  resolution: StoredVideoReport['resolution'];
  reportVersion: number;
  targetVersion: number;
  reportCreatedAt: string;
} & Omit<StoredModerationVideo, 'id' | 'createdAt'> & {
    createdAt: string;
  };

function mapVideoReport(row: VideoReportRow): StoredVideoReport {
  const {
    reportId,
    videoId,
    reason,
    details,
    reportStatus,
    resolution,
    reportVersion,
    targetVersion,
    reportCreatedAt,
    ...video
  } = row;
  return {
    reportId,
    videoId,
    reason,
    details,
    status: reportStatus,
    resolution,
    reportVersion,
    targetVersion,
    createdAt: reportCreatedAt,
    video: { ...video, id: videoId },
  };
}

const videoReportColumns = Prisma.sql`
  r.id AS "reportId", r.video_id AS "videoId", r.reason,
  r.details, r.status AS "reportStatus", r.resolution,
  r.version AS "reportVersion", v.version AS "targetVersion",
  to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "reportCreatedAt",
  v.business_id AS "businessId", v.source AS provider,
  v.provider_kind AS kind, v.provider_video_id AS "providerId",
  v.caption, v.hashtags, v.show_in_gallery AS "showInGallery",
  v.show_in_reels AS "showInReels", v.status, v.version,
  to_char(v.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
  v.decision_reason AS "decisionReason",
  to_char(v.approved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "approvedAt",
  v.owner_deleted_at AS "ownerDeletedAt",
  b.name_en AS "businessNameEn", b.name_hi AS "businessNameHi",
  b.city_id AS "cityId", b.area_id AS "areaId"`;

@Injectable()
export class PrismaVideoRepository implements VideoRepository {
  constructor(private readonly database: PrismaDatabase) {}

  savedCards(tx: TxContext, ids: readonly string[]) {
    return this.database.client(tx).$queryRaw<
      Array<{ id: string; caption: string }>
    >`
      SELECT v.id, v.caption
      FROM videos v
      JOIN businesses b ON b.id = v.business_id
      JOIN users u ON u.id = b.owner_user_id
      WHERE v.id = ANY(${[...ids]}::uuid[])
        AND v.status = 'approved' AND v.show_in_reels = TRUE
        AND v.owner_deleted_at IS NULL
        AND b.status = 'approved' AND b.deleted_at IS NULL
        AND u.account_status = 'active' AND u.deleted_at IS NULL`;
  }

  async insert(tx: TxContext, row: StoredVideo): Promise<void> {
    await this.database.client(tx).$executeRaw`
      INSERT INTO videos (
        id, business_id, source, provider_kind, provider_video_id, caption,
        hashtags, show_in_gallery, show_in_reels, status, version,
        created_at, updated_at
      ) VALUES (
        ${row.id}::uuid, ${row.businessId}::uuid, ${row.provider},
        ${row.kind}, ${row.providerId}, ${row.caption}, ${row.hashtags}::text[],
        ${row.showInGallery}, ${row.showInReels}, 'pending', 1,
        ${new Date(row.createdAt)}, ${new Date(row.createdAt)}
      )`;
  }

  mine(
    tx: TxContext,
    input: { businessId: string; limit: number; after?: VideoPosition },
  ): Promise<StoredVideo[]> {
    const after = input.after
      ? Prisma.sql`AND (v.created_at, v.id) <
          (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredVideo[]>(Prisma.sql`
      SELECT ${videoColumns} FROM videos v
      WHERE v.business_id = ${input.businessId}::uuid
        AND v.owner_deleted_at IS NULL
        ${after}
      ORDER BY v.created_at DESC, v.id DESC LIMIT ${input.limit + 1}`);
  }

  async findPublic(tx: TxContext, id: string): Promise<StoredVideo | null> {
    const rows = await this.database.client(tx).$queryRaw<
      StoredVideo[]
    >(Prisma.sql`
      SELECT ${videoColumns} FROM videos v
      JOIN businesses b ON b.id = v.business_id
      WHERE v.id = ${id}::uuid AND v.status = 'approved'
        AND v.show_in_reels = TRUE AND v.owner_deleted_at IS NULL
        AND b.status = 'approved' AND b.deleted_at IS NULL`);
    return rows[0] ?? null;
  }

  async findForComments(
    tx: TxContext,
    id: string,
  ): Promise<{
    id: string;
    businessId: string;
    cityId: string | null;
    areaId: string | null;
    public: boolean;
    mediaKind: 'video' | 'reel';
  } | null> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{
        id: string;
        businessId: string;
        cityId: string | null;
        areaId: string | null;
        public: boolean;
        mediaKind: 'video' | 'reel';
      }>
    >(Prisma.sql`
      SELECT v.id, v.business_id AS "businessId",
             CASE WHEN v.provider_kind IN ('shorts', 'reel')
               THEN 'reel' ELSE 'video' END AS "mediaKind",
             b.city_id AS "cityId", b.area_id AS "areaId",
             (v.status = 'approved' AND v.show_in_reels = TRUE
               AND v.owner_deleted_at IS NULL
               AND b.status = 'approved' AND b.deleted_at IS NULL) AS public
      FROM videos v
      JOIN businesses b ON b.id = v.business_id
      WHERE v.id = ${id}::uuid
      FOR SHARE OF v, b`);
    return rows[0] ?? null;
  }

  moderationPage(
    tx: TxContext,
    input: {
      tab: StoredVideo['status'];
      scope: VideoModerationScope;
      limit: number;
      after?: VideoPosition;
    },
  ): Promise<StoredModerationVideo[]> {
    const after = input.after
      ? Prisma.sql`AND (v.created_at, v.id) <
          (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<
      StoredModerationVideo[]
    >(Prisma.sql`
      SELECT ${moderationColumns} FROM videos v
      JOIN businesses b ON b.id = v.business_id
      WHERE v.status = ${input.tab}
        AND v.owner_deleted_at IS NULL
        AND ${scopePredicate(input.scope)}
        ${after}
      ORDER BY v.created_at DESC, v.id DESC
      LIMIT ${input.limit + 1}`);
  }

  async moderationCounts(
    tx: TxContext,
    scope: VideoModerationScope,
  ): Promise<VideoModerationCounts> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<VideoModerationCounts>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE v.status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE v.status = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE v.status = 'rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE v.status = 'removed')::int AS removed,
        (
          SELECT COUNT(*)::int
          FROM media_reports r
          JOIN videos rv ON rv.id = r.video_id
          JOIN businesses rb ON rb.id = rv.business_id
          WHERE r.status = 'open' AND r.business_id = rv.business_id
            AND ${scopePredicate(scope, 'rb')}
        ) AS reported
      FROM videos v
      JOIN businesses b ON b.id = v.business_id
      WHERE v.owner_deleted_at IS NULL
        AND ${scopePredicate(scope)}`);
    return (
      rows[0] ?? {
        pending: 0,
        approved: 0,
        rejected: 0,
        removed: 0,
        reported: 0,
      }
    );
  }

  async reportedPage(
    tx: TxContext,
    input: {
      scope: VideoModerationScope;
      limit: number;
      after?: VideoReportPosition;
    },
  ): Promise<StoredVideoReport[]> {
    const after = input.after
      ? Prisma.sql`AND (r.created_at, r.id) <
          (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    const rows = await this.database.client(tx).$queryRaw<VideoReportRow[]>(
      Prisma.sql`
        SELECT ${videoReportColumns}
        FROM media_reports r
        JOIN videos v ON v.id = r.video_id
        JOIN businesses b ON b.id = v.business_id
        WHERE r.target_kind = 'video' AND r.status = 'open'
          AND r.business_id = v.business_id
          AND ${scopePredicate(input.scope)}
          ${after}
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT ${input.limit + 1}`,
    );
    return rows.map(mapVideoReport);
  }

  async insertVideoReport(
    tx: TxContext,
    input: {
      id: string;
      videoId: string;
      businessId: string;
      reporterUserId: string | null;
      reporterSubjectHash: Uint8Array;
      reason: StoredVideoReport['reason'];
      details: string | null;
      createdAt: Date;
    },
  ): Promise<string> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ id: string }>
    >(Prisma.sql`
      INSERT INTO media_reports (
        id, target_kind, video_id, business_id, reporter_user_id,
        reporter_subject_hash, reason, details, status, version, created_at
      ) VALUES (
        ${input.id}::uuid, 'video', ${input.videoId}::uuid,
        ${input.businessId}::uuid, ${input.reporterUserId}::uuid,
        ${Buffer.from(input.reporterSubjectHash)}, ${input.reason},
        ${input.details}, 'open', 1, ${input.createdAt}
      )
      ON CONFLICT (video_id, reporter_subject_hash)
        WHERE target_kind = 'video' AND status = 'open'
      DO UPDATE SET id = media_reports.id
      RETURNING id`);
    if (!rows[0]) throw new Error('MEDIA_REPORT_INSERT_FAILED');
    return rows[0].id;
  }

  async findReportForModeration(
    tx: TxContext,
    id: string,
  ): Promise<StoredVideoReport | null> {
    const rows = await this.database.client(tx).$queryRaw<VideoReportRow[]>(
      Prisma.sql`
        SELECT ${videoReportColumns}
        FROM media_reports r
        JOIN videos v ON v.id = r.video_id
        JOIN businesses b ON b.id = v.business_id
        WHERE r.id = ${id}::uuid AND r.target_kind = 'video'
          AND r.business_id = v.business_id
        FOR UPDATE OF r, v`,
    );
    return rows[0] ? mapVideoReport(rows[0]) : null;
  }

  async resolveReport(
    tx: TxContext,
    input: {
      reportId: string;
      expectedVersion: number;
      targetVersion: number;
      action: 'dismiss' | 'remove';
      reason: string | null;
      resolvedAt: Date;
    },
  ): Promise<{
    reportVersion: number;
    targetStatus: StoredVideo['status'];
    targetVersion: number;
  } | null> {
    const db = this.database.client(tx);
    let target: { status: StoredVideo['status']; version: number } | undefined;
    if (input.action === 'remove') {
      const rows = await db.$queryRaw<
        Array<{ status: StoredVideo['status']; version: number }>
      >(Prisma.sql`
        UPDATE videos
        SET status = 'removed', decision_reason = ${input.reason},
            approved_at = NULL, version = version + 1, updated_at = ${input.resolvedAt}
        WHERE id = (
          SELECT video_id FROM media_reports
          WHERE id = ${input.reportId}::uuid AND status = 'open'
        )
          AND version = ${input.targetVersion}
          AND status <> 'removed' AND owner_deleted_at IS NULL
        RETURNING status, version`);
      target = rows[0];
      if (!target) return null;
    } else {
      const rows = await db.$queryRaw<
        Array<{ status: StoredVideo['status']; version: number }>
      >(Prisma.sql`
        SELECT v.status, v.version FROM videos v
        JOIN media_reports r ON r.video_id = v.id
        WHERE r.id = ${input.reportId}::uuid AND r.status = 'open'
          AND v.version = ${input.targetVersion}
        FOR UPDATE OF v`);
      target = rows[0];
      if (!target) return null;
    }

    const reports = await db.$queryRaw<Array<{ version: number }>>(Prisma.sql`
      UPDATE media_reports
      SET status = 'resolved',
          resolution = ${input.action === 'dismiss' ? 'dismissed' : 'removed'},
          resolved_at = ${input.resolvedAt}, version = version + 1
      WHERE id = ${input.reportId}::uuid
        AND status = 'open' AND version = ${input.expectedVersion}
      RETURNING version`);
    if (!reports[0]) throw new Error('MEDIA_REPORT_RESOLUTION_RACE');
    return {
      reportVersion: reports[0].version,
      targetStatus: target.status,
      targetVersion: target.version,
    };
  }

  async findForModeration(
    tx: TxContext,
    id: string,
  ): Promise<StoredModerationVideo | null> {
    const rows = await this.database.client(tx).$queryRaw<
      StoredModerationVideo[]
    >(Prisma.sql`
      SELECT ${moderationColumns} FROM videos v
      JOIN businesses b ON b.id = v.business_id
      WHERE v.id = ${id}::uuid`);
    return rows[0] ?? null;
  }

  async decide(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status: StoredVideo['status'];
      decisionReason: string | null;
      approvedAt: Date | null;
    },
  ): Promise<StoredModerationVideo | null> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ id: string }>
    >(Prisma.sql`
      UPDATE videos
      SET status = ${input.status},
          decision_reason = ${input.decisionReason},
          approved_at = ${input.approvedAt},
          version = version + 1,
          updated_at = now()
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
        AND owner_deleted_at IS NULL
      RETURNING id`);
    if (!rows[0]) return null;
    return this.findForModeration(tx, rows[0].id);
  }
}
