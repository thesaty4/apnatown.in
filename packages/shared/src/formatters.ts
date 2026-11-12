/** INR with Indian grouping; input is always integer paise, never rupees. */
export function formatMoney(paise: number, locale: 'en' | 'hi'): string {
  if (!Number.isSafeInteger(paise) || paise < 0)
    throw new RangeError('INVALID_MONEY');
  const language = locale === 'hi' ? 'hi-IN' : 'en-IN';
  const fraction = new Intl.NumberFormat(language, {
    minimumIntegerDigits: 2, useGrouping: false,
  }).format(paise % 100);
  return new Intl.NumberFormat(language, {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).formatToParts(BigInt(paise) / 100n).map((part) =>
    part.type === 'fraction' ? fraction : part.value).join('');
}

/** Strict decimal rupees: no exponent, sign, grouping, whitespace or rounding. */
export function parseRupees(input: string): number | null {
  if (input.length > 20 || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input)) return null;
  const [whole, fraction = ''] = input.split('.');
  const paise = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'));
  return paise <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(paise) : null;
}

/** Stored business hours are IST wall-clock values, not UTC timestamps. */
export function formatLocalBusinessTime(input: string, locale: 'en' | 'hi'): string {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input))
    throw new RangeError('INVALID_BUSINESS_TIME');
  const [hours, minutes] = input.split(':').map(Number);
  const instant = Date.UTC(2000, 0, 1, hours!, minutes!) - 330 * 60_000;
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(instant);
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
