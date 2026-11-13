import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import {
  publicOrigin,
  requireOwnerSession,
} from '../../../features/businesses/server';
import { ServicesManager } from '../../../features/services';

/** S-VEND-13 services manager: private SSR shell; the manager is a client island. */
export default async function VendorServicesPage() {
  await requireOwnerSession('/vendor/services');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <ServicesManager kind="shop" baseUrl={publicOrigin()} />
      </Suspense>
    </BusinessDashboard>
  );
}
