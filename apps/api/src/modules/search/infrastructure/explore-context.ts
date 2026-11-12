import type { DiscoveryLocation, ExploreFilters } from '@apnatown/shared/search';
import { DomainError } from '../../../shared/errors/errors';
import { Prisma } from '../../../shared/persistence/generated/client';
import type { DiscoveryCategory, DiscoveryContext, DiscoverySubcategory } from '../application/explore.repository';

export async function discoveryContext(
  client: Prisma.TransactionClient, filters: ExploreFilters, location: DiscoveryLocation | null,
): Promise<DiscoveryContext> {
  const categories = await client.$queryRaw<DiscoveryCategory[]>`
    SELECT id,kind,slug,name_en AS "nameEn",name_hi AS "nameHi" FROM catalog_discovery_categories ORDER BY sort_order,id`;
  const subcategories = await client.$queryRaw<DiscoverySubcategory[]>`
    SELECT id,kind,slug,category_id AS "categoryId",name_en AS "nameEn",name_hi AS "nameHi"
    FROM catalog_discovery_subcategories ORDER BY sort_order,id`;
  const relations = await client.$queryRaw<DiscoveryContext['relations']>`
    SELECT source_category_id AS "sourceId",related_category_id AS "targetId"
    FROM catalog_discovery_relations ORDER BY source_category_id,sort_order`;
  let cityId = filters.cityId ?? null;
  if (filters.areaId) {
    const [area] = await client.$queryRaw<{ cityId: string; latitude: number | null; longitude: number | null }[]>`
      SELECT a.city_id AS "cityId",ST_Y(a.centroid::geometry) AS latitude,ST_X(a.centroid::geometry) AS longitude
      FROM areas a JOIN cities c ON c.id=a.city_id AND c.status='enabled' WHERE a.id=${filters.areaId}::uuid`;
    if (!area || (cityId && cityId !== area.cityId)) throw new DomainError('SEARCH_FILTER_INVALID', { field: 'areaId' });
    cityId = area.cityId;
    if (!location && area.latitude !== null && area.longitude !== null)
      location = { latitude: area.latitude, longitude: area.longitude };
  }
  if (cityId) {
    const [city] = await client.$queryRaw<{ id: string }[]>`SELECT id FROM cities WHERE id=${cityId}::uuid AND status='enabled'`;
    if (!city) throw new DomainError('SEARCH_FILTER_INVALID', { field: 'cityId' });
  }
  const [clock] = await client.$queryRaw<{ asOf: string }[]>`
    SELECT to_char(transaction_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "asOf"`;
  return { categories, subcategories, relations, location, cityId, asOf: clock!.asOf };
}
