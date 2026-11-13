'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Button } from '@apnatown/ui/primitives/Button';
import { MapView, type MapConfiguration } from '@apnatown/ui/geo/MapView';
import {
  areaOptions,
  cityOptions,
  deviceFailure,
  geoName,
  requestDeviceLocation,
} from '../../geo';
import { useSession } from '../../../shared/auth/SessionProvider';
import { useFieldError, type SectionProps } from './shared';

function useAll<T>(pages: { items: T[] }[] | undefined) {
  return pages?.flatMap((page) => page.items) ?? [];
}

/** City → area (server derives the city from the area), address, optional pin. */
export function LocationFields({
  form,
  set,
  errors,
  disabled,
  mapConfig,
  pinLabel,
}: SectionProps & { mapConfig: MapConfiguration; pinLabel: string }) {
  const t = useTranslations('business.fields');
  const tm = useTranslations('business.location');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const error = useFieldError(errors);
  const { api } = useSession();
  const cities = useInfiniteQuery(cityOptions(api));
  const areas = useInfiniteQuery({
    ...areaOptions(api, form.cityId),
    enabled: Boolean(form.cityId),
  });
  const cityItems = useAll(cities.data?.pages);
  const areaItems = useAll(areas.data?.pages);
  const [locating, setLocating] = useState(false);
  const [pinError, setPinError] = useState<string>();
  async function locate() {
    setLocating(true);
    setPinError(undefined);
    try {
      set({ location: await requestDeviceLocation() });
    } catch (failure) {
      setPinError(tm(`device.${deviceFailure(failure)}`));
    } finally {
      setLocating(false);
    }
  }
  const failed = cities.isError || areas.isError;
  return (
    <>
      <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
        <Select
          label={t('city')}
          required
          value={form.cityId}
          disabled={disabled || cities.isPending}
          hint={cities.isPending ? t('loadingOptions') : undefined}
          onChange={(event) => set({ cityId: event.target.value, areaId: '' })}
          options={[
            { value: '', label: t('chooseCity') },
            ...cityItems.map((city) => ({
              value: city.id,
              label: geoName(city, locale),
              disabled: city.status !== 'enabled' && city.id !== form.cityId,
            })),
          ]}
        />
        <Select
          label={t('area')}
          required
          value={form.areaId}
          disabled={disabled || !form.cityId || areas.isPending}
          hint={form.cityId ? undefined : t('cityFirst')}
          error={error('areaId')}
          onChange={(event) => set({ areaId: event.target.value })}
          options={[
            { value: '', label: t('chooseArea') },
            ...areaItems.map((area) => ({
              value: area.id,
              label:
                geoName(area, locale) +
                (area.pinCode ? ` · ${area.pinCode}` : ''),
            })),
          ]}
        />
      </div>
      {(cities.hasNextPage || areas.hasNextPage) && (
        <Button
          size="small"
          variant="outline"
          className="justify-self-start"
          disabled={cities.isFetchingNextPage || areas.isFetchingNextPage}
          onClick={() =>
            void (cities.hasNextPage
              ? cities.fetchNextPage()
              : areas.fetchNextPage())
          }
        >
          {t('moreOptions')}
        </Button>
      )}
      {failed && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 text-small text-error"
        >
          <span>{t('locationsFailed')}</span>
          <Button
            size="small"
            variant="outline"
            onClick={() => {
              if (cities.isError) void cities.refetch();
              if (areas.isError) void areas.refetch();
            }}
          >
            {t('retry')}
          </Button>
        </div>
      )}
      <TextArea
        label={t('address')}
        required
        maxLength={300}
        autoComplete="street-address"
        value={form.addressText}
        disabled={disabled}
        error={error('addressText')}
        onChange={(event) => set({ addressText: event.target.value })}
      />
      <div className="grid min-w-0 gap-2">
        <p className="m-0 text-field-label font-semibold">
          {tm('pin')}{' '}
          <span className="font-normal text-muted">({t('optional')})</span>
        </p>
        <p className="m-0 text-small text-muted">{tm('pinHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            variant="outline"
            disabled={disabled || locating}
            loading={locating}
            onClick={() => void locate()}
          >
            <span aria-hidden="true">📍</span>{' '}
            {tm(form.location ? 'updatePin' : 'usePin')}
          </Button>
          {form.location && (
            <Button
              size="small"
              variant="text"
              disabled={disabled}
              onClick={() => set({ location: null })}
            >
              {tm('clearPin')}
            </Button>
          )}
        </div>
        {pinError && (
          <p role="alert" className="m-0 text-small text-error">
            {pinError}
          </p>
        )}
        {form.location ? (
          <div className="h-56 min-w-0 overflow-hidden rounded-md border border-border">
            <MapView
              config={mapConfig}
              markers={[{ id: 'business', ...form.location, label: pinLabel }]}
              selectedId="business"
              onSelect={() => undefined}
              labels={{
                map: tm('map.label'),
                loading: tm('map.loading'),
                failed: tm('map.failed'),
                retry: t('retry'),
                privacy: tm('map.privacy'),
                zoomIn: tm('map.zoomIn'),
                zoomOut: tm('map.zoomOut'),
              }}
            />
          </div>
        ) : (
          <p className="m-0 rounded-md bg-surface-2 p-3 text-small text-text-2">
            {tm('noPin')}
          </p>
        )}
      </div>
    </>
  );
}
