export function formatDistanceKm(
  distanceKm: number,
  locale: 'en' | 'hi',
): string {
  if (!Number.isFinite(distanceKm) || distanceKm < 0)
    throw new RangeError('INVALID_DISTANCE');
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(distanceKm);
}
