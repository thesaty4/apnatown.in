'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  EXPLORE_FILTER_KEYS,
  type ExploreResponse,
} from '@apnatown/shared/search';
import { formatMoney, formatDistanceKm } from '@apnatown/shared/formatters';
import { Chip } from '@apnatown/ui/primitives/Chip';
import {
  selectedValues,
  sortMessages,
  type ExploreFilters,
  type FilterPatch,
} from './url-state';

export function activeFilterCount(filters: ExploreFilters) {
  return EXPLORE_FILTER_KEYS[filters.tab].filter((key) => {
    const value = filters[key];
    return (
      value !== undefined &&
      value !== '' &&
      value !== 'false' &&
      value !== 0 &&
      !(key === 'sort' && value === 'relevance')
    );
  }).length;
}

export function ExploreFilterChips({
  filters,
  facets,
  onChange,
}: {
  filters: ExploreFilters;
  facets: ExploreResponse['facets'] | undefined;
  onChange: (patch: FilterPatch) => void;
}) {
  const t = useTranslations('explore.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (
    <div className="flex flex-wrap gap-2">
      {EXPLORE_FILTER_KEYS[filters.tab].flatMap((key) => {
        const value = filters[key];
        if (
          value === undefined ||
          value === '' ||
          value === 'false' ||
          value === 0 ||
          (key === 'sort' && value === 'relevance')
        )
          return [];
        if (key === 'category' || key === 'subcategory') {
          const options =
            key === 'category' ? facets?.categories : facets?.subcategories;
          return selectedValues(String(value)).map((selected) => {
            const facet = options?.find((option) => option.value === selected);
            const name = facet
              ? locale === 'hi' && facet.labelHi
                ? facet.labelHi
                : facet.labelEn
              : selected;
            const category = facets?.categories.find(
              (item) => item.id === facet?.categoryId,
            );
            const label = category
              ? t('filterValue', {
                  label:
                    locale === 'hi' && category.labelHi
                      ? category.labelHi
                      : category.labelEn,
                  value: name,
                })
              : name;
            const remove = () => {
              const patch: FilterPatch = {
                [key]: selectedValues(String(value))
                  .filter((item) => item !== selected)
                  .join(','),
              };
              if (key === 'category' && filters.tab !== 'shops') {
                patch.subcategory = selectedValues(filters.subcategory)
                  .filter(
                    (sub) =>
                      !facets?.subcategories.some(
                        (item) =>
                          item.value === sub && item.categoryId === facet?.id,
                      ),
                  )
                  .join(',');
                if (filters.tab === 'products') {
                  patch.subcategory = '';
                  patch.brand = null;
                }
              }
              onChange(patch);
            };
            return (
              <Chip
                key={`${key}.${selected}`}
                label={label}
                removable
                removeLabel={t('removeFilter', { label })}
                onRemove={remove}
              />
            );
          });
        }
        const formatted =
          key === 'sort'
            ? t(sortMessages[filters.sort])
            : key === 'priceMinPaise' || key === 'priceMaxPaise'
              ? formatMoney(Number(value), locale)
              : key === 'distanceKm' || key === 'radiusKm'
                ? formatDistanceKm(Number(value), locale)
                : String(value);
        const label =
          value === 'true' || key === 'offerId'
            ? t(key)
            : t('filterValue', {
                label: t(key === 'sort' ? 'sortBy' : key),
                value: formatted,
              });
        return [
          <Chip
            key={key}
            label={label}
            removable
            removeLabel={t('removeFilter', { label })}
            onRemove={() =>
              onChange({
                [key]: null,
                ...(key === 'radiusKm' && { view: 'list' }),
              })
            }
          />,
        ];
      })}
    </div>
  );
}
