import { Injectable } from '@nestjs/common';
import type { ServiceStatus } from '@apnatown/shared/services';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  ServiceFields,
  ServiceOwnerRepository,
  ServicePosition,
  StoredService,
  StoredServiceMedia,
} from '../application/service-owner-ports';

type Row = Omit<StoredService, 'media'> & { media: unknown };

// Paise are bounded by CHECK to 2^53-1, so float8 is exact.
const columns = Prisma.sql`
  id::text AS id,business_id::text AS "businessId",slug,
  category_id::text AS "categoryId",subcategory_id::text AS "subcategoryId",
  name_en AS "nameEn",name_hi AS "nameHi",description,price_type AS "priceType",
  price_from_paise::float8 AS "priceFromPaise",price_to_paise::float8 AS "priceToPaise",
  unit,included,excluded,service_area AS "serviceArea",
  experience_years AS "experienceYears",media,gallery_visible AS "galleryVisible",
  featured_selected AS "featuredSelected",status,version,
  created_at AS "createdAt",updated_at AS "updatedAt"`;

/** Only `{assetId,showInGallery}` is kept; the gallery default is deny (Q-50). */
function media(value: unknown): StoredServiceMedia[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return [];
    const { assetId, showInGallery } = item as Record<string, unknown>;
    return typeof assetId === 'string'
      ? [{ assetId, showInGallery: showInGallery === true }]
      : [];
  });
}

const stored = (row: Row): StoredService => ({ ...row, media: media(row.media) });
const mediaJson = (items: readonly StoredServiceMedia[]) =>
  JSON.stringify(
    items.map((item) => ({
      assetId: item.assetId,
      showInGallery: item.showInGallery,
    })),
  );

/** Parameterized SQL only; Services owns `services`. */
@Injectable()
export class PrismaServiceOwnerRepository implements ServiceOwnerRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async page(
    tx: TxContext,
    input: {
      businessId: string;
      status?: ServiceStatus;
      after?: ServicePosition;
      limit: number;
    },
  ): Promise<StoredService[]> {
    const status = input.status
      ? Prisma.sql`AND status=${input.status}`
      : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (created_at,id) < (${input.after.createdAt}::timestamptz,${input.after.id}::uuid)`
      : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<Row[]>`
      SELECT ${columns} FROM services
      WHERE business_id=${input.businessId}::uuid AND deleted_at IS NULL
        ${status} ${after}
      ORDER BY created_at DESC,id DESC
      LIMIT ${input.limit + 1}`;
    return rows.map(stored);
  }

  async find(
    tx: TxContext,
    input: { businessId: string; serviceId: string; lock?: boolean },
  ): Promise<StoredService | null> {
    const rows = await this.db.client(tx).$queryRaw<Row[]>`
      SELECT ${columns} FROM services
      WHERE id=${input.serviceId}::uuid AND business_id=${input.businessId}::uuid
        AND deleted_at IS NULL
      ${input.lock ? Prisma.sql`FOR UPDATE` : Prisma.empty}`;
    return rows[0] ? stored(rows[0]) : null;
  }

  async allocateSlug(tx: TxContext, base: string): Promise<string> {
    const client = this.db.client(tx);
    // Serializes concurrent creates sharing a slug base until commit.
    await client.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${`service.slug:${base}`}, 0))`;
    // Deleted rows keep their slug (UNIQUE), so they are included.
    const rows = await client.$queryRaw<{ slug: string }[]>`
      SELECT slug FROM services WHERE slug=${base} OR slug LIKE ${`${base}-%`}`;
    const taken = new Set(rows.map((row) => row.slug));
    if (!taken.has(base)) return base;
    for (let suffix = 2; ; suffix += 1) {
      const candidate = `${base}-${suffix}`;
      if (!taken.has(candidate)) return candidate;
    }
  }

  async insert(
    tx: TxContext,
    row: ServiceFields & { id: string; businessId: string; slug: string; at: Date },
  ): Promise<StoredService> {
    const rows = await this.db.client(tx).$queryRaw<Row[]>`
      INSERT INTO services (id,business_id,category_id,subcategory_id,slug,name_en,
        name_hi,description,price_type,price_from_paise,price_to_paise,unit,included,
        excluded,service_area,media,gallery_visible,featured_selected,status,version,
        created_at,updated_at)
      VALUES (${row.id}::uuid,${row.businessId}::uuid,${row.categoryId}::uuid,
        ${row.subcategoryId}::uuid,${row.slug},${row.nameEn},${row.nameHi},
        ${row.description},${row.priceType},${row.priceFromPaise}::bigint,
        ${row.priceToPaise}::bigint,${row.unit},${row.included}::text[],
        ${row.excluded}::text[],${row.serviceArea},${mediaJson(row.media)}::jsonb,
        ${row.galleryVisible},${row.featuredSelected},${row.status},1,${row.at},${row.at})
      RETURNING ${columns}`;
    return stored(rows[0]!);
  }

  async update(
    tx: TxContext,
    input: {
      businessId: string;
      serviceId: string;
      expectedVersion: number;
      fields: ServiceFields;
      at: Date;
    },
  ): Promise<StoredService | null> {
    const f = input.fields;
    const rows = await this.db.client(tx).$queryRaw<Row[]>`
      UPDATE services SET category_id=${f.categoryId}::uuid,
        subcategory_id=${f.subcategoryId}::uuid,name_en=${f.nameEn},name_hi=${f.nameHi},
        description=${f.description},price_type=${f.priceType},
        price_from_paise=${f.priceFromPaise}::bigint,price_to_paise=${f.priceToPaise}::bigint,
        unit=${f.unit},included=${f.included}::text[],excluded=${f.excluded}::text[],
        service_area=${f.serviceArea},media=${mediaJson(f.media)}::jsonb,
        gallery_visible=${f.galleryVisible},featured_selected=${f.featuredSelected},
        status=${f.status},version=version+1,updated_at=${input.at}
      WHERE id=${input.serviceId}::uuid AND business_id=${input.businessId}::uuid
        AND version=${input.expectedVersion} AND deleted_at IS NULL
      RETURNING ${columns}`;
    return rows[0] ? stored(rows[0]) : null;
  }

  async softDelete(
    tx: TxContext,
    input: {
      businessId: string;
      serviceId: string;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<number | null> {
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>`
      UPDATE services SET deleted_at=${input.at},version=version+1,updated_at=${input.at}
      WHERE id=${input.serviceId}::uuid AND business_id=${input.businessId}::uuid
        AND version=${input.expectedVersion} AND deleted_at IS NULL
      RETURNING version`;
    return rows[0]?.version ?? null;
  }
}
