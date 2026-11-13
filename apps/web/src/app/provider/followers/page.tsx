import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { FollowersScreen } from '../../../features/engagement/followers/FollowersScreen';

/** S-PROV-11 followers: private SSR shell; KPIs/chart/announce are a client island. */
export default async function ProviderFollowersPage() {
  await requireOwnerSession('/provider/followers');
  return (
    <BusinessDashboard kind="provider">
      <FollowersScreen kind="provider" />
    </BusinessDashboard>
  );
}
