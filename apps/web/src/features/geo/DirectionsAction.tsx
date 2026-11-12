'use client';

import { useTranslations } from 'next-intl';
import { LatitudeSchema, LongitudeSchema } from '@apnatown/shared/geo';
import { buttonClassName } from '@apnatown/ui/primitives/Button';

export type DirectionsDestination = { lat: number; lng: number };

/** Builds a device-maps link from validated numbers only — never from a
 * client-supplied URL. `geo:` (RFC 5870) opens the platform maps app; Apple
 * devices do not register it, so they use the Apple Maps universal link.
 * TODO(verify): no maps/directions provider is approved yet. */
export function directionsHref(
  destination: DirectionsDestination,
  apple: boolean,
) {
  const point = `${destination.lat},${destination.lng}`;
  return apple
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(point)}`
    : `geo:${point}?q=${encodeURIComponent(point)}`;
}

function validDestination(
  destination: Partial<DirectionsDestination> | null | undefined,
): DirectionsDestination | null {
  if (!destination) return null;
  const lat = LatitudeSchema.safeParse(destination.lat);
  const lng = LongitudeSchema.safeParse(destination.lng);
  return lat.success && lng.success && Number.isFinite(lat.data + lng.data)
    ? { lat: lat.data, lng: lng.data }
    : null;
}

const isApple = () =>
  /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * S-CUST-06/07/09 Directions action for public shop/provider/service pages.
 * Renders nothing when the listing has no usable coordinates, so no broken or
 * fabricated destination is ever offered. Opens only on explicit activation.
 */
export function DirectionsAction({
  destination,
  placeName,
  className = '',
}: {
  destination: Partial<DirectionsDestination> | null | undefined;
  /** Localized listing name, used in the accessible label. */
  placeName: string;
  className?: string;
}) {
  const t = useTranslations('geo.directions');
  const point = validDestination(destination);
  if (!point) return null;
  return (
    <a
      className={`${buttonClassName} ${className}`}
      href={directionsHref(point, false)}
      aria-label={t('named', { place: placeName })}
      onClick={(event) => {
        if (!isApple()) return;
        event.preventDefault();
        window.open(directionsHref(point, true), '_blank', 'noopener');
      }}
    >
      <span aria-hidden="true">🧭</span>
      {t('action')}
    </a>
  );
}
