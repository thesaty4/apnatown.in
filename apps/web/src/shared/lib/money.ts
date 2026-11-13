import type { Locale } from '../i18n/preferences';

/** Integer paise → localized INR with Indian digit grouping (₹1,00,000).
 * Display only; amounts are always computed and sent as integer paise.
 * TODO(verify): move to the shared `formatInr` in packages/shared once owned there. */
export function formatInr(paise: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
