import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { ProductList } from '../../../features/products/owner';

/** S-VEND-05 products: private SSR shell; the list is a client island. */
export default async function VendorProductsPage() {
  await requireOwnerSession('/vendor/products');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <ProductList kind="shop" />
      </Suspense>
    </BusinessDashboard>
  );
}
