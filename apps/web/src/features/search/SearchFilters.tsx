'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  EXPLORE_TABS, type ExploreTab, type SearchFilters as Filters, type SearchResponse,
} from '@apnatown/shared/search';
import { Button } from '@apnatown/ui/primitives/Button';
import { Select } from '@apnatown/ui/primitives/Select';
import {
  activeFilterCount, ExploreFilterChips, sortsFor, sortMessages, type FilterPatch,
} from '../explore';
import { NavIcon } from '../../shared/ui/NavIcon';
import {
  changeSearchTab, listingFilters, listingTab, patchSearch, readSearchFilters, resetSearchFilters,
} from './url-state';
import { SearchFilterSheet } from './SearchFilterSheet';

/** Active filter count across the tabs whose filters affect `filters.tab`. */
export function searchFilterCount(filters: Filters) {
  const tab = listingTab(filters.tab);
  const scopes: readonly ExploreTab[] = tab ? [tab] : filters.tab === 'all' ? EXPLORE_TABS : [];
  return scopes.reduce((sum, scope) => sum + activeFilterCount(listingFilters(filters, scope)!), 0);
}

/**
 * js4 `V.search` controls row. Listing tabs get the Filters sheet trigger
 * (mobile; desktop uses the sidebar) and their own sort. All/Videos have no
 * facets, so they only show removable chips for namespaced filters that still
 * scope the grouped results.
 */
export function SearchFilters({
  filters, result, navigate,
}: {
  filters: Filters;
  result: SearchResponse | undefined;
  navigate: (params: URLSearchParams) => void;
}) {
  const t = useTranslations('search.screen');
  const explore = useTranslations('explore.screen');
  const [open, setOpen] = useState(false);
  const tab = listingTab(filters.tab);
  const scopes: readonly ExploreTab[] = tab ? [tab] : filters.tab === 'all' ? EXPLORE_TABS : [];
  const panels = scopes.map((scope) => listingFilters(filters, scope)!)
    .filter((panel) => activeFilterCount(panel) > 0);
  const count = searchFilterCount(filters);
  const patchGroup = (group: ExploreTab, patch: FilterPatch) => {
    if (group === tab) return navigate(patchSearch(filters, patch));
    // Promote the namespaced group, patch it, then restore the visible tab.
    const active = readSearchFilters(changeSearchTab(filters, group));
    const patched = active && readSearchFilters(patchSearch(active, patch));
    if (patched) navigate(changeSearchTab(patched, filters.tab));
  };
  if (!tab && count === 0) return null;
  return (
    <div className="grid min-w-0 gap-2">
      {tab && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="card" className="desktop:hidden"
            aria-label={count > 0 ? t('filtersWithCount', { count }) : undefined}
            onClick={() => setOpen(true)}>
            <NavIcon name="filter" className="size-4" />
            {t('filters')}
            {count > 0 && (
              <span aria-hidden="true" className="rounded-pill bg-primary px-1.5 text-tab-count text-on-primary">
                {count}
              </span>
            )}
          </Button>
          <Select label={t('sort')} value={filters.sort}
            options={sortsFor(tab).map((value) => ({ value, label: explore(sortMessages[value]) }))}
            wrapperClassName="ms-auto grid-flow-col items-center"
            onChange={(event) => navigate(patchSearch(filters, { sort: event.target.value }))} />
        </div>
      )}
      {count > 0 && (
        <div className="grid gap-2">
          {panels.map((panel) => (
            <div key={panel.tab} role="group"
              aria-label={filters.tab === 'all' ? t('activeFiltersFor', { group: t(`groups.${panel.tab}`) }) : t('activeFilters')}
              className="grid gap-1">
              {filters.tab === 'all' && (
                <p aria-hidden="true" className="m-0 text-caption text-muted">{t(`groups.${panel.tab}`)}</p>
              )}
              <ExploreFilterChips filters={panel}
                facets={result?.tab === panel.tab ? result.facets : undefined}
                onChange={(patch) => patchGroup(panel.tab, patch)} />
            </div>
          ))}
          <Button className="justify-self-start" variant="text" size="card"
            onClick={() => navigate(resetSearchFilters(filters))}>{t('clearFilters')}</Button>
        </div>
      )}
      {open && tab && <SearchFilterSheet filters={filters} close={() => setOpen(false)} apply={navigate} />}
    </div>
  );
}
