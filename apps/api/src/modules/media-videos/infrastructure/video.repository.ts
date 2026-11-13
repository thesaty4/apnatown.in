import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  ReelRankSnapshot,
  ReelRankEntry,
  StoredModerationVideo,
  StoredVideo,
  StoredVideoReport,
  VideoFeedRecord,
  VideoModerationCounts,
  VideoModerationScope,
  VideoFeedFilter,
  VideoPosition,
  VideoReportPosition,
  VideoRepository,
} from '../domain/videos';

const rankEntriesSchema = z.array(
  z.strictObject({
    videoId: z.string().uuid(),
    score10: z.string().regex(/^\d+$/u),
    ordinal: z.number().int().positive(),
  }),
);
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

export function scopePredicate(scope: VideoModerationScope, businessAlias = 'b') {
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

  async rankCandidates(tx: TxContext): Promise<ReelRankEntry[]> {
    const rows = await this.database.client(tx).$queryRaw<ReelRankEntry[]>`
      WITH candidates AS (
        SELECT v.id,
          (COALESCE(c.like_count, v.like_count) * 10::numeric
            + v.view_count::numeric) AS score10,
          ROW_NUMBER() OVER (ORDER BY v.created_at DESC, v.id DESC) AS candidate_ordinal
        FROM videos v
        JOIN businesses b ON b.id = v.business_id
        JOIN users u ON u.id = b.owner_user_id
        LEFT JOIN video_engagement_counts c ON c.video_id = v.id
        WHERE v.status = 'approved' AND v.show_in_reels = TRUE
          AND v.owner_deleted_at IS NULL
          AND b.status = 'approved' AND b.deleted_at IS NULL
          AND u.account_status = 'active' AND u.deleted_at IS NULL
      ), ranked AS (
        SELECT id, score10::text AS "score10",
          ROW_NUMBER() OVER (ORDER BY score10 DESC, candidate_ordinal)::int AS ordinal
        FROM candidates
      )
      SELECT id AS "videoId", "score10", ordinal
      FROM ranked
      ORDER BY ordinal`;
    return rankEntriesSchema.parse(rows);
  }

  async insertRankSnapshot(
    tx: TxContext,
    snapshot: ReelRankSnapshot,
  ): Promise<void> {
    await this.database.client(tx).$executeRaw`
      INSERT INTO reel_rank_snapshots (
        id, session_subject_hash, ranked_items, created_at, expires_at
      ) VALUES (
        ${snapshot.id}::uuid, ${snapshot.sessionSubjectHash},
        ${JSON.stringify(snapshot.rankedItems)}::jsonb,
        ${snapshot.createdAt}, ${snapshot.expiresAt}
      )`;
  }

  async findRankSnapshot(
    tx: TxContext,
    id: string,
  ): Promise<ReelRankSnapshot | null> {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{
        id: string;
        sessionSubjectHash: Uint8Array;
        rankedItems: unknown;
        createdAt: Date;
        expiresAt: Date;
      }>
    >`
      SELECT id, session_subject_hash AS "sessionSubjectHash",
        ranked_items AS "rankedItems", created_at AS "createdAt",
        expires_at AS "expiresAt"
      FROM reel_rank_snapshots
      WHERE id = ${id}::uuid`;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      sessionSubjectHash: row.sessionSubjectHash,
      rankedItems: rankEntriesSchema.parse(row.rankedItems),
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    };
  }

  feedPage(
    tx: TxContext,
    input: VideoFeedFilter & {
      snapshotId: string;
      afterOrdinal: number;
      limit: number;
    },
  ): Promise<VideoFeedRecord[]> {
    const filter = this.feedFilter(input);
    const distance = input.lat !== undefined && input.lng !== undefined
      ? Prisma.sql`ST_Distance(
          b.location,
          ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography
        ) / 1000.0`
      : Prisma.sql`NULL::double precision`;
    return this.database.client(tx).$queryRaw<VideoFeedRecord[]>(Prisma.sql`
      WITH ranked AS (
        SELECT (entry->>'videoId')::uuid AS video_id,
          (entry->>'ordinal')::int AS ordinal
        FROM reel_rank_snapshots s
        CROSS JOIN LATERAL jsonb_array_elements(s.ranked_items) entry
        WHERE s.id = ${input.snapshotId}::uuid
      )
      SELECT ${videoColumns},
        r.ordinal,
        b.name_en AS "businessNameEn", b.name_hi AS "businessNameHi",
        (b.verified_at IS NOT NULL) AS verified,
        ${distance}::double precision AS "distanceKm",
        CASE
          WHEN COALESCE(bs.temporarily_closed, FALSE) THEN FALSE
          WHEN bh.business_id IS NULL THEN NULL
          WHEN bh.is_closed THEN FALSE
          ELSE (timezone('Asia/Kolkata', now())::time
            BETWEEN bh.opens_at AND bh.closes_at)
        END AS "isOpen",
        v.view_count::text AS "viewCount",
        COALESCE(vc.like_count, v.like_count)::text AS "likeCount",
        v.comment_count::text AS "commentCount",
        COALESCE(vc.share_count, v.share_count)::text AS "shareCount"
      FROM ranked r
      JOIN videos v ON v.id = r.video_id
      JOIN businesses b ON b.id = v.business_id
      JOIN users u ON u.id = b.owner_user_id
      LEFT JOIN video_engagement_counts vc ON vc.video_id = v.id
      LEFT JOIN business_settings bs ON bs.business_id = b.id
      LEFT JOIN business_hours bh ON bh.business_id = b.id
        AND bh.day_of_week = EXTRACT(DOW FROM timezone('Asia/Kolkata', now()))::int
      WHERE r.ordinal > ${input.afterOrdinal}
        AND v.status = 'approved' AND v.show_in_reels = TRUE
        AND v.owner_deleted_at IS NULL
        AND b.status = 'approved' AND b.deleted_at IS NULL
        AND u.account_status = 'active' AND u.deleted_at IS NULL
        ${filter}
      ORDER BY r.ordinal ASC
      LIMIT ${input.limit + 1}`);
  }

  private feedFilter(input: VideoFeedFilter) {
    if (input.pill === 'following') {
      return input.userId
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM follows f
            WHERE f.user_id = ${input.userId}::uuid
              AND f.business_id = b.id AND f.unfollowed_at IS NULL
          )`
        : Prisma.sql`AND FALSE`;
    }
    if (input.pill === 'nearby') {
      if (input.lat === undefined || input.lng === undefined)
        return Prisma.sql`AND FALSE`;
      return Prisma.sql`AND b.location IS NOT NULL
        AND ST_DWithin(
          b.location,
          ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography,
          2500
        )`;
    }
    if (input.pill === 'category') {
      if (!input.category) return Prisma.sql`AND FALSE`;
      return Prisma.sql`AND EXISTS (
        SELECT 1
        FROM business_categories bc
        JOIN categories c ON c.id = bc.category_id
        WHERE bc.business_id = b.id AND c.slug = ${input.category}
          AND c.active = TRUE
      )`;
    }
    return Prisma.empty;
  }

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
      JOIN users u ON u.id = b.owner_user_id
      WHERE v.id = ${id}::uuid AND v.status = 'approved'
        AND v.show_in_reels = TRUE AND v.owner_deleted_at IS NULL
        AND b.status = 'approved' AND b.deleted_at IS NULL
        AND u.account_status = 'active' AND u.deleted_at IS NULL`);
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
               AND b.status = 'approved' AND b.deleted_at IS NULL
               AND u.account_status = 'active' AND u.deleted_at IS NULL) AS public
      FROM videos v
      JOIN businesses b ON b.id = v.business_id
      JOIN users u ON u.id = b.owner_user_id
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
