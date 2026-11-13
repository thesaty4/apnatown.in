import { Injectable } from '@nestjs/common';
import type { MediaLinkTarget } from '@apnatown/shared';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  GalleryRepository,
  MediaManagerList,
  OwnerListPosition,
  StoredGalleryPhoto,
} from '../domain/media-gallery';

const iso = (column: string) =>
  Prisma.raw(`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`);

interface GalleryRow extends Omit<StoredGalleryPhoto, 'linkedTarget'> {
  linkedTargetType: MediaLinkTarget['targetType'] | null;
  linkedTargetId: string | null;
}

const galleryColumns = Prisma.sql`
  g.id::text AS id, g.business_id::text AS "businessId", g.media_asset_id::text AS "assetId",
  g.caption, g.linked_target_type AS "linkedTargetType", g.linked_target_id::text AS "linkedTargetId",
  g.sort_order AS "sortOrder", a.moderation_state AS "moderationState", g.version,
  ${iso('g.created_at')} AS "createdAt"`;

function toPhoto(row: GalleryRow): StoredGalleryPhoto {
  const { linkedTargetType, linkedTargetId, ...rest } = row;
  return {
    ...rest,
    linkedTarget: linkedTargetType && linkedTargetId
      ? { targetType: linkedTargetType, targetId: linkedTargetId }
      : null,
  };
}

