import { BusinessAnalytics } from '../../../features/businesses/BusinessAnalytics';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';

/** S-PROV-14 provider analytics: private shell, charts are a client island. */
export default async function ProviderAnalyticsPage() {
  await requireOwnerSession('/provider/analytics');
  return (
    <BusinessDashboard kind="provider">
      <BusinessAnalytics />
    </BusinessDashboard>
  );
}
