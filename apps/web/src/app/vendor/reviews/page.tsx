import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { OwnerReviewsScreen } from '../../../features/reviews/owner/OwnerReviewsScreen';

/** S-VEND-09 owner reviews: private SSR shell; list/filters are a client island. */
export default async function VendorReviewsPage() {
  await requireOwnerSession('/vendor/reviews');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <OwnerReviewsScreen kind="shop" />
      </Suspense>
    </BusinessDashboard>
  );
}
