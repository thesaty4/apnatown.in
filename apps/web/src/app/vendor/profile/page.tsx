import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { BusinessProfileEditor } from '../../../features/businesses/BusinessProfileEditor';
import {
  ownerMapConfig,
  requireOwnerSession,
} from '../../../features/businesses/server';

export default async function VendorProfilePage() {
  await requireOwnerSession('/vendor/profile');
  return (
    <BusinessDashboard kind="shop">
      <BusinessProfileEditor kind="shop" mapConfig={ownerMapConfig()} />
    </BusinessDashboard>
  );
}
