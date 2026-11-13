import type { ExploreResponse } from '@apnatown/shared/search';
import type { CursorBinding, CursorCodec } from '../../../shared/pagination/cursor';
import type { DiscoveryContext } from './explore.repository';

/** Catalog's explicit relations for a Home context, else unselected nonzero facets. */
export function relatedCategories(
  context: DiscoveryContext,
  contextCategory: string | undefined,
  facets: ExploreResponse['facets'],
) {
  const root = contextCategory
    ? context.categories.find((category) => category.slug === contextCategory)
    : undefined;
  const related = new Set(context.relations
    .filter((relation) => relation.sourceId === root?.id).map((relation) => relation.targetId));
  return facets.categories.filter((facet) =>
    contextCategory ? related.has(facet.id) : facet.count > 0 && !facet.selected).slice(0, 6);
}

/** Rows are over-fetched by one; sign the last visible tuple with its snapshot time. */
export function keysetPage<T>(
  cursors: CursorCodec,
  rows: readonly { card: T; keys: string[] }[],
  limit: number,
  binding: CursorBinding,
  asOf: string,
): { items: T[]; nextCursor: string | null } {
  const visible = rows.slice(0, limit);
  const last = visible.at(-1);
  return {
    items: visible.map((row) => row.card),
    nextCursor: rows.length > limit && last ? cursors.encode(binding, [asOf, ...last.keys]) : null,
  };
}
