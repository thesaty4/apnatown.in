'use client';

import { useId, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { Select } from '@apnatown/ui/primitives/Select';
import { useSession } from '../../shared/auth/SessionProvider';
import { areaOptions, cityOptions, geoName } from '../geo/api';
import { InlineAlert } from './address-parts';

export type Draft = {
  label: string;
  addressText: string;
  landmark: string;
  pinCode: string;
  cityId: string;
  areaId: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};
type FieldProps = {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  busy: boolean;
};

const known = (items: readonly { id: string }[], id: string) =>
  !id || items.some((item) => item.id === id);

/** City is required, area optional; both come from the public Geo reference reads. */
export function GeoFields({
  draft,
  update,
  busy,
  cityError,
  areaError,
}: FieldProps & {
  cityError?: string | undefined;
  areaError?: string | undefined;
}) {
  const { api } = useSession();
  const t = useTranslations('account.addresses');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const cities = useInfiniteQuery(cityOptions(api));
  const areas = useInfiniteQuery({
    ...areaOptions(api, draft.cityId),
    enabled: draft.cityId !== '',
  });
  const cityItems = cities.data?.pages.flatMap((page) => page.items) ?? [];
  const areaItems = areas.data?.pages.flatMap((page) => page.items) ?? [];
  const more = (query: typeof cities | typeof areas, label: string) =>
    query.hasNextPage && (
      <Button
        type="button"
        variant="text"
        loading={query.isFetchingNextPage}
        disabled={busy}
        onClick={() => void query.fetchNextPage()}
      >
        {label}
      </Button>
    );
  const failed = (query: typeof cities | typeof areas) =>
    query.isError && (
      <InlineAlert
        message={t('form.geoFailed')}
        action={
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );
  return (
    <>
      <div className="grid gap-2">
        <Select
          label={t('form.city')}
          required
          value={draft.cityId}
          disabled={busy || cities.isPending}
          hint={cities.isPending ? t('form.cityLoading') : undefined}
          error={cityError}
          options={[
            { value: '', label: t('form.cityPlaceholder') },
            ...cityItems.map((city) => ({
              value: city.id,
              label: geoName(city, locale),
            })),
            ...(known(cityItems, draft.cityId)
              ? []
              : [{ value: draft.cityId, label: t('form.cityCurrent') }]),
          ]}
          onChange={(event) =>
            update({ cityId: event.target.value, areaId: '' })
          }
        />
        {more(cities, t('form.moreCities'))}
        {failed(cities)}
      </div>
      <div className="grid gap-2">
        <Select
          label={t('form.area')}
          value={draft.areaId}
          disabled={busy || !draft.cityId || areas.isPending}
          hint={
            !draft.cityId
              ? t('form.areaNeedsCity')
              : areas.isPending
                ? t('form.areaLoading')
                : undefined
          }
          error={areaError}
          options={[
            { value: '', label: t('form.areaNone') },
            ...areaItems.map((area) => ({
              value: area.id,
              label: geoName(area, locale),
            })),
            ...(known(areaItems, draft.areaId)
              ? []
              : [{ value: draft.areaId, label: t('form.areaCurrent') }]),
          ]}
          onChange={(event) => {
            const area = areaItems.find(({ id }) => id === event.target.value);
            update({
              areaId: event.target.value,
              // Convenience only: never overwrite a PIN the user already typed.
              ...(area?.pinCode && !draft.pinCode && { pinCode: area.pinCode }),
            });
          }}
        />
        {draft.cityId && more(areas, t('form.moreAreas'))}
        {draft.cityId && failed(areas)}
      </div>
    </>
  );
}

type Locating = 'idle' | 'locating' | 'denied' | 'unavailable' | 'unsupported';
const status: Record<Exclude<Locating, 'idle'>, string> = {
  locating: 'locating',
  denied: 'locationDenied',
  unavailable: 'locationUnavailable',
  unsupported: 'locationUnsupported',
};
const round = (value: number) => Math.round(value * 1e6) / 1e6;

/** No map provider is configured: the keyboard/form alternative is an explicit
 * device-location request (only on click) that can be cleared. Coordinates are
 * always set or cleared as a pair and are not displayed. */
export function LocationField({
  draft,
  update,
  busy,
  error,
}: FieldProps & { error?: string | undefined }) {
  const t = useTranslations('account.addresses.form');
  const id = useId();
  const [locating, setLocating] = useState<Locating>('idle');
  const pinned = draft.lat !== null && draft.lng !== null;
  function locate() {
    if (!('geolocation' in navigator)) return setLocating('unsupported');
    setLocating('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update({ lat: round(coords.latitude), lng: round(coords.longitude) });
        setLocating('idle');
      },
      (failure) =>
        setLocating(
          failure.code === failure.PERMISSION_DENIED ? 'denied' : 'unavailable',
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }
  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-field-label font-semibold [overflow-wrap:anywhere]">
        {t('location')}
      </legend>
      <p
        id={`${id}-hint`}
        className="text-small-min text-muted [overflow-wrap:anywhere]"
      >
        {t('locationHint')}
      </p>
      <p role="status" className="font-semibold [overflow-wrap:anywhere]">
        {locating === 'idle'
          ? pinned
            ? `📍 ${t('pinSet')}`
            : t('pinNotSet')
          : t(status[locating])}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          loading={locating === 'locating'}
          disabled={busy}
          aria-describedby={`${id}-hint`}
          onClick={locate}
        >
          {t(pinned ? 'updateLocation' : 'useLocation')}
        </Button>
        {pinned && (
          <Button
            type="button"
            variant="text"
            disabled={busy || locating === 'locating'}
            onClick={() => {
              update({ lat: null, lng: null });
              setLocating('idle');
            }}
          >
            {t('clearPin')}
          </Button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          tabIndex={-1}
          data-invalid=""
          className="text-field-error font-medium text-error [overflow-wrap:anywhere]"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
