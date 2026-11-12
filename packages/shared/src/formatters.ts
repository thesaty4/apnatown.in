/** INR with Indian grouping; input is always integer paise, never rupees. */
export function formatMoney(paise: number, locale: 'en' | 'hi'): string {
  if (!Number.isSafeInteger(paise) || paise < 0)
    throw new RangeError('INVALID_MONEY');
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

/** Strict decimal rupees: no exponent, sign, grouping, whitespace or rounding. */
export function parseRupees(input: string): number | null {
  if (input.length > 20 || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input)) return null;
  const [whole, fraction = ''] = input.split('.');
  const paise = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'));
  return paise <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(paise) : null;
}

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
