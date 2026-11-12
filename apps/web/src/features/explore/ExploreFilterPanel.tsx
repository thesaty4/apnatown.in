'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { ExploreFacet, ExploreResponse } from '@apnatown/shared/search';
import { Button } from '@apnatown/ui/primitives/Button';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { Select } from '@apnatown/ui/primitives/Select';
import { sortsFor, type ExploreFilters, type FilterPatch } from './url-state';
import { PriceFilter } from './PriceFilter';
import { ServiceCategoryFilter } from './ServiceCategoryFilter';

export function ExploreFilterPanel({ filters, facets, onChange, onReset }: {
  filters: ExploreFilters;
  facets: ExploreResponse['facets'];
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
}) {
  const t = useTranslations('explore.screen');
  const locale = useLocale();
  const format = useFormatter();
  const facetOptions = (items: ExploreFacet[], all: string) => [
    { value: '', label: all },
    ...items.map((item) => ({
      value: item.value, label: `${locale === 'hi' && item.labelHi ? item.labelHi : item.labelEn} (${format.number(item.count)})`,
      disabled: item.disabled && !item.selected,
    })),
  ];
  const checks = filters.tab === 'products'
    ? ['offers', 'inStock', 'featured', 'deliversToMe', 'pickup'] as const
    : filters.tab === 'shops'
      ? ['openNow', 'deliversToMe', 'offers', 'verified', 'featured'] as const
      : ['priceOnEnquiry', 'availableToday', 'offers', 'verified'] as const;
  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3">{t('filters')}</h2>
        <Button variant="text" onClick={onReset}>{t('reset')}</Button>
      </div>
      {filters.tab !== 'shops' && <PriceFilter min={filters.priceMinPaise} max={filters.priceMaxPaise}
        range={facets.priceRange} onChange={onChange} />}
      {filters.tab === 'services' ? (
        <ServiceCategoryFilter categories={facets.categories} subcategories={facets.subcategories}
          category={filters.category} subcategory={filters.subcategory} onChange={onChange} />
      ) : (
        <Select label={t('category')} value={filters.category ?? ''}
          options={facetOptions(facets.categories, t('allCategories'))}
          onChange={(event) => onChange({
            category: event.target.value,
            ...(filters.tab === 'products' && { subcategory: '', brand: null }),
          })} />
      )}
      {filters.tab === 'products' && <>
        <Select label={t('subcategory')} value={filters.subcategory ?? ''}
          options={facetOptions(facets.subcategories, t('allSubcategories'))}
          onChange={(event) => onChange({ subcategory: event.target.value })} />
        <Select label={t('brand')} value={filters.brand ?? ''}
          options={facetOptions(facets.brands, t('allBrands'))}
          onChange={(event) => onChange({ brand: event.target.value || null })} />
      </>}
      <Select label={t('rating')} value={String(filters.rating ?? 0)}
        options={[{ value: '0', label: t('anyRating') },
          ...[3, 4, 4.5].map((value) => ({ value: String(value), label: t('ratingUp', { rating: value }) }))]}
        onChange={(event) => onChange({ rating: Number(event.target.value) || null })} />
      <fieldset className="grid gap-1">
        <legend className="mb-2 font-semibold">{t('availability')}</legend>
        {checks.map((key) => <Checkbox key={key} label={t(key)} checked={filters[key] === 'true'}
          onChange={(event) => onChange({ [key]: event.target.checked ? 'true' : null })} />)}
      </fieldset>
      <Select label={t('distanceKm')} value={String(filters.distanceKm ?? '')}
        options={[{ value: '', label: t('anyDistance') },
          ...[1, 3, 5, 10].map((km) => ({ value: String(km), label: t('withinKm', { km }) }))]}
        onChange={(event) => onChange({ distanceKm: event.target.value ? Number(event.target.value) : null })} />
      <Select label={t('sortBy')} value={filters.sort}
        options={sortsFor(filters.tab).map((value) => ({ value, label: t(`sort.${value}`) }))}
        onChange={(event) => onChange({ sort: event.target.value })} />
    </div>
  );
}
