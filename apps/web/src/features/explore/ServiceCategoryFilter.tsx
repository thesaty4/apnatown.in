'use client';

import { useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { ExploreFacet } from '@apnatown/shared/search';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { selectedValues, type FilterPatch } from './url-state';

export function ServiceCategoryFilter({
  categories,
  subcategories,
  category,
  subcategory,
  onChange,
}: {
  categories: ExploreFacet[];
  subcategories: ExploreFacet[];
  category?: string | undefined;
  subcategory?: string | undefined;
  onChange: (patch: FilterPatch) => void;
}) {
  const t = useTranslations('explore.screen');
  const locale = useLocale();
  const format = useFormatter();
  const cats = selectedValues(category);
  const subs = selectedValues(subcategory);
  const name = (facet: ExploreFacet) =>
    locale === 'hi' && facet.labelHi ? facet.labelHi : facet.labelEn;
  const removeCategory = (facet: ExploreFacet) =>
    onChange({
      category: cats.filter((value) => value !== facet.value).join(','),
      subcategory: subs
        .filter(
          (value) =>
            !subcategories.some(
              (sub) => sub.value === value && sub.categoryId === facet.id,
            ),
        )
        .join(','),
    });
  return (
    <fieldset className="grid min-w-0 gap-3">
      <legend className="mb-2 font-semibold">
        {t('categoryAndSubcategory')}
      </legend>
      <div className="grid gap-1">
        {categories.map((facet) => (
          <Checkbox
            key={facet.id}
            label={`${name(facet)} (${format.number(facet.count)})`}
            checked={cats.includes(facet.value)}
            disabled={facet.disabled && !cats.includes(facet.value)}
            onChange={(event) =>
              event.target.checked
                ? onChange({
                    category: [...cats, facet.value].join(','),
                    ...(cats.length === 0 && {
                      subcategory: subs
                        .filter((value) =>
                          subcategories.some(
                            (sub) =>
                              sub.value === value &&
                              sub.categoryId === facet.id,
                          ),
                        )
                        .join(','),
                    }),
                  })
                : removeCategory(facet)
            }
          />
        ))}
      </div>
      {categories
        .filter(
          (facet) =>
            cats.includes(facet.value) ||
            (cats.length === 0 &&
              subcategories.some(
                (sub) => sub.categoryId === facet.id && sub.count > 0,
              )) ||
            subcategories.some(
              (sub) => sub.categoryId === facet.id && subs.includes(sub.value),
            ),
        )
        .map((facet) => (
          <SubcategoryGroup
            key={facet.id}
            label={`${name(facet)} (${format.number(facet.count)})`}
            open={
              cats.includes(facet.value) ||
              subcategories.some(
                (sub) =>
                  sub.categoryId === facet.id && subs.includes(sub.value),
              )
            }
            options={subcategories.filter((sub) => sub.categoryId === facet.id)}
            selected={subs}
            onChange={(values) => onChange({ subcategory: values.join(',') })}
          />
        ))}
      {(cats.length > 0 || subs.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {[
            ...categories.filter((facet) => cats.includes(facet.value)),
            ...subcategories.filter((facet) => subs.includes(facet.value)),
          ].map((facet) => {
            const parent = categories.find(
              (item) => item.id === facet.categoryId,
            );
            const label = parent
              ? t('filterValue', { label: name(parent), value: name(facet) })
              : name(facet);
            return (
              <Chip
                key={facet.id}
                label={label}
                removable
                removeLabel={t('removeFilter', { label })}
                onRemove={() =>
                  facet.categoryId
                    ? onChange({
                        subcategory: subs
                          .filter((value) => value !== facet.value)
                          .join(','),
                      })
                    : removeCategory(facet)
                }
              />
            );
          })}
          <Button
            variant="text"
            onClick={() => onChange({ category: '', subcategory: '' })}
          >
            {t('clearCategories')}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

function SubcategoryGroup({
  label,
  open,
  options,
  selected,
  onChange,
}: {
  label: string;
  open: boolean;
  options: ExploreFacet[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const t = useTranslations('explore.screen');
  const locale = useLocale();
  const format = useFormatter();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const matching = options.filter((option) =>
    `${option.labelEn} ${option.labelHi}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const visible = expanded || query ? matching : matching.slice(0, 8);
  const outside = selected.filter(
    (value) => !options.some((option) => option.value === value),
  );
  return (
    <details open={open} className="rounded-md border border-border p-3">
      <summary className="cursor-pointer font-semibold">{label}</summary>
      <div className="grid gap-2 pt-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="text"
            onClick={() =>
              onChange([
                ...new Set([
                  ...selected,
                  ...options
                    .filter((option) => !option.disabled)
                    .map((option) => option.value),
                ]),
              ])
            }
          >
            {t('selectAll')}
          </Button>
          <Button variant="text" onClick={() => onChange(outside)}>
            {t('clear')}
          </Button>
        </div>
        {options.length > 8 && (
          <Input
            type="search"
            label={t('searchSubcategories')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        {visible.map((option) => (
          <Checkbox
            key={option.id}
            wrapperClassName={`rounded-pill border px-3 ${selected.includes(option.value) ? 'border-primary bg-primary-soft' : 'border-border bg-surface'} has-[:focus-visible]:ring-focus`}
            label={`${locale === 'hi' && option.labelHi ? option.labelHi : option.labelEn} (${format.number(option.count)})`}
            checked={selected.includes(option.value)}
            disabled={option.disabled && !selected.includes(option.value)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...selected, option.value]
                  : selected.filter((value) => value !== option.value),
              )
            }
          />
        ))}
        {matching.length === 0 && (
          <p className="text-small text-muted">{t('noMatch')}</p>
        )}
        {!query && matching.length > 8 && (
          <Button variant="text" onClick={() => setExpanded(!expanded)}>
            {t(expanded ? 'showLess' : 'showMore')}
          </Button>
        )}
      </div>
    </details>
  );
}
