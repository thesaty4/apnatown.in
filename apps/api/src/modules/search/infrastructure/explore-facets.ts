import type { ExploreFacet, ExploreResponse } from '@apnatown/shared/search';
import { Prisma } from '../../../shared/persistence/generated/client';
import type { ExploreSelection } from '../application/explore.repository';
import { tabFilters } from '../application/explore-normalization';
import { explorePredicate } from './explore-predicate';

type FacetRow = Omit<ExploreFacet, 'disabled' | 'selected'>;
const map = (rows: FacetRow[], values: string[]) => rows.map((row) => ({
  ...row, selected: values.includes(row.value), disabled: row.count === 0 && !values.includes(row.value),
}));
export async function exploreFacets(client: Prisma.TransactionClient, base: Prisma.Sql, selection: ExploreSelection): Promise<ExploreResponse['facets']> {
  const tab = selection.filters.tab;
  const f = tabFilters(selection.filters, tab);
  const kind = tab === 'services' ? 'service' : 'product';
  const categories = await client.$queryRaw<FacetRow[]>(Prisma.sql`
    WITH base AS MATERIALIZED (${base})
    SELECT c.id,c.slug AS value,c.name_en AS "labelEn",c.name_hi AS "labelHi",
      (SELECT count(*)::integer FROM base x WHERE ${explorePredicate(selection, tab, 'category')}
        AND c.id=ANY(x.category_ids)) AS count
    FROM catalog_discovery_categories c WHERE c.kind=${kind} ORDER BY c.sort_order,c.id`);
  const subcategories = tab === 'shops' ? [] : await client.$queryRaw<FacetRow[]>(Prisma.sql`
    WITH base AS MATERIALIZED (${base})
    SELECT c.id,parent.slug||'/'||c.slug AS value,c.category_id AS "categoryId",c.name_en AS "labelEn",c.name_hi AS "labelHi",
      (SELECT count(*)::integer FROM base x WHERE ${explorePredicate(selection, tab, 'subcategory')}
        AND x.subcategory_id=c.id) AS count
    FROM catalog_discovery_subcategories c JOIN catalog_discovery_categories parent ON parent.id=c.category_id
    WHERE c.kind=${kind} ORDER BY c.category_id,c.sort_order,c.id`);
  const brands = tab !== 'products' ? [] : await client.$queryRaw<FacetRow[]>(Prisma.sql`
    WITH base AS MATERIALIZED (${base}), brands AS (
      SELECT DISTINCT brand FROM base WHERE kind='product' AND brand IS NOT NULL
      UNION SELECT ${f.brand ?? null}::text WHERE ${f.brand ?? null}::text IS NOT NULL)
    SELECT brand AS id,brand AS value,brand AS "labelEn",NULL::text AS "labelHi",
      (SELECT count(*)::integer FROM base x WHERE x.brand=brands.brand
        AND ${explorePredicate(selection,tab,'brand')}) AS count FROM brands ORDER BY brand`);
  const [range] = await client.$queryRaw<{ value: ExploreResponse['facets']['priceRange'] }[]>(Prisma.sql`
    WITH base AS (${base}) SELECT CASE WHEN min(x.price_paise) IS NULL THEN NULL
      ELSE jsonb_build_object('minPaise',min(x.price_paise),'maxPaise',max(x.price_paise)) END AS value
    FROM base x WHERE ${explorePredicate(selection,tab,'price')}`);
  return {
    categories: map(categories,String(f.category ?? '').split(',')),
    subcategories: map(subcategories,String(f.subcategory ?? '').split(',')),
    brands: map(brands,[String(f.brand ?? '')]), priceRange: range?.value ?? null,
  };
}
