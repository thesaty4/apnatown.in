'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { ExploreMapPin } from '@apnatown/shared/search';
import { formatDistanceKm } from '@apnatown/shared/formatters';
import { MapView, type MapConfiguration } from '@apnatown/ui/geo/MapView';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { DirectionsAction } from '../geo';
import { publicHref } from '../../shared/i18n/preferences';
import type { FilterPatch } from './url-state';

export function ExploreMap({ config, pins, radius, position, locationAvailable, onChange }: {
  config: MapConfiguration;
  pins: ExploreMapPin[];
  radius?: number | undefined;
  position: { lat: number; lng: number } | null;
  locationAvailable: boolean;
  onChange: (patch: FilterPatch) => void;
}) {
  const t = useTranslations('explore.screen');
  const geo = useTranslations('geo.explore');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [selectedId, setSelectedId] = useState<string>();
  const [radiusDraft, setRadiusDraft] = useState(radius ?? 6);
  const selected = pins.find((pin) => pin.id === selectedId);
  const markers = useMemo(() => pins.map((pin) => ({
    id: pin.id, lat: pin.lat, lng: pin.lng,
    label: locale === 'hi' && pin.nameHi ? pin.nameHi : pin.nameEn,
  })), [pins, locale]);
  return (
    <section className="grid gap-3">
      <label className="grid gap-2 font-semibold">
        {geo('radius', { km: radiusDraft })}
        <input type="range" min={1} max={12} step={1} value={radiusDraft} disabled={!locationAvailable}
          onChange={(event) => setRadiusDraft(Number(event.target.value))}
          onPointerUp={() => onChange({ radiusKm: radiusDraft })}
          onKeyUp={() => onChange({ radiusKm: radiusDraft })}
          className="min-h-touch w-full accent-primary" />
      </label>
      {!locationAvailable && <p className="text-small text-muted">{t('locationRequiredMessage')}</p>}
      {pins.length || position ? (
        <MapView config={config} markers={markers} selectedId={selectedId} onSelect={setSelectedId}
          position={position} labels={{ map: geo('map'), loading: t('loading'), failed: geo('mapUnavailable'), retry: t('retry'), privacy: t('mapPrivacy'), zoomIn: t('zoomIn'), zoomOut: t('zoomOut') }} />
      ) : <EmptyState title={geo('noPins')} message={geo('locationOff')} action={null} />}
      {pins.length > 0 && (
        <ul aria-label={geo('pinsLabel')} className="flex flex-wrap gap-2">
          {pins.map((pin) => <li key={pin.id}><Button variant={selectedId === pin.id ? 'primary' : 'outline'}
            aria-pressed={selectedId === pin.id} onClick={() => setSelectedId(pin.id)}>
            {locale === 'hi' && pin.nameHi ? pin.nameHi : pin.nameEn}
          </Button></li>)}
        </ul>
      )}
      {selected && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-3">
        <div><h3 className="text-h3">{locale === 'hi' && selected.nameHi ? selected.nameHi : selected.nameEn}</h3>
          {selected.distanceKm !== null && <p>{formatDistanceKm(selected.distanceKm, locale)}</p>}
          {selected.delivers !== null && <p>{geo(selected.delivers ? 'delivers' : 'noDelivery')}</p>}
        </div>
        <Link className={buttonClassName} href={publicHref(selected.path, locale)}>{t('view')}</Link>
        <DirectionsAction destination={selected} placeName={locale === 'hi' && selected.nameHi ? selected.nameHi : selected.nameEn} />
      </div>}
    </section>
  );
}
