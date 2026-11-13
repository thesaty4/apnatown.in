import { formatLocalBusinessTime } from '@apnatown/shared/formatters';
import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';
import type { Locale } from '../../../shared/i18n/preferences';

type Day = BusinessDiscoveryDetail['hours'][number];
type Profile = BusinessDiscoveryDetail['profile'];

/** API stores IST `HH:MM`; anything else is shown as unavailable, never guessed. */
export function businessTime(value: string | null, locale: Locale) {
  if (!value) return null;
  try {
    return formatLocalBusinessTime(value, locale);
  } catch {
    return null;
  }
}

/** Current Asia/Kolkata wall-clock `HH:MM` (IST has no DST). */
function istNow(now: Date) {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;
}

export type OpenStatus =
  | { kind: 'temporarilyClosed' }
  | { kind: 'closedToday' }
  | { kind: 'open'; closes: string | null }
  | { kind: 'opensAt'; opens: string }
  | { kind: 'closedNow'; range: { opens: string; closes: string } | null }
  | { kind: 'unknown' };

/**
 * Header status from server-evaluated `openNow` + today's IST schedule. The
 * opening time is only offered while it is still ahead today.
 */
export function openStatus(
  openNow: boolean | null,
  profile: Profile,
  locale: Locale,
  now: Date = new Date(),
): OpenStatus {
  if (profile.temporarilyClosed) return { kind: 'temporarilyClosed' };
  const today = profile.today;
  if (today?.isClosed) return { kind: 'closedToday' };
  const opens = businessTime(today?.opensAt ?? null, locale);
  const closes = businessTime(today?.closesAt ?? null, locale);
  if (openNow === true) return { kind: 'open', closes };
  if (openNow === false) {
    if (opens && today?.opensAt && today.opensAt > istNow(now))
      return { kind: 'opensAt', opens };
    return {
      kind: 'closedNow',
      range: opens && closes ? { opens, closes } : null,
    };
  }
  return { kind: 'unknown' };
}

/** Monday-first week like the prototype hours table; Sunday (0) last. */
export function orderedWeek(hours: readonly Day[]) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order
    .map((dayOfWeek) => hours.find((day) => day.dayOfWeek === dayOfWeek))
    .filter((day): day is Day => day !== undefined);
}
