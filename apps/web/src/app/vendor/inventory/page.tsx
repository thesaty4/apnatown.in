import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { InventoryScreen } from '../../../features/products/owner';

/** S-VEND-08 inventory: private SSR shell; the table is a client island. */
export default async function VendorInventoryPage() {
  await requireOwnerSession('/vendor/inventory');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <InventoryScreen kind="shop" />
      </Suspense>
    </BusinessDashboard>
  );
}
