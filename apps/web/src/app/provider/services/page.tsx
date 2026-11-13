import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import {
  publicOrigin,
  requireOwnerSession,
} from '../../../features/businesses/server';
import { ServicesManager } from '../../../features/services';

/** S-PROV-08 services manager: private SSR shell; the manager is a client island. */
export default async function ProviderServicesPage() {
  await requireOwnerSession('/provider/services');
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <ServicesManager kind="provider" baseUrl={publicOrigin()} />
      </Suspense>
    </BusinessDashboard>
  );
}
