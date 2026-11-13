import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  PublicOfferRow,
  PublicPlacementRow,
  PublicPromotionsRepository,
} from '../domain/public-promotions';

const iso = (column: Prisma.Sql) =>
  Prisma.sql`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

/** Parameterized reads over runtime views; never the owner tables. */
@Injectable()
export class PrismaPublicPromotionsRepository implements PublicPromotionsRepository {
  constructor(private readonly db: PrismaDatabase) {}

  offers(
    tx: TxContext,
    input: Parameters<PublicPromotionsRepository['offers']>[1],
  ): Promise<PublicOfferRow[]> {
    const business = input.businessId
      ? Prisma.sql`AND o.business_id = ${input.businessId}::uuid`
      : Prisma.empty;
    const featured = input.featured === null
      ? Prisma.empty
      : Prisma.sql`AND o.featured = ${input.featured}`;
    const after = input.after
      ? Prisma.sql`AND (o.valid_to, o.id) < (${input.after.validTo}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.db.client(tx).$queryRaw<PublicOfferRow[]>(Prisma.sql`
      SELECT o.id::text AS id, o.business_id::text AS "businessId",
        b.kind AS "businessKind", b.slug AS "businessSlug",
        b.name_en AS "businessNameEn", b.name_hi AS "businessNameHi",
        o.title_en AS "titleEn", o.title_hi AS "titleHi",
        o.terms_en AS "termsEn", o.terms_hi AS "termsHi",
        o.discount_type AS "discountType",
        o.discount_percent::integer AS "discountPercent",
        o.discount_paise::float8 AS "discountPaise",
        ${iso(Prisma.sql`o.valid_from`)} AS "validFrom",
        ${iso(Prisma.sql`o.valid_to`)} AS "validTo",
        CASE WHEN o.scope = 'targets'
          AND NOT EXISTS (SELECT 1 FROM offers_public_product_prices pp WHERE pp.offer_id = o.id)
          AND NOT EXISTS (SELECT 1 FROM offers_public_service_targets ps WHERE ps.offer_id = o.id)
          THEN 'out_of_stock' ELSE 'active' END AS state,
        o.featured
      FROM offers_public_active o
      JOIN businesses_public_context b ON b.id = o.business_id
      WHERE true ${business} ${featured} ${after}
      ORDER BY o.valid_to DESC, o.id DESC
      LIMIT ${input.take}`);
  }

  placements(
    tx: TxContext,
    input: Parameters<PublicPromotionsRepository['placements']>[1],
  ): Promise<PublicPlacementRow[]> {
    const kind = input.kind
      ? Prisma.sql`AND p.kind = ${input.kind}`
      : Prisma.empty;
    // A located request may see platform plus its own city/area placements;
    // without a location only platform-wide content is eligible.
    const scope = input.cityId
      ? Prisma.sql`AND (p.scope_kind = 'platform'
          OR (p.scope_kind = 'city' AND p.city_id = ${input.cityId}::uuid)
          OR (${input.areaId ?? null}::uuid IS NOT NULL
            AND p.scope_kind = 'area' AND p.city_id = ${input.cityId}::uuid
            AND p.area_id = ${input.areaId ?? null}::uuid))`
      : Prisma.sql`AND p.scope_kind = 'platform'`;
    const uuid = Prisma.sql`'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`;
    return this.db.client(tx).$queryRaw<PublicPlacementRow[]>(Prisma.sql`
      SELECT p.id::text AS id, p.kind, p.surface,
        p.title_en AS "titleEn", p.title_hi AS "titleHi",
        p.subtitle_en AS "subtitleEn", p.subtitle_hi AS "subtitleHi",
        p.banner, p.position,
        p.destination->>'kind' AS "destinationKind",
        p.destination->>'targetId' AS "destinationTargetId",
        CASE
          WHEN p.destination->>'kind' = 'offers' THEN '/offers'
          WHEN p.destination->>'kind' = 'explore' THEN '/explore'
          WHEN p.destination->>'kind' = 'business' AND b.slug IS NOT NULL
            THEN '/' || CASE WHEN b.kind = 'shop' THEN 'shop' ELSE 'provider' END || '/' || b.slug
          WHEN p.destination->>'kind' = 'product' AND pr.slug IS NOT NULL THEN '/product/' || pr.slug
          WHEN p.destination->>'kind' = 'service' AND sv.slug IS NOT NULL THEN '/service/' || sv.slug
          WHEN p.destination->>'kind' = 'category' AND c.slug IS NOT NULL THEN '/category/' || c.slug
        END AS "destinationHref"
      FROM promotion_placements_public p
      LEFT JOIN businesses_public_context b
        ON p.destination->>'kind' = 'business'
        AND p.destination->>'targetId' ~ ${uuid}
        AND b.id = (p.destination->>'targetId')::uuid
      LEFT JOIN products_public_discovery pr
        ON p.destination->>'kind' = 'product'
        AND p.destination->>'targetId' ~ ${uuid}
        AND pr.id = (p.destination->>'targetId')::uuid
      LEFT JOIN services_public_discovery sv
        ON p.destination->>'kind' = 'service'
        AND p.destination->>'targetId' ~ ${uuid}
        AND sv.id = (p.destination->>'targetId')::uuid
      LEFT JOIN categories c
        ON p.destination->>'kind' = 'category'
        AND p.destination->>'targetId' ~ ${uuid}
        AND c.id = (p.destination->>'targetId')::uuid AND c.active
      WHERE true ${kind} ${scope}
      ORDER BY p.position, p.id
      LIMIT ${input.take}`);
  }
}
