'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { discountPercent, newSpec } from './editor-model';
import { fieldId, type SectionProps } from './EditorDetails';
import { ProductIcon } from './icons';

const SPEC_MAX = 30;

/** Price/MRP (₹ input → integer paise), unit, SKU, stock, variants, tags, specs. */
export function EditorPricing({ draft, set, error, disabled }: SectionProps) {
  const t = useTranslations('products.editor');
  const discount = discountPercent(draft);
  const money = { inputMode: 'decimal' as const, autoComplete: 'off', dir: 'ltr' };
  const count = { inputMode: 'numeric' as const, autoComplete: 'off', dir: 'ltr' };
  return (
    <Card padded className="grid gap-4">
      <div className="grid gap-4 tablet:grid-cols-2">
        <Input
          id={fieldId('price')}
          label={t('price')}
          required
          {...money}
          disabled={disabled}
          value={draft.price}
          error={error('price')}
          onChange={(event) => set('price', event.target.value)}
        />
        <Input
          id={fieldId('mrp')}
          label={t('mrp')}
          {...money}
          disabled={disabled}
          value={draft.mrp}
          error={error('mrp')}
          hint={
            discount !== undefined
              ? t('discount', { percent: discount })
              : t('mrpHint')
          }
          onChange={(event) => set('mrp', event.target.value)}
        />
        <Input
          id={fieldId('unit')}
          label={t('unit')}
          required
          maxLength={40}
          placeholder={t('unitPlaceholder')}
          disabled={disabled}
          value={draft.unit}
          error={error('unit')}
          onChange={(event) => set('unit', event.target.value)}
        />
        <Input
          id={fieldId('sku')}
          label={t('sku')}
          maxLength={64}
          dir="ltr"
          autoComplete="off"
          disabled={disabled}
          value={draft.sku}
          error={error('sku')}
          hint={t('skuHint')}
          onChange={(event) => set('sku', event.target.value)}
        />
        <Input
          id={fieldId('onHand')}
          label={t('stock')}
          {...count}
          disabled={disabled}
          value={draft.onHand}
          error={error('onHand')}
          onChange={(event) => set('onHand', event.target.value)}
        />
        <Input
          id={fieldId('lowStockThreshold')}
          label={t('lowStock')}
          {...count}
          disabled={disabled}
          value={draft.lowStockThreshold}
          error={error('lowStockThreshold')}
          onChange={(event) => set('lowStockThreshold', event.target.value)}
        />
      </div>
      <Input
        id={fieldId('variants')}
        label={t('variants')}
        hint={t('variantsHint')}
        disabled={disabled}
        value={draft.variants}
        error={error('variants')}
        onChange={(event) => set('variants', event.target.value)}
      />
      <Input
        id={fieldId('tags')}
        label={t('tags')}
        hint={t('tagsHint')}
        disabled={disabled}
        value={draft.tags}
        error={error('tags')}
        onChange={(event) => set('tags', event.target.value)}
      />
      <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0">
        <legend className="mb-2 text-field-label font-semibold">{t('specs')}</legend>
        {draft.specs.map((row, index) => (
          <div key={row.key} className="flex min-w-0 flex-wrap items-end gap-2">
            <Input
              id={index === 0 ? fieldId('specs') : undefined}
              label={t('specLabel', { n: index + 1 })}
              wrapperClassName="min-w-0 flex-1 basis-36"
              maxLength={60}
              disabled={disabled}
              value={row.label}
              onChange={(event) =>
                set(
                  'specs',
                  draft.specs.map((spec) =>
                    spec.key === row.key ? { ...spec, label: event.target.value } : spec,
                  ),
                )
              }
            />
            <Input
              label={t('specValue', { n: index + 1 })}
              wrapperClassName="min-w-0 flex-1 basis-48"
              maxLength={200}
              disabled={disabled}
              value={row.value}
              onChange={(event) =>
                set(
                  'specs',
                  draft.specs.map((spec) =>
                    spec.key === row.key ? { ...spec, value: event.target.value } : spec,
                  ),
                )
              }
            />
            <Button
              variant="ghost"
              disabled={disabled}
              aria-label={t('removeSpec', { n: index + 1 })}
              onClick={() =>
                set(
                  'specs',
                  draft.specs.filter((spec) => spec.key !== row.key),
                )
              }
            >
              <ProductIcon name="trash" className="size-4.5" />
            </Button>
          </div>
        ))}
        {error('specs') && (
          <p role="alert" className="m-0 text-field-error font-medium text-error">
            {error('specs')}
          </p>
        )}
        <div>
          <Button
            size="small"
            variant="text"
            disabled={disabled || draft.specs.length >= SPEC_MAX}
            onClick={() => set('specs', [...draft.specs, newSpec()])}
          >
            <NavIcon name="plus" className="size-4.5" />
            {t('addSpec')}
          </Button>
        </div>
      </fieldset>
    </Card>
  );
}
