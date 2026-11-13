import { Injectable } from '@nestjs/common';
import type { MediaLinkTarget } from '@apnatown/shared';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  OwnerVideoChange,
  OwnerVideoRepository,
  StoredOwnerVideo,
} from '../domain/media-gallery';

const iso = (column: string) =>
  Prisma.raw(`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`);

/** Owner edit/delete of the caller's own video links (Media-owned rows). */
@Injectable()
export class PrismaOwnerVideoRepository implements OwnerVideoRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async find(tx: TxContext, input: { businessId: string; id: string; lock: boolean }) {
    const client = this.db.client(tx);
    const rows = await client.$queryRaw<Omit<StoredOwnerVideo, 'links'>[]>(Prisma.sql`
      SELECT v.id::text AS id, v.business_id::text AS "businessId", v.source AS provider,
        v.provider_kind AS kind, v.provider_video_id AS "providerId", v.caption, v.hashtags,
        v.show_in_gallery AS "showInGallery", v.show_in_reels AS "showInReels", v.status,
        v.version, ${iso('v.created_at')} AS "createdAt", v.decision_reason AS "decisionReason",
        ${iso('v.owner_deleted_at')} AS "ownerDeletedAt",
        v.thumbnail_asset_id::text AS "thumbnailAssetId"
      FROM videos v
      WHERE v.id = ${input.id}::uuid AND v.business_id = ${input.businessId}::uuid
      ${input.lock ? Prisma.sql`FOR UPDATE` : Prisma.empty}`);
    const row = rows[0];
    if (!row) return null;
    const links = await client.$queryRaw<MediaLinkTarget[]>`
      SELECT target_type AS "targetType", target_id::text AS "targetId"
      FROM video_links WHERE video_id = ${input.id}::uuid ORDER BY sort_order, target_id`;
    return { ...row, links };
  }

  async update(tx: TxContext, change: OwnerVideoChange) {
    const client = this.db.client(tx);
    const moderation = change.resetModeration
      ? Prisma.sql`, approved_at = NULL, decision_reason = NULL`
      : Prisma.empty;
    const updated = await client.$executeRaw(Prisma.sql`
      UPDATE videos SET source = ${change.source.provider}, provider_kind = ${change.source.kind},
        provider_video_id = ${change.source.providerId}, caption = ${change.caption},
        hashtags = ${change.hashtags}::text[], show_in_gallery = ${change.showInGallery},
        show_in_reels = ${change.showInReels},
        thumbnail_asset_id = ${change.thumbnailAssetId}::uuid, status = ${change.status}
        ${moderation}, version = version + 1, updated_at = ${change.at}
      WHERE id = ${change.id}::uuid AND version = ${change.expectedVersion}
        AND owner_deleted_at IS NULL`);
    if (updated !== 1) return false;
    if (change.links) {
      await client.$executeRaw`DELETE FROM video_links WHERE video_id = ${change.id}::uuid`;
      if (change.links.length)
        await client.$executeRaw(Prisma.sql`
          INSERT INTO video_links (video_id, target_type, target_id, sort_order)
          SELECT ${change.id}::uuid, l.target_type, l.target_id, (l.position - 1)::integer
          FROM unnest(${change.links.map((l) => l.targetType)}::text[],
                      ${change.links.map((l) => l.targetId)}::uuid[])
            WITH ORDINALITY l(target_type, target_id, position)`);
    }
    return true;
  }

  async ownerDelete(tx: TxContext, input: { id: string; expectedVersion: number; at: Date }) {
    // Tombstone: removed + owner_deleted_at; never restored by report dismissal.
    const updated = await this.db.client(tx).$executeRaw`
      UPDATE videos SET status = 'removed', owner_deleted_at = ${input.at},
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
        AND owner_deleted_at IS NULL`;
    return updated === 1;
  }
}
