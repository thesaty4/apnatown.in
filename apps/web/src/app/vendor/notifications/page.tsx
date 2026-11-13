import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { NotificationsScreen } from '../../../features/notifications/NotificationsScreen';
import { readNotificationFeed } from '../../../features/notifications/server';

/** S-VEND-17 vendor notifications; the API decides vendor authority. */
export default async function VendorNotificationsPage() {
  await requireOwnerSession('/vendor/notifications');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <NotificationsScreen
          role="vendor"
          {...await readNotificationFeed('vendor')}
        />
      </Suspense>
    </BusinessDashboard>
  );
}
