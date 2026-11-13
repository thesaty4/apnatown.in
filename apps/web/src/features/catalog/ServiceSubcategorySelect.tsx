'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Select } from '@apnatown/ui/primitives/Select';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { catalogName } from './parts';
import { categoriesOptions, categoryOptions } from './queries';

export type ServiceTaxonomyValue = {
  categoryId: string;
  /** Exactly one active service subcategory per service (BR-08). */
  subcategoryId: string;
};

/**
 * S-VEND-13 taxonomy selector contract: active service categories, then one
 * active subcategory of the chosen category. The service form (owned by
 * `services`) saves `subcategoryId`; provider expertise stays separate.
 */
export function ServiceSubcategorySelect({
  value,
  onChange,
  error,
  disabled = false,
}: {
  value: ServiceTaxonomyValue;
  onChange: (value: ServiceTaxonomyValue) => void;
  /** Localized field error from the owning form (e.g. API rejection). */
  error?: string | undefined;
  disabled?: boolean;
}) {
  const t = useTranslations('catalog.taxonomy');
  const locale = useLocale();
  const { api } = useSession();
  const categories = useQuery(categoriesOptions(api, 'service'));
  const active = (categories.data?.items ?? []).filter((item) => item.active);
  const selected = active.find((item) => item.id === value.categoryId);
  const detail = useQuery({
    ...categoryOptions(api, selected?.slug ?? ''),
    enabled: Boolean(selected),
  });
  const subcategories = (detail.data?.subcategories ?? []).filter(
    (item) => item.active,
  );
  const failed = categories.isError || detail.isError;
  return (
    <fieldset className="grid min-w-0 gap-3" disabled={disabled}>
      <legend className="mb-2 text-field-label font-semibold">
        {t('legend')}
      </legend>
      <Select
        label={t('category')}
        required
        value={value.categoryId}
        disabled={categories.isPending}
        options={[
          { value: '', label: t('chooseCategory') },
          ...active.map((item) => ({
            value: item.id,
            label: catalogName(item, locale),
          })),
        ]}
        onChange={(event) =>
          onChange({ categoryId: event.target.value, subcategoryId: '' })
        }
      />
      <Select
        label={t('subcategory')}
        required
        value={value.subcategoryId}
        disabled={!selected || detail.isPending}
        hint={selected ? undefined : t('pickCategoryFirst')}
        error={
          error ??
          (selected && detail.isSuccess && subcategories.length === 0
            ? t('noSubcategories')
            : undefined)
        }
        options={[
          { value: '', label: t('chooseSubcategory') },
          ...subcategories.map((item) => ({
            value: item.id,
            label: catalogName(item, locale),
          })),
        ]}
        onChange={(event) =>
          onChange({ ...value, subcategoryId: event.target.value })
        }
      />
      {failed && (
        <div role="alert" className="flex flex-wrap items-center gap-2">
          <p className="text-small text-text">{t('loadFailed')}</p>
          <Button
            variant="outline"
            onClick={() =>
              void (categories.isError
                ? categories.refetch()
                : detail.refetch())
            }
          >
            {t('retry')}
          </Button>
        </div>
      )}
    </fieldset>
  );
}
