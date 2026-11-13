import { Suspense } from 'react';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { EnquiryInbox } from '../../../features/services';

/** S-PROV-03 inbox: private SSR shell; the inbox is a client island. */
export default async function ProviderEnquiriesPage() {
  await requireOwnerSession('/provider/enquiries');
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <EnquiryInbox kind="provider" />
      </Suspense>
    </BusinessDashboard>
  );
}
