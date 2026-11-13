'use client';

import { useState, type FormEvent } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  PinCodeSchema,
  type City,
  type LocationResolution,
} from '@apnatown/shared/geo';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Input } from '@apnatown/ui/primitives/Input';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { useSession } from '../../shared/auth/SessionProvider';
import { failureCode } from '../../shared/api/result';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useOnline } from '../../shared/hooks/use-online';
import {
  areaOptions,
  cityOptions,
  geoName,
  resolveLocation,
  type LocationResolveBody,
} from './api';
import {
  deviceFailure,
  requestDeviceLocation,
  type DeviceLocationFailure,
  type DevicePosition,
} from './device-location';
import {
  clearBrowseLocation,
  setBrowseLocation,
  useBrowseLocation,
} from './location-store';
import {
  GeoNote,
  cityStatusIcon,
  cityStatusKey,
  cityStatusTone,
} from './parts';
import { WaitlistForm } from './WaitlistForm';

export type PickerStep =
  { kind: 'choose' } | { kind: 'waitlist'; city: City | null };

type Outcome =
  | { kind: 'resolved'; data: LocationResolution }
  | { kind: 'unresolved' };
type Request = { body: LocationResolveBody; position?: DevicePosition };

const resolveErrors: Record<string, string> = {
  PIN_CODE_INVALID: 'pinInvalid',
  LOCATION_INVALID: 'gpsUnavailable',
  AREA_NOT_FOUND: 'areaGone',
  CITY_NOT_FOUND: 'areaGone',
  COMMON_RATE_LIMITED: 'rateLimited',
  RATE_LIMITED: 'rateLimited',
  CSRF_INVALID: 'sessionInvalid',
  COMMON_FORBIDDEN: 'sessionInvalid',
  FORBIDDEN: 'sessionInvalid',
};

/**
 * S-CUST-01 location picker. Location is always optional: the sheet can be
 * dismissed at any time, and manual area/PIN choices stay available when the
 * device location is denied or unavailable. GPS is requested only on tap.
 */
