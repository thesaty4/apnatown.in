import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { NotificationsScreen } from '../../../features/notifications/NotificationsScreen';
import { readNotificationFeed } from '../../../features/notifications/server';

/** S-PROV-15 provider notifications; the API decides provider authority. */
export default async function ProviderNotificationsPage() {
  await requireOwnerSession('/provider/notifications');
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <NotificationsScreen
          role="provider"
          {...await readNotificationFeed('provider')}
        />
      </Suspense>
    </BusinessDashboard>
  );
}
