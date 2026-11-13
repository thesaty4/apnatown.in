import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderOnboarding } from '../../../features/rider/onboarding/RiderOnboarding';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderOnboardingPage() {
  await requireRiderSession('/rider/onboarding');
  return (
    <RiderShell requireRider={false}>
      <RiderOnboarding />
    </RiderShell>
  );
}
