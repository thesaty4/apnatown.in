'use client';

import { useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { SearchFilters } from '@apnatown/shared/search';
import { Button } from '@apnatown/ui/primitives/Button';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ExploreFilterPanel, type FilterPatch } from '../explore';
import { LocationPicker, type PickerStep } from '../geo';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import { searchOptions } from './queries';
import { SearchFailure, SearchOffline } from './SearchFeedback';
import { useSearchLocation } from './use-search-location';
import {
  listingFilters, patchSearch, readSearchFilters, resetSearchFilters, searchParams,
} from './url-state';

/**
 * Mobile filter sheet for one listing tab. Mounted per draft: closing without
 * "Show results" never writes the URL; the preview shares Search's key family
 * so an unchanged draft reuses the visible page instead of refetching.
 */
export function SearchFilterSheet({
  filters, close, apply,
}: {
  filters: SearchFilters;
  close: () => void;
  apply: (params: URLSearchParams) => void;
}) {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const online = useOnline();
  const [draft, setDraft] = useState(filters);
  const [invalid, setInvalid] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<PickerStep>({ kind: 'choose' });
  const context = useSearchLocation(draft);
  const preview = useInfiniteQuery({
    ...searchOptions(api, context.effective, locale, context.revision, context.position),
    placeholderData: keepPreviousData,
  });
  const response = preview.isError ? undefined : preview.data?.pages[0];
  const panel = listingFilters(draft);

  const update = (params: URLSearchParams) => {
    const parsed = readSearchFilters(params);
    setInvalid(!parsed);
    if (parsed) setDraft(parsed);
  };
  const patch = (changes: FilterPatch) => update(patchSearch(draft, changes));
  const reset = () => update(resetSearchFilters(draft));
  if (!panel) return null;
  return (
    <>
      <Sheet open title={t('filters')} closeLabel={t('cancel')}
        onOpenChange={(open) => !open && close()} stickyFooter
        footer={<div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={reset}>{t('reset')}</Button>
          <Button className="flex-1" loading={preview.isFetching}
            disabled={!online || invalid || !response || preview.isFetching}
            onClick={() => {
              apply(searchParams(draft));
              close();
            }}>
            {response && !preview.isFetching
              ? t('showResults', { count: response.counts[draft.tab] })
              : t('countsLoading')}
          </Button>
        </div>}
      >
        <ExploreFilterPanel filters={panel} facets={response?.facets} showSort={false}
          onChange={patch} onReset={reset} />
        <div aria-live="polite">
          {preview.isPending && online && <Skeleton label={t('countsLoading')} />}
        </div>
        {!online && <SearchOffline compact />}
        {invalid && <p role="alert" className="text-small text-error">{t('invalidFiltersMessage')}</p>}
        {preview.isError && <SearchFailure error={preview.error}
          busy={preview.isFetching} retry={() => void preview.refetch()}
          reset={reset}
          chooseLocation={() => {
            setLocationStep({ kind: 'choose' });
            setLocationOpen(true);
          }} />}
      </Sheet>
      <LocationPicker open={locationOpen} step={locationStep} onStep={setLocationStep}
        onClose={() => setLocationOpen(false)}
        onResolved={() => {
          // The picker already stored the Geo selection; drop any pinned link
          // location so the active Geo state (and only it) scopes the draft.
          patch({ cityId: null, areaId: null });
          setLocationOpen(false);
        }} />
    </>
  );
}
