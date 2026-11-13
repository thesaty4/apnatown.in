'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MapView, type MapConfiguration } from '@apnatown/ui/geo/MapView';

/** Single stored business pin on the shared Leaflet/OSM map (client-only). */
export function ProfileMap({
  config,
  location,
  name,
}: {
  config: MapConfiguration;
  location: { lat: number; lng: number };
  name: string;
}) {
  const t = useTranslations('business.publicProfile.contact');
  const screen = useTranslations('explore.screen');
  const markers = useMemo(
    () => [{ id: 'business', lat: location.lat, lng: location.lng, label: name }],
    [location.lat, location.lng, name],
  );
  return (
    <MapView
      config={config}
      markers={markers}
      selectedId="business"
      onSelect={() => {}}
      position={null}
      labels={{
        map: t('map', { name }),
        loading: screen('loading'),
        failed: t('mapFailed'),
        retry: screen('retry'),
        privacy: screen('mapPrivacy'),
        zoomIn: screen('zoomIn'),
        zoomOut: screen('zoomOut'),
      }}
    />
  );
}
