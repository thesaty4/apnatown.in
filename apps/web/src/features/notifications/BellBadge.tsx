'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { accountScope } from '../../shared/api/query-keys';
import { iconButton } from '../../shared/auth/AccountNavigation';
import { useSession } from '../../shared/auth/SessionProvider';
import { NavIcon } from '../../shared/ui/NavIcon';
import { badgeCount } from './links';
import { useUnreadCount, type FeedContext } from './queries';
import type { NotificationRole } from './keys';

/** Ready-session feed context for `role`, or `undefined` for guests,
 * loading/expired sessions or a session without that role. */
export function useFeedContext(
  role: NotificationRole | undefined,
): FeedContext | undefined {
  const { state, epoch, api, lifecycle } = useSession();
  if (state.kind !== 'ready' || !role) return undefined;
  return { api, lifecycle, role, scope: accountScope(state.data, epoch) };
}

/**
 * Prototype header bell (`.iconbtn` + `.dot`). The visible badge caps at
 * "99+"; the accessible name carries the count, and a polite live region
 * announces changes without moving focus. Not rendered for guests.
 */
export function BellBadge({
  context,
  href,
  onOpen,
  expanded,
}: {
  context: FeedContext;
  /** Link to the role's notifications page… */
  href?: string;
  /** …or open an in-place sheet (admin/rider). */
  onOpen?: () => void;
  expanded?: boolean;
}) {
  const t = useTranslations('notifications.bell');
  const unread = useUnreadCount(context);
  const count = unread.data?.count ?? 0;
  const shown = badgeCount(count);
  const label = count > 0 ? t('labelUnread', { count: shown }) : t('label');
  const inner = (
    <>
      <NavIcon name="bell" filled={count > 0} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute end-0.5 top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-pill bg-primary px-1 text-caption-min font-semibold leading-none text-on-primary"
        >
          {shown}
        </span>
      )}
    </>
  );
  return (
    <>
      {href ? (
        <Link
          className={iconButton}
          href={href}
          aria-label={label}
          title={label}
        >
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          className={iconButton}
          aria-label={label}
          title={label}
          aria-haspopup="dialog"
          aria-expanded={expanded ?? false}
          onClick={onOpen}
        >
          {inner}
        </button>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {count > 0 ? t('labelUnread', { count: shown }) : ''}
      </span>
    </>
  );
}
