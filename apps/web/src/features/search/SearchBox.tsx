'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { SearchSuggestions } from '@apnatown/shared/search';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import { suggestionsOptions } from './queries';
import { SearchCombobox, type SuggestionGroup } from './SearchCombobox';
import { SearchFailure, SearchOffline } from './SearchFeedback';

/** F-SR-002 group order. */
const groupKeys: (keyof SearchSuggestions)[] = [
  'products', 'shops', 'services', 'categories', 'subcategories', 'relatedSearches',
];
const debounceMs = 250;

export function SearchBox({
  query,
  cityId,
  areaId,
  autoFocus,
  onSubmit,
  onTarget,
}: {
  query: string;
  cityId?: string | undefined;
  areaId?: string | undefined;
  autoFocus?: boolean;
  onSubmit: (term: string) => void;
  /** A validated server `/search?…` target and the label that was chosen. */
  onTarget: (target: string, label: string) => void;
}) {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const online = useOnline();
  // Typing stays local (draft); only submit/selection writes the URL.
  const [draft, setDraft] = useState('');
  const [term, setTerm] = useState('');
  const [seenQuery, setSeenQuery] = useState(query);
  if (seenQuery !== query) {
    setSeenQuery(query);
    setDraft('');
    setTerm('');
  }
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(draft.trim()), debounceMs);
    return () => window.clearTimeout(timer);
  }, [draft]);
  const suggestions = useQuery({
    ...suggestionsOptions(api, {
      q: term,
      locale,
      ...(cityId && { cityId }),
      ...(areaId && { areaId }),
    }),
    // Previous groups stay visible (inert) instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  });
  const current = draft.trim() === term && term.length > 0;
  const fresh = current && suggestions.isSuccess && !suggestions.isPlaceholderData;
  const data = suggestions.isError || (!online && !fresh) ? undefined : suggestions.data;
  const groups: SuggestionGroup[] = data ? groupKeys.flatMap((key) =>
    data[key].length ? [{
      key, label: t(`groups.${key}`),
      options: data[key].map((option, index) => ({
        key: `${key}-${index}-${option.target}`,
        label: option.label,
        select: () => onTarget(option.target, option.label),
      })),
    }] : []) : [];
  const loading = online && !fresh && !(current && suggestions.isError);

  let feedback;
  if (!online && !fresh) feedback = <SearchOffline compact />;
  else if (current && suggestions.isError) feedback = <SearchFailure compact
    error={suggestions.error} busy={suggestions.isFetching}
    retry={() => void suggestions.refetch()} />;
  else if (loading && groups.length === 0)
    feedback = <div className="h-12"><Skeleton shape="block" label={t('suggestionsLoading')} className="rounded-sm" /></div>;

  // Offline/error notices announce themselves; this covers the other outcomes.
  const status = loading ? t('suggestionsLoading')
    : groups.length ? t('suggestionCount', { count: groups.reduce((sum, group) => sum + group.options.length, 0) })
      : fresh ? t('noSuggestions') : '';

  return <SearchCombobox query={query} groups={groups} stale={!fresh}
    status={status} feedback={feedback} autoFocus={autoFocus}
    onDraftChange={setDraft} onSubmit={onSubmit} />;
}
