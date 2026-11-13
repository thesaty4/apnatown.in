import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { OwnerOrdersScreen } from '../../../features/owner-orders';

/** S-VEND-03 order queue: private SSR shell; the queue is a client island. */
export default async function VendorOrdersPage() {
  await requireOwnerSession('/vendor/orders');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <OwnerOrdersScreen kind="shop" />
      </Suspense>
    </BusinessDashboard>
  );
}
