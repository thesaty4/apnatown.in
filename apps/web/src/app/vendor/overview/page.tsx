import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { BusinessOverview } from '../../../features/businesses/BusinessOverview';
import { requireOwnerSession } from '../../../features/businesses/server';

export default async function VendorOverviewPage() {
  await requireOwnerSession('/vendor/overview');
  return (
    <BusinessDashboard kind="shop">
      <BusinessOverview kind="shop" />
    </BusinessDashboard>
  );
}
