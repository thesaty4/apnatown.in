import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { BusinessQr } from '../../../features/businesses/BusinessQr';
import {
  publicOrigin,
  requireOwnerSession,
} from '../../../features/businesses/server';

export default async function ProviderQrPage() {
  await requireOwnerSession('/provider/qr');
  return (
    <BusinessDashboard kind="provider">
      <BusinessQr kind="provider" baseUrl={publicOrigin()} />
    </BusinessDashboard>
  );
}
