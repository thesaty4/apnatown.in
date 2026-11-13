import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { BusinessOverview } from '../../../features/businesses/BusinessOverview';
import { requireOwnerSession } from '../../../features/businesses/server';

export default async function ProviderOverviewPage() {
  await requireOwnerSession('/provider/overview');
  return (
    <BusinessDashboard kind="provider">
      <BusinessOverview kind="provider" />
    </BusinessDashboard>
  );
}
