import type { NotificationCategory } from '@apnatown/shared/notifications';
import type { NavIconName } from '../../shared/ui/NavIcon';

const origin = 'https://apnatown.invalid';

/** Internal destination only: a single leading `/`, never `//`, a scheme,
 * a backslash or control characters. Anything else is not navigable. */
export function safeNotificationLink(link: string | null): string | undefined {
  if (
    !link ||
    link.length > 300 ||
    !link.startsWith('/') ||
    link.startsWith('//') ||
    /[\\\p{Cc}]/u.test(link)
  )
    return undefined;
  try {
    const url = new URL(link, origin);
    if (url.origin !== origin || url.pathname.includes('..')) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

/** Prototype `notifIcon` (js3) mapped to the shared category enum. */
export const categoryIcon: Record<NotificationCategory, NavIconName> = {
  order: 'box',
  offer: 'tag',
  review: 'star',
  approval: 'shield',
  enquiry: 'chat',
  job: 'bike',
  admin: 'info',
  system: 'bell',
  follow: 'heart',
};

/** Badge text: exact up to 99, then "99+". */
export function badgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}
