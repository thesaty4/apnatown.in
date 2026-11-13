'use client';

import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { BUSINESS_CATEGORY_LIMIT } from '@apnatown/shared/businesses';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { categoriesOptions, catalogName } from '../../catalog';
import { useSession } from '../../../shared/auth/SessionProvider';
import { useFieldError, type SectionProps } from './shared';

/** Product categories (server rule): up to the limit, exactly one primary. */
export function CategoryPicker({ form, set, errors, disabled }: SectionProps) {
  const t = useTranslations('business.fields');
  const locale = useLocale();
  const error = useFieldError(errors);
  const { api } = useSession();
  const categories = useQuery(categoriesOptions(api, 'product'));
  const groupId = useId();
  const active = (categories.data?.items ?? []).filter((item) => item.active);
  const selected = active.filter((item) => form.categoryIds.includes(item.id));
  const full = form.categoryIds.length >= BUSINESS_CATEGORY_LIMIT;
  function toggle(id: string) {
    if (form.categoryIds.includes(id)) {
      const categoryIds = form.categoryIds.filter((item) => item !== id);
      set({
        categoryIds,
        primaryCategoryId:
          form.primaryCategoryId === id
            ? (categoryIds[0] ?? '')
            : form.primaryCategoryId,
      });
    } else if (!full) {
      set({
        categoryIds: [...form.categoryIds, id],
        primaryCategoryId: form.primaryCategoryId || id,
      });
    }
  }
  const message = error('categoryIds');
  return (
    <fieldset
      className="m-0 grid min-w-0 gap-2 border-0 p-0"
      disabled={disabled}
    >
      <legend className="mb-1 text-field-label font-semibold">
        {t('categories')} <span aria-hidden="true">*</span>
      </legend>
      <p className="m-0 text-small text-muted">
        {t('categoriesHint', { limit: BUSINESS_CATEGORY_LIMIT })}
      </p>
      {categories.isPending ? (
        <Skeleton label={t('categoriesLoading')} />
      ) : categories.isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 text-small text-error"
        >
          <span>{t('categoriesFailed')}</span>
          <Button
            size="small"
            variant="outline"
            disabled={categories.isFetching}
            onClick={() => void categories.refetch()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : active.length === 0 ? (
        <p className="m-0 text-small text-text-2">{t('categoriesEmpty')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {active.map((item) => {
            const on = form.categoryIds.includes(item.id);
            return (
              <Chip
                key={item.id}
                label={catalogName(item, locale)}
                selected={on}
                icon={on ? undefined : item.icon}
                disabled={disabled || (!on && full)}
                onClick={() => toggle(item.id)}
              />
            );
          })}
        </div>
      )}
      {message && (
        <p role="alert" className="m-0 text-field-error text-error">
          {message}
        </p>
      )}
      {selected.length > 1 && (
        <div
          role="radiogroup"
          aria-labelledby={groupId}
          className="grid gap-1 rounded-md bg-surface-2 p-3"
        >
          <p id={groupId} className="m-0 text-small font-semibold">
            {t('primaryCategory')}
          </p>
          {selected.map((item) => (
            <Radio
              key={item.id}
              name={`${groupId}-primary`}
              label={catalogName(item, locale)}
              checked={form.primaryCategoryId === item.id}
              disabled={disabled}
              onChange={() => set({ primaryCategoryId: item.id })}
            />
          ))}
          {error('primaryCategoryId') && (
            <p role="alert" className="m-0 text-field-error text-error">
              {error('primaryCategoryId')}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
