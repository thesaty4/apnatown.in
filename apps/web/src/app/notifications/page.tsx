import type { Metadata } from 'next';
import { NotificationsScreen } from '../../features/notifications/NotificationsScreen';
import { readNotificationFeed } from '../../features/notifications/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** S-CUST-22 customer notifications (private, session-gated). */
export default async function NotificationsPage() {
  return (
    <NotificationsScreen
      role="customer"
      requireRole
      preferencesHref="/account/preferences"
      {...await readNotificationFeed('customer', { requireRole: true })}
    />
  );
}
