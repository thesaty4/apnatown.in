import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { OwnerReviewsScreen } from '../../../features/reviews/owner/OwnerReviewsScreen';

/** S-PROV-10 owner reviews: private SSR shell; list/filters are a client island. */
export default async function ProviderReviewsPage() {
  await requireOwnerSession('/provider/reviews');
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <OwnerReviewsScreen kind="provider" />
      </Suspense>
    </BusinessDashboard>
  );
}
