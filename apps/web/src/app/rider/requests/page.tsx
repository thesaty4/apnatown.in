import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderRequests } from '../../../features/rider/RiderWork';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderRequestsPage() {
  await requireRiderSession('/rider/requests');
  return (
    <RiderShell>
      <RiderRequests />
    </RiderShell>
  );
}
