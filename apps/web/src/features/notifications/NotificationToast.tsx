'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { NotificationRole } from './keys';
import { ToastRegion, type ToastMessage } from '@apnatown/ui/feedback/Toast';
import { useSession } from '../../shared/auth/SessionProvider';
import { playOrderChime } from '../../shared/audio/alert-chime';
import { useRealtimeEvents } from '../../shared/realtime/RealtimeProvider';
import { listNotifications } from './api';

const VISIBLE_MS = 8_000;
/** Only notices created this recently are announced (stale feed guard). */
const FRESH_MS = 2 * 60_000;
const AREAS: readonly [string, NotificationRole][] = [
  ['/vendor', 'vendor'],
  ['/provider', 'provider'],
  ['/super-admin', 'super_admin'],
  ['/admin', 'admin'],
  ['/rider', 'rider'],
];

function areaRole(path: string, roles: readonly string[]): NotificationRole {
  const match = AREAS.find(([prefix]) => path.startsWith(prefix));
  if (match && roles.includes(match[1])) return match[1];
  return 'customer';
}

/**
 * Real-time pop-up for a new in-app notification (order placed, accepted,
 * every status step). The stream only says "something arrived"; the newest
 * unread item for the current area's role is read from the authorized feed.
 */
export function NotificationToast() {
  const t = useTranslations('notifications.live');
  const { api, state } = useSession();
  const path = usePathname();
  const roles = state.kind === 'ready' ? state.data.roles : [];
  const role = areaRole(path, roles);
  const [toast, setToast] = useState<ToastMessage & { link: string | null }>();
  const shown = useRef(new Set<string>());

  useRealtimeEvents((event) => {
    if (event.event !== 'notification' || !roles.includes(role)) return;
    void listNotifications(api, role)
      .then((page) => {
        const item = page.items.find(
          (entry) =>
            !entry.read &&
            !shown.current.has(entry.id) &&
            Date.now() - Date.parse(entry.createdAt) < FRESH_MS,
        );
        if (!item) return;
        shown.current.add(item.id);
        // Owners hear one "tudun" for order activity; riders use the
        // repeating offer alert instead.
        if (
          item.category === 'order' &&
          (role === 'vendor' || role === 'provider')
        )
          playOrderChime();
        setToast({
          id: Date.now(),
          tone: 'info',
          message: item.title ? `${item.title} — ${item.body}` : item.body,
          link: item.link,
        });
      })
      .catch(() => {
        // The bell badge still refreshes through query invalidation.
      });
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastRegion
      toast={
        toast && {
          ...toast,
          action: toast.link ? (
            <Link
              href={toast.link}
              className="min-h-touch content-center font-semibold underline"
              onClick={() => setToast(undefined)}
            >
              {t('view')}
            </Link>
          ) : undefined,
        }
      }
      dismissLabel={t('dismiss')}
      onDismiss={() => setToast(undefined)}
    />
  );
}
