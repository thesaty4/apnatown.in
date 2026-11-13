'use client';

import { useTranslations } from 'next-intl';
import {
  SERVICE_DESCRIPTION_MAX,
  SERVICE_PRICE_TYPES,
  SERVICE_UNITS,
  type ServicePriceType,
  type ServiceUnit,
} from '@apnatown/shared/services';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { ServiceSubcategorySelect } from '../../catalog';
import type { ServiceField, ServiceForm } from './form-model';
import { unitKey } from './parts';

export type FieldsProps = {
  form: ServiceForm;
  set: (patch: Partial<ServiceForm>) => void;
  /** Localized message per field. */
  error: (field: ServiceField) => string | undefined;
  disabled: boolean;
  businessId: string;
  onUploadsPending: (pending: boolean) => void;
};

export const SECTION =
  'grid min-w-0 gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0';

/** Title, taxonomy, description (prototype `svEdit` fields, extended). */
export function BasicsFields({ form, set, error, disabled }: FieldsProps) {
  const t = useTranslations('service.manager.form');
  return (
    <div className={SECTION}>
      <Input
        label={t('nameEn')}
        required
        maxLength={60}
        autoComplete="off"
        value={form.nameEn}
        error={error('nameEn')}
        disabled={disabled}
        onChange={(event) => set({ nameEn: event.target.value })}
      />
      <Input
        label={t('nameHi')}
        hint={t('optional')}
        lang="hi"
        maxLength={60}
        autoComplete="off"
        value={form.nameHi}
        error={error('nameHi')}
        disabled={disabled}
        onChange={(event) => set({ nameHi: event.target.value })}
      />
      <ServiceSubcategorySelect
        value={{
          categoryId: form.categoryId,
          subcategoryId: form.subcategoryId,
        }}
        onChange={(value) => set(value)}
        error={error('subcategoryId') ?? error('categoryId')}
        disabled={disabled}
      />
      <TextArea
        label={t('description')}
        hint={t('optional')}
        maxLength={SERVICE_DESCRIPTION_MAX}
        rows={4}
        value={form.description}
        error={error('description')}
        disabled={disabled}
        onChange={(event) => set({ description: event.target.value })}
      />
    </div>
  );
}

/** Price type + amount(s) in rupees + optional unit. */
export function PriceFields({ form, set, error, disabled }: FieldsProps) {
  const t = useTranslations('service.manager.form');
  const tu = useTranslations('explore.screen.unit');
  const enquiry = form.priceType === 'enquiry';
  const range = form.priceType === 'range';
  const amount = (
    field: 'priceFrom' | 'priceTo',
    label: string,
    errorField: ServiceField,
  ) => (
    <Input
      label={label}
      required
      inputMode="decimal"
      autoComplete="off"
      dir="ltr"
      prefix={<span aria-hidden="true">₹</span>}
      placeholder="0"
      maxLength={12}
      value={form[field]}
      error={error(errorField)}
      disabled={disabled}
      onChange={(event) =>
        set(
          field === 'priceFrom'
            ? { priceFrom: event.target.value }
            : { priceTo: event.target.value },
        )
      }
    />
  );
  return (
    <fieldset className={SECTION} disabled={disabled}>
      <legend className="mb-2 text-field-label font-semibold">
        {t('price')}
      </legend>
      <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
        <Select
          label={t('priceTypeLabel')}
          value={form.priceType}
          options={SERVICE_PRICE_TYPES.map((type) => ({
            value: type,
            label: t(`priceType.${type}`),
          }))}
          onChange={(event) => {
            const priceType = event.target.value as ServicePriceType;
            set({
              priceType,
              ...(priceType === 'enquiry' && { priceFrom: '', unit: '' }),
              ...(priceType !== 'range' && { priceTo: '' }),
            });
          }}
        />
        {!enquiry && (
          <Select
            label={t('unit')}
            hint={t('optional')}
            value={form.unit}
            options={[
              { value: '', label: t('noUnit') },
              ...SERVICE_UNITS.map((unit) => ({
                value: unit,
                label: tu(unitKey(unit)),
              })),
            ]}
            onChange={(event) =>
              set({ unit: event.target.value as ServiceUnit | '' })
            }
          />
        )}
        {!enquiry &&
          amount(
            'priceFrom',
            t(
              range
                ? 'amountMin'
                : form.priceType === 'from'
                  ? 'amountFrom'
                  : 'amountFixed',
            ),
            'priceFromPaise',
          )}
        {range && amount('priceTo', t('amountMax'), 'priceToPaise')}
      </div>
      {enquiry && (
        <p className="m-0 text-small text-text-2">{t('enquiryHint')}</p>
      )}
    </fieldset>
  );
}

/** Included / not included lines and the service area. */
export function ScopeFields({ form, set, error, disabled }: FieldsProps) {
  const t = useTranslations('service.manager.form');
  return (
    <div className={SECTION}>
      <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
        <TextArea
          label={t('included')}
          hint={t('linesHint')}
          rows={4}
          value={form.included}
          error={error('included')}
          disabled={disabled}
          onChange={(event) => set({ included: event.target.value })}
        />
        <TextArea
          label={t('excluded')}
          hint={t('linesHint')}
          rows={4}
          value={form.excluded}
          error={error('excluded')}
          disabled={disabled}
          onChange={(event) => set({ excluded: event.target.value })}
        />
      </div>
      <Input
        label={t('serviceArea')}
        hint={t('serviceAreaHint')}
        maxLength={120}
        autoComplete="off"
        value={form.serviceArea}
        error={error('serviceArea')}
        disabled={disabled}
        onChange={(event) => set({ serviceArea: event.target.value })}
      />
    </div>
  );
}
