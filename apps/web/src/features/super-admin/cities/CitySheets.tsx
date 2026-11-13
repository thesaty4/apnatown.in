'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CreateCitySchema,
  GST_STATES,
  type AdminCity,
  type CityStatus,
  type CreateCity,
  type GstStateCode,
} from '@apnatown/shared/geo';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { cityStatusIcon, cityStatusKey, cityStatusTone } from '../../geo/parts';
import { AdminFailure } from '../../admin';
import { useIdempotentCommand } from '../queries';
import { createCity, setCityStatus } from './api';
import { useRefreshPublicCities } from './queries';

export const cityName = (city: AdminCity, locale: string) =>
  locale === 'hi' ? city.nameHi : city.nameEn;

export function CityStatusBadge({ status }: { status: CityStatus }) {
  const t = useTranslations('geo.cities');
  return (
    <Badge
      tone={cityStatusTone[status]}
      icon={cityStatusIcon[status]}
      label={t(`status.${cityStatusKey(status)}`)}
    />
  );
}

/** GST state options. Names are the statutory English names from the shared
 * GST state table; the code is shown alongside so the choice is unambiguous. */
export function useStateOptions() {
  const t = useTranslations('geo.cities');
  return GST_STATES.map((state) => ({
    value: state.code,
    label: t('stateOption', { code: state.code, name: state.nameEn }),
  }));
}

/** Enable (disabled/coming soon → enabled) or disable (enabled → coming soon)
 * with the prototype impact copy. A version conflict refetches the city and
 * keeps the dialog open so the admin can confirm against the latest state. */
export function CityStatusDialog({
  city,
  onClose,
  onDone,
}: {
  city: AdminCity;
  onClose: () => void;
  onDone: (city: AdminCity) => void;
}) {
  const t = useTranslations('geo.cities');
  const locale = useLocale();
  const refreshPublic = useRefreshPublicCities();
  const disable = city.status === 'enabled';
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof setCityStatus>[1], cmd) =>
      setCityStatus(api, body, cmd),
  );
  const name = cityName(city, locale);
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && !command.busy && onClose()}
      title={t(disable ? 'disableTitle' : 'enableTitle', { city: name })}
      impact={t(disable ? 'disableImpact' : 'enableImpact')}
      cancelLabel={t('cancel')}
      confirmLabel={t(disable ? 'confirmDisable' : 'confirmEnable')}
      tone={disable ? 'danger' : 'primary'}
      busy={command.busy}
      onConfirm={() =>
        command.submit(
          {
            cityId: city.id,
            action: disable ? 'disable' : 'enable',
            expectedVersion: city.version,
          },
          (updated) => {
            refreshPublic();
            onDone(updated);
          },
        )
      }
    >
      {command.code && <AdminFailure code={command.code} />}
    </ConfirmDialog>
  );
}

type CityDraft = {
  nameEn: string;
  nameHi: string;
  stateCode: GstStateCode | '';
  status: CityStatus;
};
const emptyDraft: CityDraft = {
  nameEn: '',
  nameHi: '',
  stateCode: '',
  status: 'coming_soon',
};

export function CreateCitySheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (city: AdminCity) => void;
}) {
  const t = useTranslations('geo.cities');
  const states = useStateOptions();
  const refreshPublic = useRefreshPublicCities();
  const [draft, setDraft] = useState<CityDraft>(emptyDraft);
  const [checked, setChecked] = useState(false);
  const command = useIdempotentCommand(
    (api, body: CreateCity, cmd) => createCity(api, body, cmd),
  );
  const parsed = CreateCitySchema.safeParse(draft);
  const invalid = new Set<string>(
    checked && !parsed.success
      ? parsed.error.issues.map((issue) => String(issue.path[0]))
      : [],
  );
  for (const field of command.fields) invalid.add(field);
  const set = (patch: Partial<CityDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!parsed.success) return;
    command.submit(parsed.data, (city) => {
      setDraft(emptyDraft);
      setChecked(false);
      refreshPublic();
      onCreated(city);
    });
  }

  const statusOptions = (['coming_soon', 'enabled', 'disabled'] as const).map(
    (value) => ({ value, label: t(`status.${cityStatusKey(value)}`) }),
  );
  const slugTaken = command.code === 'CITY_SLUG_CONFLICT';
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('createTitle')}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <div className="flex items-center gap-row-gap">
          <Button
            variant="ghost"
            className="min-w-0 flex-1"
            disabled={command.busy}
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="create-city"
            className="min-w-0 flex-1"
            loading={command.busy}
          >
            {t('create')}
          </Button>
        </div>
      }
    >
      <form
        id="create-city"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        <Input
          label={t('nameEn')}
          required
          maxLength={60}
          lang="en"
          value={draft.nameEn}
          error={
            slugTaken
              ? t('slugTaken')
              : invalid.has('nameEn')
                ? t('nameInvalid')
                : undefined
          }
          onChange={(event) => set({ nameEn: event.target.value })}
        />
        <Input
          label={t('nameHi')}
          required
          maxLength={60}
          lang="hi"
          value={draft.nameHi}
          error={invalid.has('nameHi') ? t('nameInvalid') : undefined}
          onChange={(event) => set({ nameHi: event.target.value })}
        />
        <Select
          label={t('state')}
          hint={t('stateHint')}
          required
          value={draft.stateCode}
          options={[{ value: '', label: t('statePlaceholder') }, ...states]}
          error={invalid.has('stateCode') ? t('stateRequired') : undefined}
          onChange={(event) =>
            set({ stateCode: event.target.value as GstStateCode | '' })
          }
        />
        <Select
          label={t('statusLabel')}
          hint={t('statusHint')}
          value={draft.status}
          options={statusOptions}
          onChange={(event) =>
            set({ status: event.target.value as CityStatus })
          }
        />
        {command.code && !slugTaken && <AdminFailure code={command.code} />}
      </form>
    </Sheet>
  );
}
