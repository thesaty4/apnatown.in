import { Injectable } from '@nestjs/common';
import type { BusinessGalleryFilter, MediaLinkTarget, MediaPhotoPlacementType } from '@apnatown/shared';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  GalleryPosition,
  LinkedVideoPosition,
  PublicGalleryRecord,
  PublicMediaReadRepository,
  PublicVideoRecord,
  StoredPublicImage,
  VideoListPosition,
} from '../domain/media-gallery';

const iso = (column: string) =>
  Prisma.raw(`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`);

const videoColumns = Prisma.sql`
  v.id::text AS id, v.business_id::text AS "businessId", v.source AS provider,
  v.provider_kind AS kind, v.provider_video_id AS "providerId", v.caption, v.hashtags,
  v.view_count::text AS "viewCount", ${iso('v.created_at')} AS "createdAt", v.sort_order AS "rankOrder",
  v.thumbnail_asset_id::text AS "thumbAssetId", v.thumbnail_version AS "thumbVersion",
  v.thumbnail_width AS "thumbWidth", v.thumbnail_height AS "thumbHeight", v.thumbnail_variants AS "thumbVariants"`;

interface VideoRow extends Omit<PublicVideoRecord, 'thumbnail'> {
  thumbAssetId: string | null;
  thumbVersion: number | null;
  thumbWidth: number | null;
  thumbHeight: number | null;
  thumbVariants: unknown;
}

function image(assetId: string | null, version: number | null, width: number | null,
  height: number | null, variants: unknown): StoredPublicImage | null {
  return assetId && version && width && height ? { assetId, version, width, height, variants } : null;
}

function toVideo(row: VideoRow): PublicVideoRecord {
  const { thumbAssetId, thumbVersion, thumbWidth, thumbHeight, thumbVariants, ...rest } = row;
  return { ...rest, thumbnail: image(thumbAssetId, thumbVersion, thumbWidth, thumbHeight, thumbVariants) };
}

const FILTERS: Readonly<Record<BusinessGalleryFilter, Prisma.Sql>> = {
  all: Prisma.empty,
  photos: Prisma.sql`AND g.item_kind = 'photo'`,
  videos: Prisma.sql`AND g.item_kind = 'video'`,
  product: Prisma.sql`AND g.linked_target_type = 'product'`,
  service: Prisma.sql`AND g.linked_target_type = 'service'`,
};

