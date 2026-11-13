import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { EarningsScreen } from '../../../features/earnings/EarningsScreen';

/** S-VEND-16 Earnings & plan: private SSR shell, owner-scoped client reads. */
export default async function VendorEarningsPage() {
  await requireOwnerSession('/vendor/earnings');
  return (
    <BusinessDashboard kind="shop">
      <EarningsScreen />
    </BusinessDashboard>
  );
}
