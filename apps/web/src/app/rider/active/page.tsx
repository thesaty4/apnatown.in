import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderActive } from '../../../features/rider/RiderWork';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderActivePage() {
  await requireRiderSession('/rider/active');
  return (
    <RiderShell>
      <RiderActive />
    </RiderShell>
  );
}