/** Public reads over Media-owned public views and the listing public views. */
@Injectable()
export class PrismaPublicMediaReadRepository implements PublicMediaReadRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async publicBusinessId(tx: TxContext, slug: string) {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM businesses_public_context WHERE slug = ${slug} LIMIT 1`;
    return rows[0]?.id ?? null;
  }

  async galleryPage(tx: TxContext, input: {
    businessId: string; filter: BusinessGalleryFilter; limit: number; after?: GalleryPosition;
  }) {
    const after = input.after
      ? Prisma.sql`AND (g.rank_group, g.rank_order, g.rank_key) >
          (${input.after.group}::integer, ${input.after.order}::integer, ${input.after.key}::text)`
      : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<Array<Omit<PublicGalleryRecord, 'image' | 'linkedTarget'> & {
      linkedTargetType: MediaLinkTarget['targetType'] | null; linkedTargetId: string | null;
      assetId: string | null; assetVersion: number | null; width: number | null; height: number | null; variants: unknown;
    }>>(Prisma.sql`
      SELECT g.rank_group AS "rankGroup", g.rank_order AS "rankOrder", g.rank_key AS "rankKey",
        g.item_kind AS "itemKind", g.placement_type AS "placementType",
        g.placement_id::text AS "placementId", g.video_id::text AS "videoId", g.caption,
        g.linked_target_type AS "linkedTargetType", g.linked_target_id::text AS "linkedTargetId",
        g.asset_id::text AS "assetId", g.asset_version AS "assetVersion", g.width, g.height, g.variants
      FROM media_public_gallery_items g
      WHERE g.business_id = ${input.businessId}::uuid ${FILTERS[input.filter]} ${after}
      ORDER BY g.rank_group, g.rank_order, g.rank_key LIMIT ${input.limit + 1}`);
    return rows.map(({ linkedTargetType, linkedTargetId, assetId, assetVersion, width, height, variants, ...rest }) => ({
      ...rest,
      linkedTarget: linkedTargetType && linkedTargetId
        ? { targetType: linkedTargetType, targetId: linkedTargetId } : null,
      image: image(assetId, assetVersion, width, height, variants),
    }));
  }

  async videosByIds(tx: TxContext, ids: readonly string[]) {
    if (!ids.length) return [];
    const rows = await this.db.client(tx).$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT ${videoColumns} FROM media_public_videos v WHERE v.id = ANY(${[...ids]}::uuid[])`);
    return rows.map(toVideo);
  }

  async businessVideos(tx: TxContext, input: { businessId: string; limit: number; after?: VideoListPosition }) {
    const after = input.after
      ? Prisma.sql`AND (v.sort_order, v.id) > (${input.after.order}::integer, ${input.after.id}::uuid)`
      : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT ${videoColumns} FROM media_public_videos v
      WHERE v.business_id = ${input.businessId}::uuid AND v.show_in_reels ${after}
      ORDER BY v.sort_order, v.id LIMIT ${input.limit + 1}`);
    return rows.map(toVideo);
  }

  async linkedVideos(tx: TxContext, input: { target: MediaLinkTarget; limit: number; after?: LinkedVideoPosition }) {
    const after = input.after
      ? Prisma.sql`AND (v.created_at, v.id) < (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    const target = Prisma.raw(input.target.targetType === 'product'
      ? 'products_public_discovery' : 'services_public_discovery');
    // Linked item must still be public and belong to the video's business.
    const rows = await this.db.client(tx).$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT ${videoColumns} FROM media_public_videos v
      JOIN video_links l ON l.video_id = v.id AND l.target_type = ${input.target.targetType}
        AND l.target_id = ${input.target.targetId}::uuid
      JOIN ${target} t ON t.id = l.target_id AND t.business_id = v.business_id
      WHERE (v.show_in_reels OR v.show_in_gallery) ${after}
      ORDER BY v.created_at DESC, v.id DESC LIMIT ${input.limit + 1}`);
    return rows.map(toVideo);
  }

  async photoPlacementBusiness(tx: TxContext, input: {
    assetId: string; placementType: MediaPhotoPlacementType; placementId: string;
  }) {
    // Gallery photos resolve through the Gallery view; listing images through
    // the exact current listing attachment (any public surface).
    const query = input.placementType === 'gallery_photo'
      ? Prisma.sql`SELECT business_id::text AS "businessId" FROM media_public_gallery_items
          WHERE placement_type = 'gallery_photo' AND placement_id = ${input.placementId}::uuid
            AND asset_id = ${input.assetId}::uuid LIMIT 1`
      : Prisma.sql`SELECT p.business_id::text AS "businessId" FROM media_public_listing_images i
          JOIN ${Prisma.raw(input.placementType === 'product_image'
            ? 'products_public_discovery' : 'services_public_discovery')} p ON p.id = i.placement_id
          WHERE i.placement_type = ${input.placementType === 'product_image' ? 'product' : 'service'}
            AND i.placement_id = ${input.placementId}::uuid AND i.asset_id = ${input.assetId}::uuid LIMIT 1`;
    const rows = await this.db.client(tx).$queryRaw<{ businessId: string }[]>(query);
    return rows[0]?.businessId ?? null;
  }

  async insertPhotoReport(tx: TxContext, input: {
    id: string; assetId: string; placementType: MediaPhotoPlacementType; placementId: string;
    businessId: string; reporterUserId: string | null; reporterSubjectHash: Uint8Array;
    reason: string; details: string | null; createdAt: Date;
  }) {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      INSERT INTO media_reports (id, target_kind, asset_id, business_id, placement_type, placement_id,
        reporter_user_id, reporter_subject_hash, reason, details, status, version, created_at)
      VALUES (${input.id}::uuid, 'photo', ${input.assetId}::uuid, ${input.businessId}::uuid,
        ${input.placementType}, ${input.placementId}::uuid, ${input.reporterUserId}::uuid,
        ${Buffer.from(input.reporterSubjectHash)}, ${input.reason}, ${input.details}, 'open', 1,
        ${input.createdAt})
      ON CONFLICT (asset_id, placement_type, placement_id, reporter_subject_hash)
        WHERE target_kind = 'photo' AND status = 'open'
      DO UPDATE SET id = media_reports.id
      RETURNING id::text AS id`;
    if (!rows[0]) throw new Error('MEDIA_REPORT_INSERT_FAILED');
    return rows[0].id;
  }
}