/** Owner Gallery manager rows plus per-list order versions (Media-owned). */
@Injectable()
export class PrismaGalleryRepository implements GalleryRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async page(tx: TxContext, input: { businessId: string; limit: number; after?: OwnerListPosition }) {
    const after = input.after
      ? Prisma.sql`AND (g.sort_order, g.id) > (${input.after.sortOrder}::integer, ${input.after.id}::uuid)`
      : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<GalleryRow[]>(Prisma.sql`
      SELECT ${galleryColumns} FROM gallery_photos g JOIN media_assets a ON a.id = g.media_asset_id
      WHERE g.business_id = ${input.businessId}::uuid AND g.deleted_at IS NULL ${after}
      ORDER BY g.sort_order, g.id LIMIT ${input.limit + 1}`);
    return rows.map(toPhoto);
  }

  async find(tx: TxContext, input: { businessId: string; id: string; lock: boolean }) {
    const rows = await this.db.client(tx).$queryRaw<GalleryRow[]>(Prisma.sql`
      SELECT ${galleryColumns} FROM gallery_photos g JOIN media_assets a ON a.id = g.media_asset_id
      WHERE g.id = ${input.id}::uuid AND g.business_id = ${input.businessId}::uuid
        AND g.deleted_at IS NULL
      ${input.lock ? Prisma.sql`FOR UPDATE OF g` : Prisma.empty}`);
    return rows[0] ? toPhoto(rows[0]) : null;
  }

  async stats(tx: TxContext, businessId: string) {
    const rows = await this.db.client(tx).$queryRaw<{ count: number; next: number }[]>`
      SELECT count(*)::integer AS count, coalesce(max(sort_order) + 1, 0)::integer AS next
      FROM gallery_photos WHERE business_id = ${businessId}::uuid AND deleted_at IS NULL`;
    return { count: rows[0]?.count ?? 0, nextSortOrder: rows[0]?.next ?? 0 };
  }

  async insert(tx: TxContext, row: StoredGalleryPhoto, at: Date) {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      INSERT INTO gallery_photos (id, business_id, media_asset_id, caption, linked_target_type,
        linked_target_id, sort_order, version, created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.businessId}::uuid, ${row.assetId}::uuid, ${row.caption},
        ${row.linkedTarget?.targetType ?? null}, ${row.linkedTarget?.targetId ?? null}::uuid,
        ${row.sortOrder}, 1, ${at}, ${at})
      ON CONFLICT (media_asset_id) WHERE deleted_at IS NULL DO NOTHING
      RETURNING id::text AS id`;
    return rows.length ? 'created' as const : 'asset_in_use' as const;
  }

  async update(tx: TxContext, input: {
    id: string; caption: string | null; linkedTarget: MediaLinkTarget | null; at: Date;
  }) {
    await this.db.client(tx).$executeRaw`
      UPDATE gallery_photos SET caption = ${input.caption},
        linked_target_type = ${input.linkedTarget?.targetType ?? null},
        linked_target_id = ${input.linkedTarget?.targetId ?? null}::uuid,
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND deleted_at IS NULL`;
    const rows = await this.db.client(tx).$queryRaw<GalleryRow[]>(Prisma.sql`
      SELECT ${galleryColumns} FROM gallery_photos g JOIN media_assets a ON a.id = g.media_asset_id
      WHERE g.id = ${input.id}::uuid`);
    if (!rows[0]) throw new Error('GALLERY_PHOTO_UPDATE_LOST');
    return toPhoto(rows[0]);
  }

  async softDelete(tx: TxContext, id: string, at: Date) {
    await this.db.client(tx).$executeRaw`
      UPDATE gallery_photos SET deleted_at = ${at}, version = version + 1, updated_at = ${at}
      WHERE id = ${id}::uuid AND deleted_at IS NULL`;
  }

  async countPublicTargets(tx: TxContext, businessId: string, targets: readonly MediaLinkTarget[]) {
    let total = 0;
    for (const [type, view] of [['product', 'products_public_discovery'], ['service', 'services_public_discovery']] as const) {
      const ids = [...new Set(targets.filter((t) => t.targetType === type).map((t) => t.targetId))];
      if (!ids.length) continue;
      const rows = await this.db.client(tx).$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT count(*)::integer AS count FROM ${Prisma.raw(view)}
        WHERE business_id = ${businessId}::uuid AND id = ANY(${ids}::uuid[])`);
      total += rows[0]?.count ?? 0;
    }
    return total;
  }

  async lockOrder(tx: TxContext, businessId: string, list: MediaManagerList) {
    const client = this.db.client(tx);
    await client.$executeRaw`
      INSERT INTO media_manager_orders (business_id, list_kind) VALUES (${businessId}::uuid, ${list})
      ON CONFLICT (business_id, list_kind) DO NOTHING`;
    const rows = await client.$queryRaw<{ version: number }[]>`
      SELECT version FROM media_manager_orders
      WHERE business_id = ${businessId}::uuid AND list_kind = ${list} FOR UPDATE`;
    if (!rows[0]) throw new Error('MEDIA_ORDER_LOCK_LOST');
    return rows[0].version;
  }

  async orderVersion(tx: TxContext, businessId: string, list: MediaManagerList) {
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>`
      SELECT version FROM media_manager_orders
      WHERE business_id = ${businessId}::uuid AND list_kind = ${list}`;
    return rows[0]?.version ?? 1;
  }

  async bumpOrder(tx: TxContext, businessId: string, list: MediaManagerList, at: Date) {
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>`
      UPDATE media_manager_orders SET version = version + 1, updated_at = ${at}
      WHERE business_id = ${businessId}::uuid AND list_kind = ${list} RETURNING version`;
    if (!rows[0]) throw new Error('MEDIA_ORDER_LOCK_LOST');
    return rows[0].version;
  }

  async orderedIds(tx: TxContext, businessId: string, list: MediaManagerList) {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>(list === 'gallery'
      ? Prisma.sql`SELECT id::text AS id FROM gallery_photos
          WHERE business_id = ${businessId}::uuid AND deleted_at IS NULL ORDER BY sort_order, id`
      : Prisma.sql`SELECT id::text AS id FROM videos
          WHERE business_id = ${businessId}::uuid AND owner_deleted_at IS NULL ORDER BY sort_order, id`);
    return rows.map((row) => row.id);
  }

  async applyOrder(tx: TxContext, businessId: string, list: MediaManagerList, ids: readonly string[], at: Date) {
    if (!ids.length) return;
    const table = Prisma.raw(list === 'gallery' ? 'gallery_photos' : 'videos');
    const live = Prisma.raw(list === 'gallery' ? 't.deleted_at IS NULL' : 't.owner_deleted_at IS NULL');
    // Only sort_order/updated_at change; version tracks content, not order.
    await this.db.client(tx).$executeRaw(Prisma.sql`
      UPDATE ${table} t SET sort_order = o.position - 1, updated_at = ${at}
      FROM unnest(${[...ids]}::uuid[]) WITH ORDINALITY o(id, position)
      WHERE t.id = o.id AND t.business_id = ${businessId}::uuid AND ${live}
        AND t.sort_order IS DISTINCT FROM (o.position - 1)::integer`);
  }
}
