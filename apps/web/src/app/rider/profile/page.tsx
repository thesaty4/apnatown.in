import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderProfileScreen } from '../../../features/rider/RiderProfile';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderProfilePage() {
  await requireRiderSession('/rider/profile');
  return (
    <RiderShell requireRider={false}>
      <RiderProfileScreen />
    </RiderShell>
  );
}
