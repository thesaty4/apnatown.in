'use client';

import { useForm } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { formatMoney, parseRupees } from '@apnatown/shared/formatters';
import { Input } from '@apnatown/ui/primitives/Input';
import type { FilterPatch } from './url-state';

export function PriceFilter({ min, max, range, onChange }: {
  min?: number | undefined;
  max?: number | undefined;
  range: { minPaise: number; maxPaise: number } | null;
  onChange: (patch: FilterPatch) => void;
}) {
  const t = useTranslations('explore.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const form = useForm({
    values: { min: min === undefined ? '' : String(min / 100), max: max === undefined ? '' : String(max / 100) },
  });
  const maximumDraft = form.watch('max');
  const sliderPrice = maximumDraft === '' ? range?.maxPaise : parseRupees(maximumDraft);
  const submit = form.handleSubmit((values) => {
    const minimum = values.min === '' ? undefined : parseRupees(values.min);
    const maximum = values.max === '' ? undefined : parseRupees(values.max);
    if (minimum === null || maximum === null || (minimum !== undefined && maximum !== undefined && minimum > maximum)) {
      form.setError('max', { message: t('invalidPrice') });
      return;
    }
    form.clearErrors();
    onChange({ priceMinPaise: minimum ?? null, priceMaxPaise: maximum ?? null });
  });
  return (
    <form onSubmit={submit} className="grid gap-2">
      <h3 className="font-semibold">{t('price')}</h3>
      <div className="grid grid-cols-2 gap-2">
        <Input {...form.register('min')} type="number" min="0" step="0.01" inputMode="decimal" label={t('priceMinPaise')}
          onBlur={() => void submit()} />
        <Input {...form.register('max')} type="number" min="0" step="0.01" inputMode="decimal" label={t('priceMaxPaise')}
          onBlur={() => void submit()} error={form.formState.errors.max?.message} />
      </div>
      {range && range.maxPaise > range.minPaise && sliderPrice != null && (
        <label className="grid gap-2 text-small">
          {t('upTo', { price: formatMoney(sliderPrice, locale) })}
          <input type="range" min={0} max={range.maxPaise} step={1}
            value={Math.min(sliderPrice, range.maxPaise)}
            onChange={(event) => form.setValue('max', String(Number(event.target.value) / 100))}
            onPointerUp={() => void submit()} onKeyUp={() => void submit()}
            aria-label={t('priceMaxPaise')} className="min-h-touch w-full accent-primary" />
        </label>
      )}
      <button type="submit" className="sr-only">{t('apply')}</button>
    </form>
  );
}
