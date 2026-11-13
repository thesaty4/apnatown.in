import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { OwnerOrdersScreen } from '../../../features/owner-orders';

/** S-PROV-04 order queue (provider product orders): client island. */
export default async function ProviderOrdersPage() {
  await requireOwnerSession('/provider/orders');
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <OwnerOrdersScreen kind="provider" />
      </Suspense>
    </BusinessDashboard>
  );
}
