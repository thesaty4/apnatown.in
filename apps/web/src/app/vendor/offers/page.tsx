import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { OwnerOffersScreen } from '../../../features/offers/owner/OwnerOffersScreen';

/** S-VEND-07 vendor offers: private SSR shell; manager and editor are client islands. */
export default async function VendorOffersPage() {
  await requireOwnerSession('/vendor/offers');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <OwnerOffersScreen kind="shop" />
      </Suspense>
    </BusinessDashboard>
  );
}
