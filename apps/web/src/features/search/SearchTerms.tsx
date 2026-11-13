'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { popularOptions } from './queries';
import { SearchFailure, SearchOffline } from './SearchFeedback';

const labelClassName = 'text-field-label font-semibold [overflow-wrap:anywhere]';

/** js4 `V.search` empty query: device-local recent terms (Q-55). */
export function RecentSearches({
  terms, temporary, onSelect, onClear,
}: {
  terms: string[];
  temporary: boolean;
  onSelect: (term: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations('search.screen');
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <section className="grid gap-2" aria-labelledby="search-recent">
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <h2 id="search-recent" ref={heading} tabIndex={-1}
          className={`${labelClassName} focus-visible:ring-focus`}>{t('recent')}</h2>
        {terms.length > 0 && (
          <Button variant="text" size="card" onClick={() => {
            onClear();
            // The Clear action disappears; keep focus in the section it changed.
            heading.current?.focus();
          }}>{t('clearRecent')}</Button>
        )}
      </div>
      {terms.length > 0 ? (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-labelledby="search-recent">
          {terms.map((term) => (
            <li key={term} className="max-w-full">
              <Chip label={term} icon={<NavIcon name="clock" className="size-4" />}
                onClick={() => onSelect(term)} />
            </li>
          ))}
        </ul>
      ) : <p role="status" className="text-small text-muted">{t('noRecent')}</p>}
      {temporary && <p role="status" className="text-small text-muted">{t('temporaryHistory')}</p>}
    </section>
  );
}

/** Q-56 curated global list. `limit` keeps the no-results variant compact (js23). */
export function PopularSearches({
  onSelect, limit, headingLevel = 'h2', centered = false,
}: {
  onSelect: (term: string) => void;
  limit?: number | undefined;
  headingLevel?: 'h2' | 'h3';
  /** The no-results variant centres its chips under the empty state (js23). */
  centered?: boolean;
}) {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const online = useOnline();
  const popular = useQuery(popularOptions(api, locale));
  const Heading = headingLevel;
  const terms = popular.data?.terms.slice(0, limit);
  // A curated list that is empty adds no next action; omit the section.
  if (terms?.length === 0) return null;
  return (
    <section className={`grid gap-2 ${centered ? 'text-center' : ''}`}
      aria-labelledby="search-popular">
      <Heading id="search-popular" className={labelClassName}>{t('popular')}</Heading>
      {popular.isPending
        ? online ? <Skeleton label={t('popularLoading')} /> : <SearchOffline compact />
        : popular.isError
          ? <SearchFailure compact error={popular.error} retry={() => void popular.refetch()}
              busy={popular.isFetching} />
          : <ul className={`m-0 flex list-none flex-wrap gap-2 p-0 ${centered ? 'justify-center' : ''}`}
              aria-labelledby="search-popular">
              {terms?.map((term) => (
                <li key={term} className="max-w-full">
                  <Chip label={term} icon={<NavIcon name="search" className="size-4" />}
                    onClick={() => onSelect(term)} />
                </li>
              ))}
            </ul>}
    </section>
  );
}
