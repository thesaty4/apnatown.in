import type { ExploreFilters } from '@apnatown/shared/search';
import { filterParams } from '../../explore';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';

type Target = Pick<ExploreFilters, 'tab'> &
  Partial<Pick<ExploreFilters, 'sort' | 'featured'>>;

/** "View all" targets (prototype `secBtn` → `exGo`): Explore's own URL state. */
export function homeExploreHref(locale: Locale, target: Target) {
  const filters: ExploreFilters = {
    sort: 'relevance',
    view: 'list',
    ...target,
  };
  return `${publicHref('/explore', locale)}?${filterParams(filters)}`;
}
