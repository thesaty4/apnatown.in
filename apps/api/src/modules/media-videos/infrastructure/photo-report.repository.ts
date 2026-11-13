import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { PhotoReportRepository, StoredPhotoReport } from '../domain/media-reports';
import type { VideoModerationScope, VideoReportPosition } from '../domain/videos';
import { scopePredicate } from './video.repository';

type PhotoReportRow = Omit<StoredPhotoReport, 'publicImage'> & {
  isPublic: boolean; width: number; height: number; variants: unknown;
};

// The asset must still belong to the reported business; the preview is only
// projected while the exact placement is public in the Media read views.
const columns = Prisma.sql`
  r.id::text AS "reportId", r.asset_id::text AS "assetId", r.placement_type AS "placementType",
  r.placement_id::text AS "placementId", r.business_id::text AS "businessId",
  b.name_en AS "businessNameEn", b.name_hi AS "businessNameHi",
  b.city_id::text AS "cityId", b.area_id::text AS "areaId",
  r.reason, r.details, r.status, r.resolution, r.version AS "reportVersion",
  to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
  a.moderation_state AS "moderationState", a.version AS "targetVersion",
  a.width, a.height, a.variants,
  CASE r.placement_type
    WHEN 'gallery_photo' THEN EXISTS (SELECT 1 FROM media_public_gallery_items g
      WHERE g.placement_type = 'gallery_photo' AND g.placement_id = r.placement_id AND g.asset_id = r.asset_id)
    ELSE EXISTS (SELECT 1 FROM media_public_listing_images l
      WHERE l.placement_type = CASE r.placement_type WHEN 'product_image' THEN 'product' ELSE 'service' END
        AND l.placement_id = r.placement_id AND l.asset_id = r.asset_id)
  END AS "isPublic"`;
const source = Prisma.sql`
  FROM media_reports r
  JOIN businesses b ON b.id = r.business_id
  JOIN media_assets a ON a.id = r.asset_id AND a.business_id = r.business_id`;

const toReport = ({ isPublic, width, height, variants, ...row }: PhotoReportRow): StoredPhotoReport => ({
  ...row,
  publicImage: isPublic && row.moderationState === 'allowed'
    ? { assetId: row.assetId, version: row.targetVersion, width, height, variants }
    : null,
});

/** Photo targets of the shared `media_reports` table (admin queue/decisions). */
@Injectable()
export class PrismaPhotoReportRepository implements PhotoReportRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async page(tx: TxContext, input: {
    scope: VideoModerationScope; limit: number; after?: VideoReportPosition;
  }) {
    const after = input.after
      ? Prisma.sql`AND (r.created_at, r.id) < (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<PhotoReportRow[]>(Prisma.sql`
      SELECT ${columns} ${source}
      WHERE r.target_kind = 'photo' AND r.status = 'open' AND ${scopePredicate(input.scope)}
        ${after}
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT ${input.limit + 1}`);
    return rows.map(toReport);
  }

  async openCount(tx: TxContext, scope: VideoModerationScope) {
    const rows = await this.db.client(tx).$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count ${source}
      WHERE r.target_kind = 'photo' AND r.status = 'open' AND ${scopePredicate(scope)}`);
    return rows[0]?.count ?? 0;
  }

  async kind(tx: TxContext, reportId: string) {
    const rows = await this.db.client(tx).$queryRaw<{ kind: 'video' | 'photo' }[]>`
      SELECT target_kind AS kind FROM media_reports WHERE id = ${reportId}::uuid`;
    return rows[0]?.kind ?? null;
  }

  async find(tx: TxContext, reportId: string, lock: boolean) {
    const rows = await this.db.client(tx).$queryRaw<PhotoReportRow[]>(Prisma.sql`
      SELECT ${columns} ${source}
      WHERE r.id = ${reportId}::uuid AND r.target_kind = 'photo'
      ${lock ? Prisma.sql`FOR UPDATE OF r, a` : Prisma.empty}`);
    return rows[0] ? toReport(rows[0]) : null;
  }

  async removeAsset(tx: TxContext, input: { assetId: string; expectedVersion: number }) {
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>`
      UPDATE media_assets SET moderation_state = 'removed', version = version + 1
      WHERE id = ${input.assetId}::uuid AND version = ${input.expectedVersion}
        AND moderation_state = 'allowed'
      RETURNING version`;
    return rows[0]?.version ?? null;
  }

  async resolve(tx: TxContext, input: {
    reportId: string; expectedVersion: number; resolution: 'dismissed' | 'removed'; resolvedAt: Date;
  }) {
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>`
      UPDATE media_reports
      SET status = 'resolved', resolution = ${input.resolution},
          resolved_at = ${input.resolvedAt}, version = version + 1
      WHERE id = ${input.reportId}::uuid AND target_kind = 'photo'
        AND status = 'open' AND version = ${input.expectedVersion}
      RETURNING version`;
    return rows[0]?.version ?? null;
  }
}
