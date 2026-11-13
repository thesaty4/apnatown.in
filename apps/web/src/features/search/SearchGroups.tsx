'use client';

import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { Category } from '@apnatown/shared/catalog';
import type { SearchResponse, SearchResultTab } from '@apnatown/shared/search';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { readSearchTarget } from './url-state';
import { SearchCards } from './SearchCards';

/** All tab (js23 `grpHead`): four items per group plus a server-owned See all. */
export function SearchGroups({
  result, categories, onSeeAll,
}: {
  result: SearchResponse;
  categories: Category[];
  onSeeAll: (target: string, tab: SearchResultTab) => void;
}) {
  const t = useTranslations('search.screen');
  const format = useFormatter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (
    <div className="grid gap-6">
      {result.groups.filter((group) => group.items.length > 0).map((group) => {
        const name = t(`groups.${group.tab}`);
        const why = group.tab === 'services' && result.mappingExplanation?.relatedServices
          ? t('relatedServices', { query: result.query })
          : group.tab === 'shops' && result.mappingExplanation ? t('relatedShops') : null;
        return (
          <section key={group.tab} aria-labelledby={`search-group-${group.tab}`} className="grid min-w-0 gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-2">
              <div className="grid min-w-0 gap-0.5">
                <h2 id={`search-group-${group.tab}`} className="m-0 flex flex-wrap items-center gap-2 text-h3 [overflow-wrap:anywhere]">
                  {name}{' '}
                  <span className="rounded-pill bg-surface-2 px-2 py-count-block text-tab-count text-text">
                    {format.number(group.total)}
                  </span>
                </h2>
                {why && <p className="m-0 text-caption text-muted [overflow-wrap:anywhere]">{why}</p>}
              </div>
              {readSearchTarget(group.seeAll) && (
                <Link
                  href={publicHref(group.seeAll, locale)}
                  scroll={false}
                  className={buttonVariantClassName('text', 'card')}
                  aria-label={t('seeAllGroup', { group: name, count: group.total })}
                  onClick={(event) => {
                    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onSeeAll(group.seeAll, group.tab);
                  }}
                >
                  {t('seeAll')} <NavIcon name="cr" className="size-4 rtl:rotate-180" />
                </Link>
              )}
            </div>
            <SearchCards tab={group.tab} items={group.items} categories={categories} />
          </section>
        );
      })}
    </div>
  );
}
