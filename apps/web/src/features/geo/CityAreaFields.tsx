'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { Select } from '@apnatown/ui/primitives/Select';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { areaOptions, cityOptions, geoName } from './api';

/** Caller-localized copy, so each feature keeps its own namespace. */
export type CityAreaLabels = {
  city: string;
  chooseCity: string;
  area: string;
  chooseArea: string;
  cityFirst: string;
  loadingOptions: string;
  moreOptions: string;
  failed: string;
  retry: string;
};

function useAll<T>(pages: { items: T[] }[] | undefined) {
  return pages?.flatMap((page) => page.items) ?? [];
}

/**
 * Validated Geo city → area selection (server derives the city from the area).
 * Disabled cities stay selectable only when already chosen.
 */
export function CityAreaFields({
  cityId,
  areaId,
  onChange,
  labels,
  disabled,
  required = true,
  cityError,
  areaError,
  idPrefix,
}: {
  cityId: string;
  areaId: string;
  onChange: (patch: { cityId?: string; areaId: string }) => void;
  labels: CityAreaLabels;
  disabled?: boolean | undefined;
  required?: boolean;
  cityError?: string | undefined;
  areaError?: string | undefined;
  /** Optional stable ids (`${idPrefix}-city`, `${idPrefix}-area`) for focus. */
  idPrefix?: string;
}) {
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const cities = useInfiniteQuery(cityOptions(api));
  const areas = useInfiniteQuery({
    ...areaOptions(api, cityId),
    enabled: Boolean(cityId),
  });
  const cityItems = useAll(cities.data?.pages);
  const areaItems = useAll(areas.data?.pages);
  const failed = cities.isError || areas.isError;
  return (
    <>
      <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
        <Select
          id={idPrefix && `${idPrefix}-city`}
          label={labels.city}
          required={required}
          value={cityId}
          disabled={disabled || cities.isPending}
          hint={cities.isPending ? labels.loadingOptions : undefined}
          error={cityError}
          onChange={(event) =>
            onChange({ cityId: event.target.value, areaId: '' })
          }
          options={[
            { value: '', label: labels.chooseCity },
            ...cityItems.map((city) => ({
              value: city.id,
              label: geoName(city, locale),
              disabled: city.status !== 'enabled' && city.id !== cityId,
            })),
          ]}
        />
        <Select
          id={idPrefix && `${idPrefix}-area`}
          label={labels.area}
          required={required}
          value={areaId}
          disabled={disabled || !cityId || areas.isPending}
          hint={cityId ? undefined : labels.cityFirst}
          error={areaError}
          onChange={(event) => onChange({ areaId: event.target.value })}
          options={[
            { value: '', label: labels.chooseArea },
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
          {labels.moreOptions}
        </Button>
      )}
      {failed && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 text-small text-error"
        >
          <span>{labels.failed}</span>
          <Button
            size="small"
            variant="outline"
            onClick={() => {
              if (cities.isError) void cities.refetch();
              if (areas.isError) void areas.refetch();
            }}
          >
            {labels.retry}
          </Button>
        </div>
      )}
    </>
  );
}
