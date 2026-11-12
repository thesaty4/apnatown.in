import type { PublicListingDetail } from '@apnatown/shared';
import { Prisma } from './generated/client';
import { listingCard, listingRows } from './public-listing-sql';

/** Reuses only owner-exported public projections and Media descriptors. */
export async function publicListingDetail(
  client: Prisma.TransactionClient, source: Prisma.Sql, slug: string,
): Promise<PublicListingDetail | null> {
  const [row] = await client.$queryRaw<PublicListingDetail[]>(Prisma.sql`
    WITH base AS (${listingRows(source)})
    SELECT ${listingCard} AS item,x.description,
      coalesce((SELECT jsonb_agg(images.image ORDER BY images.position) FROM (
        SELECT DISTINCT ON (m.position) m.image,m.position FROM media_public_listing_images m
        WHERE m.placement_id=x.id AND m.placement_type=CASE x.kind WHEN 'shop' THEN 'business' ELSE x.kind END
        ORDER BY m.position,m.width DESC LIMIT 5) images),'[]'::jsonb) AS images
    FROM base x WHERE x.slug=${slug} LIMIT 1`);
  return row ?? null;
}
