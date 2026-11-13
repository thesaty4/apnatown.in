import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { BusinessProfileEditor } from '../../../features/businesses/BusinessProfileEditor';
import {
  ownerMapConfig,
  requireOwnerSession,
} from '../../../features/businesses/server';

export default async function ProviderProfilePage() {
  await requireOwnerSession('/provider/profile');
  return (
    <BusinessDashboard kind="provider">
      <BusinessProfileEditor kind="provider" mapConfig={ownerMapConfig()} />
    </BusinessDashboard>
  );
}
