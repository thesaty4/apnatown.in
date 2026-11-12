'use client';

import { useTranslations } from 'next-intl';
import type { Category } from '@apnatown/shared/catalog';
import { Button } from '@apnatown/ui/primitives/Button';
import { Select } from '@apnatown/ui/primitives/Select';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import type { Locale } from '../../shared/i18n/preferences';
import { catalogName } from '../catalog';
import {
  hasVerified,
  sortsFor,
  type ExploreFilters,
  type withFilters,
} from './url-state';

type Patch = Parameters<typeof withFilters>[1];

/** Prototype `.exfm` filter form for the active tab (spec subset). */
export function ExploreFilterPanel({
  filters,
  categories,
  locale,
  onChange,
  onReset,
}: {
  filters: ExploreFilters;
  categories: Pick<Category, 'slug' | 'nameEn' | 'nameHi'>[];
  locale: Locale;
  onChange: (patch: Patch) => void;
  onReset: () => void;
}) {
  const t = useTranslations('explore.screen');
  const { tab } = filters;
  const selected = categories.some((item) => item.slug === filters.category);
  return (
    <section
      aria-label={t('filters')}
      className="grid gap-3 rounded-md border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-h3">{t('filters')}</h2>
        <Button variant="text" onClick={onReset}>
          {t('reset')}
        </Button>
      </div>
      <Select
        label={t('category')}
        value={selected ? filters.category : ''}
        onChange={(event) => onChange({ category: event.target.value || null })}
        options={[
          { value: '', label: t('allCategories') },
          ...categories.map((item) => ({
            value: item.slug,
            label: catalogName(item, locale),
          })),
        ]}
      />
      {hasVerified(tab) && (
        <Checkbox
          label={t('verified')}
          checked={filters.verified}
          onChange={(event) =>
            onChange({ verified: event.target.checked ? 'true' : null })
          }
        />
      )}
      {sortsFor(tab).length > 1 && (
        <Select
          label={t('sortBy')}
          value={filters.sort}
          onChange={(event) =>
            onChange({
              sort:
                event.target.value === 'relevance' ? null : event.target.value,
            })
          }
          options={sortsFor(tab).map((sort) => ({
            value: sort,
            label: t(`sort.${sort}`),
          }))}
        />
      )}
    </section>
  );
}
