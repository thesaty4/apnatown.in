import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { BusinessQr } from '../../../features/businesses/BusinessQr';
import {
  publicOrigin,
  requireOwnerSession,
} from '../../../features/businesses/server';

export default async function VendorQrPage() {
  await requireOwnerSession('/vendor/qr');
  return (
    <BusinessDashboard kind="shop">
      <BusinessQr kind="shop" baseUrl={publicOrigin()} />
    </BusinessDashboard>
  );
}
