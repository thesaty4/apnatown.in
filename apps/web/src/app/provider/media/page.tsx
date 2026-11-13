import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { VideoManager } from '../../../features/reels/VideoManager';

export default async function ProviderMediaPage() {
  await requireOwnerSession('/provider/media');
  return (
    <BusinessDashboard kind="provider">
      <VideoManager kind="provider" />
    </BusinessDashboard>
  );
}
