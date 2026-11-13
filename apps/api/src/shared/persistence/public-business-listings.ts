import type { ExploreCard } from '@apnatown/shared/search';
import type { BusinessListingKeys } from '../pagination/business-listing-cursor';
import { Prisma } from './generated/client';
import { listingCard, listingRows } from './public-listing-sql';

export interface BusinessListingPageInput {
  businessId: string;
  categorySlug: string | null;
  subcategorySlug: string | null;
  after: BusinessListingKeys | null;
  limit: number;
}

/** Approved, public (Businesses-owned visibility) business id by slug, else null. */
export async function publicBusinessIdBySlug(
  client: Prisma.TransactionClient, slug: string,
): Promise<string | null> {
  const [row] = await client.$queryRaw<{ id: string }[]>`
    SELECT id::text AS id FROM businesses_public_context WHERE slug=${slug} LIMIT 1`;
  return row?.id ?? null;
}

/** Restricts an owner-exported public projection to one business. */
export function businessListingSource(projection: Prisma.Sql, businessId: string): Prisma.Sql {
  return Prisma.sql`SELECT p.* FROM (${projection}) p WHERE p.business_id=${businessId}::uuid`;
}

/**
 * One keyset page of a public business's products or services, rendered with
 * the shared Explore card projection (no location: distance/delivers null).
 * Stable order: featured first, name (200-char prefix), id.
 */
export async function businessListingPage(
  client: Prisma.TransactionClient, projection: Prisma.Sql, input: BusinessListingPageInput,
): Promise<{ items: ExploreCard[]; next: BusinessListingKeys | null }> {
  const after = input.after
    ? Prisma.sql`(page.rank,page.name,page.id)>(${input.after[0]}::integer,${input.after[1]}::text,${input.after[2]}::uuid)`
    : Prisma.sql`true`;
  const rows = await client.$queryRaw<{ item: ExploreCard; rank: number; name: string; id: string }[]>(Prisma.sql`
    WITH base AS (${listingRows(businessListingSource(projection, input.businessId))})
    SELECT page.item,page.rank,page.name,page.id::text AS id FROM (
      SELECT ${listingCard} AS item,CASE WHEN x.featured THEN 0 ELSE 1 END AS rank,
        left(x.name_en,200) AS name,x.id
      FROM base x
      WHERE (${input.categorySlug}::text IS NULL OR x.category_slug=${input.categorySlug}::text)
        AND (${input.subcategorySlug}::text IS NULL OR x.subcategory_slug=${input.subcategorySlug}::text)
    ) page
    WHERE ${after}
    ORDER BY page.rank,page.name,page.id
    LIMIT ${input.limit + 1}`);
  const items = rows.slice(0, input.limit);
  const last = items.at(-1);
  return {
    items: items.map((row) => row.item),
    next: rows.length > input.limit && last ? [last.rank, last.name, last.id] : null,
  };
}
