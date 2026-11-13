'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Switch } from '@apnatown/ui/primitives/Selection';
import type { ProfileForm } from '../form-model';
import { useFieldError, type SectionProps } from './shared';

/** Vendor delivery & pickup; money is typed in rupees, stored as paise. */
export function DeliveryFields({ form, set, errors, disabled }: SectionProps) {
  const t = useTranslations('business.delivery');
  const error = useFieldError(errors);
  return (
    <>
      <Select
        label={t('method')}
        value={form.deliveryMethod}
        disabled={disabled}
        error={error('deliveryMethod')}
        onChange={(event) =>
          set({
            deliveryMethod: event.target.value as ProfileForm['deliveryMethod'],
          })
        }
        options={[
          { value: '', label: t('none') },
          { value: 'self', label: t('self') },
          { value: 'apna_town_rider', label: t('rider') },
        ]}
      />
      {form.deliveryMethod && (
        <div className="grid min-w-0 gap-3 tablet:grid-cols-3">
          <Input
            label={t('radius')}
            type="text"
            inputMode="decimal"
            suffix={t('km')}
            required
            value={form.deliveryRadiusKm}
            disabled={disabled}
            error={error('deliveryRadiusKm')}
            onChange={(event) => set({ deliveryRadiusKm: event.target.value })}
          />
          {form.deliveryMethod === 'self' && (
            <Input
              label={t('fee')}
              type="text"
              inputMode="decimal"
              prefix="₹"
              required
              value={form.deliveryFee}
              disabled={disabled}
              error={error('deliveryFee')}
              onChange={(event) => set({ deliveryFee: event.target.value })}
            />
          )}
          <Input
            label={t('minimum')}
            type="text"
            inputMode="decimal"
            prefix="₹"
            required
            value={form.minimumOrder}
            disabled={disabled}
            error={error('minimumOrder')}
            onChange={(event) => set({ minimumOrder: event.target.value })}
          />
        </div>
      )}
      <Switch
        label={t('pickup')}
        checked={form.pickupEnabled}
        disabled={disabled}
        onChange={(event) => set({ pickupEnabled: event.target.checked })}
      />
      {form.pickupEnabled && (
        <TextArea
          label={t('pickupInstructions')}
          hint={t('pickupInstructionsHint')}
          maxLength={300}
          value={form.pickupInstructions}
          disabled={disabled}
          error={error('pickupInstructions')}
          onChange={(event) => set({ pickupInstructions: event.target.value })}
        />
      )}
    </>
  );
}

export function ServiceAreaFields({
  form,
  set,
  errors,
  disabled,
}: SectionProps) {
  const t = useTranslations('business.serviceArea');
  const error = useFieldError(errors);
  return (
    <div className="grid min-w-0 gap-3 tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Input
        label={t('area')}
        hint={t('areaHint')}
        maxLength={200}
        value={form.serviceArea}
        disabled={disabled}
        error={error('serviceArea')}
        onChange={(event) => set({ serviceArea: event.target.value })}
      />
      <Input
        label={t('radius')}
        type="text"
        inputMode="decimal"
        suffix={t('km')}
        value={form.serviceRadiusKm}
        disabled={disabled}
        error={error('serviceRadiusKm')}
        onChange={(event) => set({ serviceRadiusKm: event.target.value })}
      />
    </div>
  );
}
