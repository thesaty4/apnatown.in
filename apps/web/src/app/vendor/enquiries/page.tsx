import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { EnquiryInbox } from '../../../features/services';

/** S-VEND-14 inbox: private SSR shell; the inbox is a client island. */
export default async function VendorEnquiriesPage() {
  await requireOwnerSession('/vendor/enquiries');
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <EnquiryInbox kind="shop" />
      </Suspense>
    </BusinessDashboard>
  );
}
