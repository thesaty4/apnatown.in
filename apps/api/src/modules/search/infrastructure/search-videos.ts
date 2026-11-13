import { Prisma } from '../../../shared/persistence/generated/client';
import { videoSearchCard, videoSearchProjection } from '../../media-videos/infrastructure/search-projection';
import type { ExploreSelection } from '../application/explore.repository';
import type { SearchVideoRow } from '../application/search.repository';
import { discoveryRows } from './explore.repository';
import { keywordPredicate } from './explore-predicate';
import { keysetOrder } from './explore-ordering';
import { searchText } from './search-text';

function predicate(selection: ExploreSelection) {
  const { filters } = selection;
  if (!filters.q) return Prisma.sql`false`;
  const where = [
    Prisma.sql`(${searchText(filters.q, Prisma.sql`concat_ws(' ',v.caption,array_to_string(v.hashtags,' '))`, Prisma.sql`v.caption`)}
      OR EXISTS (SELECT 1 FROM base x
        WHERE ((x.kind='product' AND x.id=ANY(v.product_ids))
          OR (x.kind='service' AND x.id=ANY(v.service_ids)))
          AND ${keywordPredicate(selection)}))`,
  ];
  if (filters.cityId) where.push(Prisma.sql`v.city_id=${filters.cityId}::uuid`);
  if (filters.areaId) where.push(Prisma.sql`v.area_id=${filters.areaId}::uuid`);
  return Prisma.join(where, ' AND ');
}
function sources(selection: ExploreSelection) {
  return Prisma.sql`WITH base AS MATERIALIZED (${discoveryRows(selection)}),
    videos AS (${videoSearchProjection})`;
}
export async function searchVideoCount(client: Prisma.TransactionClient, selection: ExploreSelection) {
  const rows = await client.$queryRaw<Array<{ count: number }>>(Prisma.sql`${sources(selection)}
    SELECT count(*)::integer AS count FROM videos v WHERE ${predicate(selection)}`);
  return rows[0]?.count ?? 0;
}
export function searchVideoPage(
  client: Prisma.TransactionClient, selection: ExploreSelection, limit: number, after?: string[],
) {
  // Preserve Media's owner order; stable owner ID orders unrelated collections.
  // Neither popularity counters nor an unapproved relevance formula influence it.
  const order = keysetOrder([
    { column: Prisma.sql`v.business_id`, descending: false, cast: 'uuid' },
    { column: Prisma.sql`v.sort_order`, descending: false, cast: 'bigint' },
    { column: Prisma.sql`v.id`, descending: false, cast: 'uuid' },
  ], after);
  return client.$queryRaw<SearchVideoRow[]>(Prisma.sql`${sources(selection)}
    SELECT ${videoSearchCard} AS card,${order.keys} AS keys
    FROM videos v WHERE ${predicate(selection)} AND ${order.predicate}
    ORDER BY ${order.order} LIMIT ${limit + 1}`);
}
export async function searchVideoRevision(client: Prisma.TransactionClient) {
  const rows = await client.$queryRaw<Array<{ revision: string }>>(Prisma.sql`
    SELECT md5(COALESCE(string_agg((to_jsonb(v)-'view_count')::text,'|' ORDER BY v.id),''))
      AS revision FROM (${videoSearchProjection}) v`);
  return rows[0]!.revision;
}
