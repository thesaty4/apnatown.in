import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { ProductList } from '../../../features/products/owner';

/** S-PROV-06 products: private SSR shell; the list is a client island. */
export default async function ProviderProductsPage() {
  await requireOwnerSession('/provider/products');
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <ProductList kind="provider" />
      </Suspense>
    </BusinessDashboard>
  );
}
