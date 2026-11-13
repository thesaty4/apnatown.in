'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { NavIcon } from '../../../shared/ui/NavIcon';
import type { ProductListFilters } from './api';
import { PRODUCT_QUERY_MAX, normalizeQuery } from './filters';

const SEARCH_DEBOUNCE_MS = 350;

/** Name/SKU search (debounced into `?q=`, replace) and stock filter
 * (`?stock=`, push) — all list state lives in the URL. */
export function ProductFilters({
  filters,
  navigate,
}: {
  filters: ProductListFilters;
  navigate: (next: ProductListFilters, mode: 'push' | 'replace') => void;
}) {
  const t = useTranslations('products.list');
  // Search draft → `?q=` after a pause; Back/Forward re-seeds the draft.
  const [draft, setDraft] = useState(filters.query);
  const [seen, setSeen] = useState(filters);
  if (seen !== filters) {
    setSeen(filters);
    setDraft(filters.query);
  }
  useEffect(() => {
    const query = normalizeQuery(draft);
    if (query === filters.query) return;
    const timer = window.setTimeout(
      () => navigate({ ...filters, query }, 'replace'),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [draft, filters, navigate]);

  return (
    <div role="search" className="flex min-w-0 flex-wrap items-end gap-2">
      <Input
        type="search"
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        wrapperClassName="min-w-0 flex-1 basis-44 [&>label]:sr-only"
        className="rounded-pill"
        maxLength={PRODUCT_QUERY_MAX}
        enterKeyHint="search"
        autoComplete="off"
        value={draft}
        prefix={<NavIcon name="search" className="size-4.5" />}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          const query = normalizeQuery(draft);
          if (query !== filters.query) navigate({ ...filters, query }, 'replace');
        }}
      />
      <Select
        label={t('stockLabel')}
        wrapperClassName="w-36 shrink-0 desktop:w-44 [&>label]:sr-only"
        value={filters.stock ?? 'all'}
        options={[
          { value: 'all', label: t('stockAll') },
          { value: 'low', label: t('stockLow') },
          { value: 'out_of_stock', label: t('stockOut') },
        ]}
        onChange={(event) => {
          const value = event.target.value;
          navigate(
            {
              ...filters,
              stock: value === 'low' || value === 'out_of_stock' ? value : undefined,
            },
            'push',
          );
        }}
      />
    </div>
  );
}
