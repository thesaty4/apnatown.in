'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatLocalBusinessTime } from '@apnatown/shared';
import { Select } from '@apnatown/ui/primitives/Select';
import { Checkbox, Switch } from '@apnatown/ui/primitives/Selection';
import type { ProfileForm } from '../form-model';
import { useFieldError, type SectionProps } from './shared';

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0');
  return `${hours}:${index % 2 ? '30' : '00'}`;
});
/** Monday-first display order of IST `dayOfWeek` values (0 = Sunday). */
const weekOrder = [1, 2, 3, 4, 5, 6, 0];

/** Weekly hours (30-minute steps, IST 12h labels) + temporary closure. */
export function HoursEditor({ form, set, errors, disabled }: SectionProps) {
  const t = useTranslations('business.hours');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const error = useFieldError(errors);
  const options = (current: string) => {
    const values = timeOptions.includes(current)
      ? timeOptions
      : [...timeOptions, current].sort();
    return values.map((value) => ({
      value,
      label: formatLocalBusinessTime(value, locale),
    }));
  };
  const update = (day: number, patch: Partial<ProfileForm['hours'][number]>) =>
    set({
      hours: form.hours.map((entry, index) =>
        index === day ? { ...entry, ...patch } : entry,
      ),
    });
  return (
    <>
      <Switch
        label={t('temporarilyClosed')}
        description={t('temporarilyClosedHint')}
        checked={form.temporarilyClosed}
        disabled={disabled}
        onChange={(event) => set({ temporarilyClosed: event.target.checked })}
      />
      <p className="m-0 text-small text-muted">{t('istNote')}</p>
      <ul className="m-0 grid list-none gap-2 p-0">
        {weekOrder.map((day) => {
          const entry = form.hours[day]!;
          return (
            <li
              key={day}
              className="grid min-w-0 grid-cols-2 items-end gap-2 border-b border-border pb-2 tablet:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]"
            >
              <Checkbox
                wrapperClassName="col-span-2 tablet:col-span-1"
                label={t(`d${day}`)}
                description={entry.open ? t('open') : t('closed')}
                checked={entry.open}
                disabled={disabled}
                onChange={(event) =>
                  update(day, { open: event.target.checked })
                }
              />
              {entry.open && (
                <>
                  <Select
                    label={t('opens')}
                    aria-label={t('opensFor', { day: t(`d${day}`) })}
                    value={entry.opensAt}
                    disabled={disabled}
                    options={options(entry.opensAt)}
                    onChange={(event) =>
                      update(day, { opensAt: event.target.value })
                    }
                  />
                  <Select
                    label={t('closes')}
                    aria-label={t('closesFor', { day: t(`d${day}`) })}
                    value={entry.closesAt}
                    disabled={disabled}
                    options={options(entry.closesAt)}
                    onChange={(event) =>
                      update(day, { closesAt: event.target.value })
                    }
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>
      {error('hours') && (
        <p role="alert" className="m-0 text-field-error text-error">
          {error('hours')}
        </p>
      )}
    </>
  );
}
