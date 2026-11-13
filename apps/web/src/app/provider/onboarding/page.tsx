import { BusinessOnboarding } from '../../../features/businesses/BusinessOnboarding';
import {
  ownerMapConfig,
  requireOwnerSession,
} from '../../../features/businesses/server';

export default async function ProviderOnboardingPage() {
  await requireOwnerSession('/provider/onboarding');
  return <BusinessOnboarding kind="provider" mapConfig={ownerMapConfig()} />;
}
