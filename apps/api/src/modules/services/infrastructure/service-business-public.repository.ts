import { Injectable } from '@nestjs/common';
import type { BusinessPublicServicesResponse } from '@apnatown/shared';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import {
  businessListingPage,
  businessListingSource,
  publicBusinessIdBySlug,
} from '../../../shared/persistence/public-business-listings';
import type { ServiceBusinessPublicPort } from '../application/service-business-public.service';
import { servicePublicProjection } from './public-projection';

type Category = BusinessPublicServicesResponse['categories'][number];
type Subcategory = BusinessPublicServicesResponse['subcategories'][number];

/**
 * Parameterized SQL only. Visibility is the owner-exported public projection
 * (approved business, active non-deleted service, active SERVICE taxonomy).
 */
@Injectable()
export class PrismaServiceBusinessPublicRepository implements ServiceBusinessPublicPort {
  constructor(private readonly db: PrismaDatabase) {}

  page(input: Parameters<ServiceBusinessPublicPort['page']>[0]) {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const businessId = await publicBusinessIdBySlug(client, input.slug);
      if (!businessId) return null;
      const page = await businessListingPage(client, servicePublicProjection, {
        businessId, categorySlug: input.categorySlug, subcategorySlug: input.subcategorySlug,
        after: input.after, limit: input.limit,
      });
      const source = businessListingSource(servicePublicProjection, businessId);
      // Category counts ignore every filter.
      const categories = await client.$queryRaw<Category[]>(Prisma.sql`
        SELECT c.id::text AS id,c.slug,c.name_en AS "labelEn",c.name_hi AS "labelHi",count(*)::integer AS count
        FROM (${source}) s JOIN catalog_discovery_categories c ON c.id=s.category_ids[1]
        GROUP BY c.id,c.slug,c.name_en,c.name_hi,c.sort_order
        ORDER BY c.sort_order,c.id`);
      // Subcategory counts respect only the category filter.
      const subcategories = await client.$queryRaw<Subcategory[]>(Prisma.sql`
        SELECT sc.id::text AS id,sc.category_id::text AS "categoryId",sc.slug,
          sc.name_en AS "labelEn",sc.name_hi AS "labelHi",count(*)::integer AS count
        FROM (${source}) s JOIN catalog_discovery_subcategories sc ON sc.id=s.subcategory_id
        JOIN catalog_discovery_categories c ON c.id=sc.category_id
        WHERE ${input.categorySlug}::text IS NULL OR c.slug=${input.categorySlug}::text
        GROUP BY sc.id,sc.category_id,sc.slug,sc.name_en,sc.name_hi,sc.sort_order,c.sort_order
        ORDER BY c.sort_order,sc.sort_order,sc.id`);
      return { ...page, categories, subcategories };
    });
  }
}
