'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select, type SelectOption } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { NavIcon } from '../../../shared/ui/NavIcon';
import type { Draft, FieldName } from './editor-model';

export type SectionProps = {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  error: (field: FieldName) => string | undefined;
  disabled: boolean;
};

export const fieldId = (field: FieldName) => `product-${field}`;

/** Names, description and the fixed taxonomy (category → subcategory). */
export function EditorDetails({
  draft,
  set,
  error,
  disabled,
  categories,
  subcategories,
  subcategoriesLoading,
  onSuggest,
}: SectionProps & {
  categories: SelectOption[];
  subcategories: SelectOption[];
  subcategoriesLoading: boolean;
  onSuggest: () => void;
}) {
  const t = useTranslations('products.editor');
  return (
    <Card padded className="grid gap-4">
      <Input
        id={fieldId('nameEn')}
        label={t('nameEn')}
        required
        lang="en"
        maxLength={120}
        autoComplete="off"
        disabled={disabled}
        value={draft.nameEn}
        error={error('nameEn')}
        onChange={(event) => set('nameEn', event.target.value)}
      />
      <Input
        id={fieldId('nameHi')}
        label={t('nameHi')}
        lang="hi"
        maxLength={120}
        autoComplete="off"
        disabled={disabled}
        value={draft.nameHi}
        error={error('nameHi')}
        hint={t('nameHiHint')}
        onChange={(event) => set('nameHi', event.target.value)}
      />
      <TextArea
        id={fieldId('description')}
        label={t('description')}
        maxLength={2000}
        disabled={disabled}
        value={draft.description}
        error={error('description')}
        onChange={(event) => set('description', event.target.value)}
      />
      <div className="grid gap-4 tablet:grid-cols-2">
        <Select
          id={fieldId('categoryId')}
          label={t('category')}
          required
          disabled={disabled}
          value={draft.categoryId}
          error={error('categoryId')}
          hint={t('categoryHint')}
          options={[{ value: '', label: t('choose') }, ...categories]}
          onChange={(event) => {
            set('categoryId', event.target.value);
            set('subcategoryId', '');
          }}
        />
        <Select
          id={fieldId('subcategoryId')}
          label={t('subcategory')}
          required
          disabled={disabled || !draft.categoryId || subcategoriesLoading}
          value={draft.subcategoryId}
          error={error('subcategoryId')}
          options={[
            {
              value: '',
              label: subcategoriesLoading ? t('loadingOptions') : t('choose'),
            },
            ...subcategories,
          ]}
          onChange={(event) => set('subcategoryId', event.target.value)}
        />
      </div>
      <Input
        id={fieldId('brand')}
        label={t('brand')}
        maxLength={80}
        disabled={disabled}
        value={draft.brand}
        error={error('brand')}
        onChange={(event) => set('brand', event.target.value)}
      />
      <div>
        <Button size="small" variant="text" onClick={onSuggest}>
          <NavIcon name="plus" className="size-4.5" />
          {t('suggestSubcategory')}
        </Button>
      </div>
    </Card>
  );
}
