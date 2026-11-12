'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type {
  SuperAdminSettings,
  SettingValue,
} from '@apnatown/shared/settings';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import {
  FormCard,
  rupees,
  textOf,
  toNumber,
  toPaise,
  useSectionForm,
  type Issues,
} from './form';

type Form = {
  slabs: { uptoKm: string; fee: string }[];
  base: string;
  perKm: string;
};
const keys = ['delivery', 'rider_earning'] as const;
const money = /^\d{1,9}(?:\.\d{1,2})?$/;

function toForm(values: { delivery?: unknown; rider_earning?: unknown }): Form {
  const delivery = values.delivery as SettingValue<'delivery'> | null;
  const rider = values.rider_earning as SettingValue<'rider_earning'> | null;
  return {
    slabs: delivery?.slabs.map((slab) => ({
      uptoKm: textOf(slab.uptoKm),
      fee: rupees(slab.feePaise),
    })) ?? [{ uptoKm: '', fee: '' }],
    base: rupees(rider?.basePaise),
    perKm: rupees(rider?.perKmPaise),
  };
}

function toValues(form: Form, issues: Issues) {
  return {
    delivery: {
      slabs: form.slabs.map((slab, index) => ({
        uptoKm: toNumber(
          slab.uptoKm,
          `delivery.slabs.${index}.uptoKm`,
          issues,
          false,
        ),
        feePaise: toPaise(slab.fee, `delivery.slabs.${index}.feePaise`, issues),
      })),
    },
    rider_earning: {
      basePaise: toPaise(form.base, 'rider_earning.basePaise', issues),
      perKmPaise: toPaise(form.perKm, 'rider_earning.perKmPaise', issues),
    },
  };
}

/** Delivery fee slabs + rider earning rule: one atomic `delivery_rider_pay` save. */
export function DeliverySettingsForm({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.delivery');
  const tf = useTranslations('superAdmin.settings');
  const format = useFormatter();
  const section = useSectionForm({
    id: 'delivery_rider_pay',
    data,
    keys,
    group: 'delivery_rider_pay',
    toForm,
    toValues,
  });
  const { form, change, has } = section;
  const field = (path: string) => (has(path) ? tf('errors.field') : undefined);
  const setSlab = (index: number, patch: Partial<Form['slabs'][number]>) =>
    change((current) => ({
      ...current,
      slabs: current.slabs.map((slab, i) =>
        i === index ? { ...slab, ...patch } : slab,
      ),
    }));
  // Live example only from entered/configured values; never a demo fallback.
  const example =
    money.test(form.base.trim()) && money.test(form.perKm.trim())
      ? Number(form.base) + 3 * Number(form.perKm)
      : undefined;

  return (
    <FormCard
      title={t('slabsTitle')}
      section={section}
      saveLabel={t('save')}
      rules={(path) => (path === 'delivery.slabs' ? t('slabOrder') : undefined)}
    >
      <fieldset className="grid gap-3">
        <legend className="sr-only">{t('slabsTitle')}</legend>
        {form.slabs.map((slab, index) => (
          <div
            key={index}
            className="grid items-end gap-3 tablet:grid-cols-[1fr_1fr_auto]"
          >
            <Input
              label={t('uptoKm')}
              inputMode="decimal"
              value={slab.uptoKm}
              required
              error={field(`delivery.slabs.${index}.uptoKm`)}
              onChange={(event) =>
                setSlab(index, { uptoKm: event.target.value })
              }
            />
            <Input
              label={t('fee')}
              inputMode="decimal"
              value={slab.fee}
              required
              error={field(`delivery.slabs.${index}.feePaise`)}
              onChange={(event) => setSlab(index, { fee: event.target.value })}
            />
            {form.slabs.length > 1 && (
              <Button
                type="button"
                variant="text"
                aria-label={t('removeSlab', { row: index + 1 })}
                onClick={() =>
                  change((current) => ({
                    ...current,
                    slabs: current.slabs.filter((_, i) => i !== index),
                  }))
                }
              >
                {tf('remove')}
              </Button>
            )}
          </div>
        ))}
        {form.slabs.length < 3 && (
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            onClick={() =>
              change((current) => ({
                ...current,
                slabs: [...current.slabs, { uptoKm: '', fee: '' }],
              }))
            }
          >
            {t('addSlab')}
          </Button>
        )}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 text-h4">{t('riderTitle')}</legend>
        <div className="grid gap-3 tablet:grid-cols-2">
          <Input
            label={t('base')}
            inputMode="decimal"
            value={form.base}
            required
            error={field('rider_earning.basePaise')}
            onChange={(event) =>
              change((current) => ({ ...current, base: event.target.value }))
            }
          />
          <Input
            label={t('perKm')}
            inputMode="decimal"
            value={form.perKm}
            required
            error={field('rider_earning.perKmPaise')}
            onChange={(event) =>
              change((current) => ({ ...current, perKm: event.target.value }))
            }
          />
        </div>
        {example !== undefined && (
          <p className="text-small text-muted" aria-live="polite">
            {t('example', {
              amount: format.number(example, {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2,
              }),
            })}
          </p>
        )}
      </fieldset>
      <p className="text-small text-muted">{tf('newOrdersOnly')}</p>
    </FormCard>
  );
}