export function LocationPicker({
  open,
  step,
  onStep,
  onClose,
  onResolved,
}: {
  open: boolean;
  step: PickerStep;
  onStep: (step: PickerStep) => void;
  onClose: () => void;
  onResolved: (selection: LocationResolution) => void;
}) {
  const t = useTranslations('geo.location');
  const { api, lifecycle } = useSession();
  const online = useOnline();
  const current = useBrowseLocation().selection;
  const [locating, setLocating] = useState<
    'idle' | 'locating' | DeviceLocationFailure
  >('idle');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string>();
  const [last, setLast] = useState<Request>();
  const resolve = usePrivateMutation(
    lifecycle,
    async (input: Request, assertCurrent): Promise<Outcome> => {
      try {
        return {
          kind: 'resolved',
          data: await resolveLocation(api, input.body, assertCurrent),
        };
      } catch (error) {
        if (failureCode(error) === 'LOCATION_UNRESOLVED')
          return { kind: 'unresolved' };
        throw error;
      }
    },
  );
  const code = resolve.isError ? failureCode(resolve.error) : undefined;
  const busy = resolve.isPending || locating === 'locating';

  function run(request: Request) {
    setLast(request.position ? undefined : request);
    setPinError(undefined);
    void resolve.run(request, (outcome) => {
      if (outcome.kind === 'unresolved') {
        onStep({ kind: 'waitlist', city: null });
        return;
      }
      setBrowseLocation(outcome.data, request.position);
      setPin('');
      if (outcome.data.serviceable) onResolved(outcome.data);
      else onStep({ kind: 'waitlist', city: outcome.data.city });
    });
  }

  function locate() {
    resolve.reset();
    setLocating('locating');
    requestDeviceLocation().then(
      (position) => {
        setLocating('idle');
        run({ body: position, position });
      },
      (error: unknown) => setLocating(deviceFailure(error)),
    );
  }

  function submitPin(event: FormEvent) {
    event.preventDefault();
    const value = pin.trim();
    if (!PinCodeSchema.safeParse(value).success) {
      setPinError(t('pinInvalid'));
      return;
    }
    run({ body: { pinCode: value } });
  }

  const close = () => {
    if (resolve.isPending) return;
    onClose();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && close()}
      title={step.kind === 'waitlist' ? t('waitlistTitle') : t('title')}
      closeLabel={t('close')}
      busy={resolve.isPending}
    >
      {step.kind === 'waitlist' ? (
        <WaitlistForm
          city={step.city}
          onBack={() => onStep({ kind: 'choose' })}
          onDone={onClose}
        />
      ) : (
        <div className="grid gap-stack-gap">
          <p className="text-small text-text-2 [overflow-wrap:anywhere]">
            {t('intro')}
          </p>
          {!online && <GeoNote tone="warn" message={t('offline')} />}
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full"
              loading={locating === 'locating'}
              disabled={busy || !online}
              onClick={locate}
            >
              <span aria-hidden="true">📍</span>
              {t('useGps')}
            </Button>
            <p role="status" className="text-small [overflow-wrap:anywhere]">
              {locating === 'locating' && t('locating')}
              {locating === 'denied' && (
                <>
                  <strong>{t('deniedTitle')}</strong> {t('deniedMessage')}
                </>
              )}
              {(locating === 'unavailable' || locating === 'unsupported') &&
                t('gpsUnavailable')}
            </p>
          </div>
          <hr className="border-border" />
          <CityAndAreas
            initialCityId={current?.city.id}
            disabled={busy || !online}
            onArea={(cityId, areaId) => run({ body: { cityId, areaId } })}
            onOtherCity={(city) => onStep({ kind: 'waitlist', city })}
          />
          <form noValidate className="grid gap-2" onSubmit={submitPin}>
            <div className="flex flex-wrap items-end gap-2">
              <Input
                label={t('pinLabel')}
                placeholder={t('pinPlaceholder')}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                wrapperClassName="min-w-0 flex-1 basis-48"
                value={pin}
                disabled={busy}
                error={pinError ?? (code === 'PIN_CODE_INVALID' ? t('pinInvalid') : undefined)}
                onChange={(event) => {
                  setPin(event.target.value.replace(/\D/g, ''));
                  setPinError(undefined);
                }}
              />
              <Button type="submit" disabled={busy || !online}>
                {t('pinGo')}
              </Button>
            </div>
          </form>
          {code && code !== 'PIN_CODE_INVALID' && (
            <GeoNote
              tone="bad"
              message={t(resolveErrors[code] ?? 'resolveFailed')}
              action={
                !resolveErrors[code] ? (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => (last ? run(last) : locate())}
                  >
                    {t('retry')}
                  </Button>
                ) : undefined
              }
            />
          )}
          {resolve.isPending && (
            <p role="status" className="text-small text-text-2">
              {t('resolving')}
            </p>
          )}
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button variant="ghost" disabled={resolve.isPending} onClick={close}>
              {t('skip')}
            </Button>
            {current && (
              <Button
                variant="text"
                disabled={resolve.isPending}
                onClick={() => {
                  clearBrowseLocation();
                  onClose();
                }}
              >
                {t('clear')}
              </Button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** Cities (all pages on demand) and the chosen city's areas. Enabled cities
 * expand to their areas; any other city goes to the waitlist (prototype). */
function CityAndAreas({
  initialCityId,
  disabled,
  onArea,
  onOtherCity,
}: {
  initialCityId: string | undefined;
  disabled: boolean;
  onArea: (cityId: string, areaId: string) => void;
  onOtherCity: (city: City) => void;
}) {
  const t = useTranslations('geo.location');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const cities = useInfiniteQuery(cityOptions(api));
  const cityItems = cities.data?.pages.flatMap((page) => page.items) ?? [];
  const [chosen, setChosen] = useState(initialCityId);
  const enabled = cityItems.filter((city) => city.status === 'enabled');
  const city =
    enabled.find((item) => item.id === chosen) ??
    (chosen ? undefined : enabled[0]);
  const status = (item: City) => t(`status.${cityStatusKey(item.status)}`);

  if (cities.isPending) return <Skeleton label={t('citiesLoading')} />;
  if (cities.isError && cityItems.length === 0)
    return (
      <GeoNote
        tone="bad"
        message={t('citiesFailed')}
        action={
          <Button
            variant="outline"
            disabled={cities.isFetching}
            onClick={() => void cities.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );
  if (cityItems.length === 0)
    return <GeoNote tone="info" message={t('citiesEmpty')} />;
  return (
    <div className="grid gap-stack-gap">
      <fieldset className="grid min-w-0 gap-2">
        <legend className="mb-2 text-field-label font-semibold">
          {t('cities')}
        </legend>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {cityItems.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-1">
              <Chip
                label={geoName(item, locale)}
                selected={item.id === city?.id}
                disabled={disabled}
                onClick={() =>
                  item.status === 'enabled'
                    ? setChosen(item.id)
                    : onOtherCity(item)
                }
              />
              {item.status !== 'enabled' && (
                <Badge
                  tone={cityStatusTone[item.status]}
                  icon={cityStatusIcon[item.status]}
                  label={status(item)}
                />
              )}
            </li>
          ))}
        </ul>
        {cities.hasNextPage && (
          <Button
            variant="text"
            className="justify-self-start"
            loading={cities.isFetchingNextPage}
            onClick={() => void cities.fetchNextPage()}
          >
            {t('moreCities')}
          </Button>
        )}
        {cities.isError && cityItems.length > 0 && (
          <GeoNote
            tone="bad"
            message={t('citiesFailed')}
            action={
              <Button
                variant="outline"
                disabled={cities.isFetching}
                onClick={() => void cities.refetch()}
              >
                {t('retry')}
              </Button>
            }
          />
        )}
      </fieldset>
      {city ? (
        <Areas
          key={city.id}
          city={city}
          disabled={disabled}
          onArea={(areaId) => onArea(city.id, areaId)}
        />
      ) : (
        enabled.length === 0 && (
          <GeoNote tone="info" message={t('noEnabledCity')} />
        )
      )}
    </div>
  );
}

function Areas({
  city,
  disabled,
  onArea,
}: {
  city: City;
  disabled: boolean;
  onArea: (areaId: string) => void;
}) {
  const t = useTranslations('geo.location');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const current = useBrowseLocation().selection;
  const areas = useInfiniteQuery(areaOptions(api, city.id));
  const items = areas.data?.pages.flatMap((page) => page.items) ?? [];
  const cityName = geoName(city, locale);
  let body;
  if (areas.isPending) body = <Skeleton label={t('areasLoading')} />;
  else if (areas.isError && items.length === 0)
    body = (
      <GeoNote
        tone="bad"
        message={t('areasFailed')}
        action={
          <Button
            variant="outline"
            disabled={areas.isFetching}
            onClick={() => void areas.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );
  else if (items.length === 0)
    body = <GeoNote tone="info" message={t('areasEmpty')} />;
  else
    body = (
      <>
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
          {items.map((area) => (
            <li key={area.id} className="min-w-0">
              <Chip
                className="w-full"
                label={geoName(area, locale)}
                selected={current?.area?.id === area.id}
                disabled={disabled}
                onClick={() => onArea(area.id)}
              />
            </li>
          ))}
        </ul>
        {areas.hasNextPage && (
          <Button
            variant="text"
            className="justify-self-start"
            loading={areas.isFetchingNextPage}
            onClick={() => void areas.fetchNextPage()}
          >
            {t('moreAreas')}
          </Button>
        )}
      </>
    );
  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-field-label font-semibold [overflow-wrap:anywhere]">
        {t('areasOf', { city: cityName })}
      </legend>
      {body}
    </fieldset>
  );
}
