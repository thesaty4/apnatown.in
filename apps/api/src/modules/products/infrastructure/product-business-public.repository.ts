import { Injectable } from '@nestjs/common';
import type { BusinessPublicProductPill } from '@apnatown/shared';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import {
  businessListingPage,
  businessListingSource,
  publicBusinessIdBySlug,
} from '../../../shared/persistence/public-business-listings';
import type { ProductBusinessPublicPort } from '../application/product-business-public.service';
import { productPublicProjection } from './public-projection';

/**
 * Parameterized SQL only. Visibility is the owner-exported public projection
 * (approved business, published non-deleted product); pills read Products'
 * `product_category_pills` preferences over active Catalog taxonomy.
 */
@Injectable()
export class PrismaProductBusinessPublicRepository implements ProductBusinessPublicPort {
  constructor(private readonly db: PrismaDatabase) {}

  page(input: Parameters<ProductBusinessPublicPort['page']>[0]) {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const businessId = await publicBusinessIdBySlug(client, input.slug);
      if (!businessId) return null;
      const page = await businessListingPage(client, productPublicProjection, {
        businessId,
        categorySlug: null,
        subcategorySlug: input.subcategorySlug,
        after: input.after,
        limit: input.limit,
      });
      // Preselection counts; hidden pills omitted; a selected Catalog
      // subcategory without public products is returned with count 0.
      const pills = await client.$queryRaw<
        BusinessPublicProductPill[]
      >(Prisma.sql`
        WITH counted AS (
          SELECT p.subcategory_id,count(*)::integer AS count
          FROM (${businessListingSource(productPublicProjection, businessId)}) p
          GROUP BY p.subcategory_id
        ), candidates AS (
          SELECT sc.id,sc.slug,sc.name_en,sc.name_hi,sc.sort_order,coalesce(c.count,0) AS count
          FROM catalog_discovery_subcategories sc LEFT JOIN counted c ON c.subcategory_id=sc.id
          WHERE sc.kind='product' AND (c.subcategory_id IS NOT NULL
            OR (${input.subcategorySlug}::text IS NOT NULL AND sc.slug=${input.subcategorySlug}::text))
        )
        SELECT x.id::text AS "subcategoryId",x.slug,
          coalesce(pref.label_en,x.name_en) AS "labelEn",coalesce(pref.label_hi,x.name_hi) AS "labelHi",
          x.count,(row_number() OVER (
            ORDER BY pref.position IS NULL,pref.position,x.sort_order,x.id)-1)::integer AS position
        FROM candidates x
        LEFT JOIN product_category_pills pref ON pref.business_id=${businessId}::uuid AND pref.subcategory_id=x.id
        WHERE NOT coalesce(pref.hidden,false)
        ORDER BY position`);
      return { ...page, pills };
    });
  }
}
