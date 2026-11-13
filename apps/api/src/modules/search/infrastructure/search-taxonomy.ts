import { Prisma } from '../../../shared/persistence/generated/client';
import type { ExploreSelection } from '../application/explore.repository';
import type { TaxonomySuggestionRow } from '../application/search.repository';
import { searchText } from './search-text';

export function searchTaxonomy(client: Prisma.TransactionClient, selection: ExploreSelection) {
  const targets = selection.keywords?.matches.flatMap((match) => match.targets) ?? [];
  const categories = targets.filter((target) => target.kind === 'category').map((target) => target.categoryId);
  const subcategories = targets.filter((target) => target.kind === 'subcategory').map((target) => target.subcategoryId);
  const predicate = Prisma.sql`(
    ${searchText(selection.filters.q!, Prisma.sql`concat_ws(' ',t.name_en,t.name_hi,t.slug)`, Prisma.sql`t.name_en`)}
    OR (t.kind='category' AND t.id=ANY(${categories}::uuid[]))
    OR (t.kind='subcategory' AND t.id=ANY(${subcategories}::uuid[])))`;
  return client.$queryRaw<TaxonomySuggestionRow[]>(Prisma.sql`
    WITH taxonomy AS (
      SELECT c.id,'category'::text AS kind,c.name_en,c.name_hi,c.slug,c.sort_order
      FROM catalog_discovery_categories c
      UNION ALL
      SELECT s.id,'subcategory'::text,s.name_en,s.name_hi,s.slug,s.sort_order
      FROM catalog_discovery_subcategories s
    ), matches AS (
      SELECT t.*,row_number() OVER (PARTITION BY t.kind ORDER BY t.sort_order,t.id) AS position
      FROM taxonomy t WHERE ${predicate}
    ) SELECT id,kind,name_en AS "nameEn",name_hi AS "nameHi"
      FROM matches WHERE position<=3 ORDER BY kind,position`);
}
