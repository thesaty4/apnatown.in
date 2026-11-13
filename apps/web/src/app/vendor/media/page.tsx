import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { VideoManager } from '../../../features/reels/VideoManager';

export default async function VendorMediaPage() {
  await requireOwnerSession('/vendor/media');
  return (
    <BusinessDashboard kind="shop">
      <VideoManager kind="shop" />
    </BusinessDashboard>
  );
}
