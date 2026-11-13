import type { ExploreTab } from '@apnatown/shared/search';
import { Prisma } from '../../../shared/persistence/generated/client';
import type { ExploreSelection } from '../application/explore.repository';
import { tabFilters } from '../application/explore-normalization';
import { searchText } from './search-text';

export type Dimension = 'category' | 'subcategory' | 'brand' | 'price';
export function explorePredicate(selection: ExploreSelection, tab: ExploreTab, omit?: Dimension) {
  const { filters } = selection;
  const f = tabFilters(filters, tab);
  const where: Prisma.Sql[] = [Prisma.sql`x.kind=${{ products: 'product', shops: 'shop', services: 'service' }[tab]}`];
  if (tab === 'shops') where.push(Prisma.sql`x.business_kind='shop'`);
  // The no-related-services state is an implicit category restriction. Remove
  // it for category facet counts so a user can explicitly choose another one.
  if (tab === 'services' && selection.emptyServices && omit !== 'category') where.push(Prisma.sql`false`);
  if (filters.cityId) where.push(Prisma.sql`x.city_id=${filters.cityId}::uuid`);
  if (filters.areaId) where.push(Prisma.sql`x.area_id=${filters.areaId}::uuid`);
  if (f.category && omit !== 'category') where.push(Prisma.sql`EXISTS (
    SELECT 1 FROM catalog_discovery_categories c WHERE c.id=ANY(x.category_ids)
      AND c.slug IN (${Prisma.join(String(f.category).split(','))}))`);
  if (f.subcategory && omit !== 'subcategory') where.push(Prisma.sql`x.subcategory_id IN (
    SELECT sc.id FROM catalog_discovery_subcategories sc
    JOIN catalog_discovery_categories parent ON parent.id=sc.category_id
    WHERE parent.slug||'/'||sc.slug IN (${Prisma.join(String(f.subcategory).split(','))}))`);
  if (f.brand && omit !== 'brand') where.push(Prisma.sql`x.brand=${f.brand}`);
  if (omit !== 'price') {
    if (f.priceMinPaise !== undefined) where.push(Prisma.sql`coalesce(x.price_paise,0)>=${f.priceMinPaise}::bigint`);
    if (f.priceMaxPaise !== undefined) where.push(Prisma.sql`(x.price_paise IS NULL OR x.price_paise<=${f.priceMaxPaise}::bigint)`);
  }
  if (Number(f.rating ?? 0) > 0) where.push(Prisma.sql`x.rating>=${f.rating}::float8`);
  for (const [key, column] of [
    ['offers', Prisma.sql`x.offers`], ['inStock', Prisma.sql`x.in_stock`],
    ['pickup', Prisma.sql`x.pickup`], ['featured', Prisma.sql`x.featured`],
    ['openNow', Prisma.sql`x.open_now`], ['availableToday', Prisma.sql`x.open_now`],
    ['verified', Prisma.sql`x.verified`], ['deliversToMe', Prisma.sql`x.delivers`],
  ] as const) if (f[key] === 'true') where.push(Prisma.sql`${column} IS TRUE`);
  if (f.priceOnEnquiry === 'true') where.push(Prisma.sql`x.price_type='enquiry'`);
  if (Number(f.distanceKm ?? 0) > 0) where.push(Prisma.sql`x.distance_km<=${f.distanceKm}::float8`);
  if (f.radiusKm !== undefined) where.push(Prisma.sql`x.distance_km<=${f.radiusKm}::float8`);
  if (f.offerId) where.push(Prisma.sql`${f.offerId}::uuid=ANY(x.offer_ids)`);
  if (filters.q) {
    const direct = keywordPredicate(selection);
    where.push(selection.search && tab === 'shops'
      ? Prisma.sql`(${direct} OR EXISTS (
          SELECT 1 FROM base p WHERE p.kind='product' AND p.business_id=x.business_id
            AND ${keywordPredicate(selection, 'p')}))`
      : direct);
  }
  return Prisma.join(where, ' AND ');
}

export function keywordPredicate(selection: ExploreSelection, alias: 'x' | 'p' = 'x') {
  const q = selection.filters.q!;
  const x = Prisma.raw(alias);
  const text = Prisma.sql`concat_ws(' ',${x}.name_en,${x}.name_hi,${x}.description,
    ${x}.business_name_en,${x}.business_name_hi,${x}.category_name_en,${x}.category_name_hi,
    ${x}.subcategory_name_en,${x}.subcategory_name_hi,
    ${selection.search ? Prisma.sql`array_to_string(${x}.tags,' ')` : Prisma.sql`NULL::text`})`;
  const matches: Prisma.Sql[] = [searchText(q, text, Prisma.sql`${x}.name_en`)];
  for (const target of selection.keywords?.matches.flatMap((m) => m.targets) ?? []) {
    if (target.kind === 'category') matches.push(Prisma.sql`${target.categoryId}::uuid=ANY(${x}.category_ids)`);
    if (target.kind === 'subcategory') matches.push(Prisma.sql`${x}.subcategory_id=${target.subcategoryId}::uuid`);
    if (target.kind === 'product_tag') matches.push(Prisma.sql`${target.productTag}=ANY(${x}.tags)`);
  }
  return Prisma.sql`(${Prisma.join(matches, ' OR ')})`;
}
