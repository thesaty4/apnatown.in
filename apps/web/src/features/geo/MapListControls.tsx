'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { buttonInteractionClassName } from '@apnatown/ui/primitives/Button';
import { GeoNote } from './parts';

export const EXPLORE_RADIUS = { min: 1, max: 12, default: 6 } as const;
export type ExploreView = 'list' | 'map';
export type MapListState = { view: ExploreView; radiusKm: number };

/** Validated `view`/`radius` URL params; defaults are omitted from the URL.
 * TODO(verify): Search owns the final Explore URL schema (F-EX-008). */
export function parseMapListState(params: URLSearchParams): MapListState {
  const radius = Number(params.get('radius'));
  return {
    view: params.get('view') === 'map' ? 'map' : 'list',
    radiusKm:
      Number.isInteger(radius) &&
      radius >= EXPLORE_RADIUS.min &&
      radius <= EXPLORE_RADIUS.max
        ? radius
        : EXPLORE_RADIUS.default,
  };
}

/** Changes only `view`/`radius`, preserving every other (tab) param. A view
 * switch is a history entry (Back restores it, scroll is left to Search);
 * radius tweaks replace the current entry. */
export function useMapListUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = parseMapListState(new URLSearchParams(params.toString()));
  const write = useCallback(
    (patch: Partial<MapListState>, mode: 'push' | 'replace') => {
      const next = new URLSearchParams(params.toString());
      const merged = { ...parseMapListState(next), ...patch };
      if (merged.view === 'map') next.set('view', 'map');
      else next.delete('view');
      if (merged.radiusKm === EXPLORE_RADIUS.default) next.delete('radius');
      else next.set('radius', String(merged.radiusKm));
      const query = next.toString();
      router[mode](query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );
  return {
    ...state,
    setView: (view: ExploreView) => write({ view }, 'push'),
    setRadius: (radiusKm: number) => write({ radiusKm }, 'replace'),
  };
}

export type MapPin = {
  id: string;
  /** Already localized listing name. */
  name: string;
  /** Server-derived; null when location is unavailable. */
  distanceKm: number | null;
  /** Server-derived deliverability to the selected address; null = unknown. */
  delivers: boolean | null;
};

/**
 * S-CUST-02 map/list controls. Leaflet/OSM is selected, but the shared MapView
 * is not wired yet; map mode retains this keyboard-selectable list fallback.
 * Distance and "delivers to your address" stay separate, and "you are here"
 * appears only when a real location is available — never fabricated.
 */
export function MapListControls({
  view,
  onViewChange,
  radiusKm,
  onRadiusChange,
  locationAvailable,
  pins,
  selectedId,
  onSelect,
}: {
  view: ExploreView;
  onViewChange: (view: ExploreView) => void;
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  locationAvailable: boolean;
  pins: readonly MapPin[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations('geo.explore');
  const format = useFormatter();
  const id = useId();
  const [draft, setDraft] = useState(radiusKm);
  useEffect(() => setDraft(radiusKm), [radiusKm]);
  useEffect(() => {
    if (draft === radiusKm) return;
    const timer = setTimeout(() => onRadiusChange(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, radiusKm, onRadiusChange]);
  const km = (value: number) =>
    format.number(value, { maximumFractionDigits: 1 });
  const option = (value: ExploreView, icon: string) => (
    <button
      type="button"
      aria-pressed={view === value}
      className={`inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-md px-3 py-1 font-semibold ${buttonInteractionClassName} ${view === value ? 'bg-primary text-on-primary' : 'bg-surface text-text'}`}
      onClick={() => view !== value && onViewChange(value)}
    >
      <span aria-hidden="true">{icon}</span>
      {t(value)}
    </button>
  );

  return (
    <div className="grid gap-3">
      <div
        role="group"
        aria-label={t('viewLabel')}
        className="flex gap-1 rounded-md border border-border bg-surface-2 p-1"
      >
        {option('list', '☰')}
        {option('map', '🗺️')}
      </div>
      {view === 'map' && (
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label
              htmlFor={`${id}-radius`}
              className="text-field-label font-semibold"
            >
              {t('radius', { km: km(draft) })}
            </label>
            <input
              id={`${id}-radius`}
              type="range"
              min={EXPLORE_RADIUS.min}
              max={EXPLORE_RADIUS.max}
              step={1}
              value={draft}
              aria-valuetext={t('radius', { km: km(draft) })}
              className="min-h-touch w-full accent-primary"
              onChange={(event) => setDraft(Number(event.target.value))}
            />
          </div>
          <GeoNote tone="info" message={t('mapUnavailable')} />
          {!locationAvailable && (
            <GeoNote tone="info" message={t('locationOff')} />
          )}
          {pins.length === 0 ? (
            <GeoNote tone="info" message={t('noPins')} />
          ) : (
            <ul
              aria-label={t('pinsLabel')}
              className="m-0 grid list-none gap-2 p-0"
            >
              {locationAvailable && (
                <li className="flex items-center gap-2 px-3 text-small font-semibold">
                  <span aria-hidden="true">🔵</span>
                  {t('youAreHere')}
                </li>
              )}
              {pins.map((pin) => (
                <li key={pin.id}>
                  <button
                    type="button"
                    aria-pressed={pin.id === selectedId}
                    className={`grid min-h-touch w-full gap-1 rounded-md border px-3 py-2 text-start ${buttonInteractionClassName} ${pin.id === selectedId ? 'border-primary bg-primary-soft' : 'border-border bg-surface'}`}
                    onClick={() => onSelect(pin.id)}
                  >
                    <span className="flex gap-2 font-semibold [overflow-wrap:anywhere]">
                      <span aria-hidden="true">📍</span>
                      {pin.name}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-small text-text-2">
                      {pin.distanceKm !== null && (
                        <span>{t('distance', { km: km(pin.distanceKm) })}</span>
                      )}
                      {pin.delivers !== null && (
                        <Badge
                          tone={pin.delivers ? 'ok' : 'neutral'}
                          icon={pin.delivers ? '✓' : '✕'}
                          label={t(pin.delivers ? 'delivers' : 'noDelivery')}
                        />
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
