'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { AreaRef } from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Select } from '@apnatown/ui/primitives/Select';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Alert, useAdmin } from '../../admin';
import { areaOptions, cityOptions, geoName } from '../../geo/api';

/** Exact area grants only: choosing a city is navigation, never a whole-city grant. */
export function AreaPicker({
  value,
  onChange,
  disabled = false,
  error,
}: {
  value: readonly AreaRef[];
  onChange: (next: AreaRef[]) => void;
  disabled?: boolean;
  error?: string | undefined;
}) {
  const { api } = useAdmin();
  const t = useTranslations('superAdmin.areas');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [cityId, setCityId] = useState(value[0]?.cityId ?? '');
  const cities = useInfiniteQuery(cityOptions(api));
  const areas = useInfiniteQuery({
    ...areaOptions(api, cityId),
    enabled: cityId !== '',
  });
  const cityItems = cities.data?.pages.flatMap((page) => page.items) ?? [];
  const areaItems = areas.data?.pages.flatMap((page) => page.items) ?? [];
  const selected = new Set(value.map((area) => area.id));
  const toggle = (area: AreaRef, checked: boolean) =>
    onChange(
      checked ? [...value, area] : value.filter((item) => item.id !== area.id),
    );
  return (
    <fieldset className="grid min-w-0 gap-3" disabled={disabled}>
      <legend className="mb-1 text-field-label font-semibold">
        {t('legend')}
      </legend>
      {value.length === 0 ? (
        <p className="text-text-2">{t('noneSelected')}</p>
      ) : (
        <ul
          aria-label={t('selected')}
          className="m-0 flex list-none flex-wrap gap-2 p-0"
        >
          {value.map((area) => (
            <li key={area.id}>
              <Chip
                label={geoName(area, locale)}
                removable
                removeLabel={t('remove', { area: geoName(area, locale) })}
                onRemove={() => toggle(area, false)}
              />
            </li>
          ))}
        </ul>
      )}
      {error && <Alert message={error} />}
      <Select
        label={t('city')}
        value={cityId}
        disabled={disabled || cities.isPending}
        hint={t('cityHint')}
        options={[
          { value: '', label: t('cityPlaceholder') },
          ...cityItems.map((city) => ({
            value: city.id,
            label: geoName(city, locale),
          })),
        ]}
        onChange={(event) => setCityId(event.target.value)}
      />
      {cities.hasNextPage && (
        <Button
          type="button"
          variant="text"
          loading={cities.isFetchingNextPage}
          onClick={() => void cities.fetchNextPage()}
        >
          {t('moreCities')}
        </Button>
      )}
      {cities.isError && (
        <Alert
          message={t('failed')}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void cities.refetch()}
            >
              {t('retry')}
            </Button>
          }
        />
      )}
      {cityId !== '' &&
        (areas.isPending ? (
          <Skeleton label={t('loading')} />
        ) : areas.isError ? (
          <Alert
            message={t('failed')}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => void areas.refetch()}
              >
                {t('retry')}
              </Button>
            }
          />
        ) : areaItems.length === 0 ? (
          <p className="text-text-2">{t('noAreas')}</p>
        ) : (
          <div className="grid gap-1">
            {areaItems.map((area) => (
              <Checkbox
                key={area.id}
                label={geoName(area, locale)}
                checked={selected.has(area.id)}
                onChange={(event) =>
                  toggle(
                    {
                      id: area.id,
                      cityId: area.cityId,
                      nameEn: area.nameEn,
                      nameHi: area.nameHi,
                    },
                    event.target.checked,
                  )
                }
              />
            ))}
            {areas.hasNextPage && (
              <Button
                type="button"
                variant="text"
                loading={areas.isFetchingNextPage}
                onClick={() => void areas.fetchNextPage()}
              >
                {t('moreAreas')}
              </Button>
            )}
          </div>
        ))}
    </fieldset>
  );
}
