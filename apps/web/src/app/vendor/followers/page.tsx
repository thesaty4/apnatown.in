import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { FollowersScreen } from '../../../features/engagement/followers/FollowersScreen';

/** S-VEND-15 followers: private SSR shell; KPIs/chart/announce are a client island. */
export default async function VendorFollowersPage() {
  await requireOwnerSession('/vendor/followers');
  return (
    <BusinessDashboard kind="shop">
      <FollowersScreen kind="shop" />
    </BusinessDashboard>
  );
}
