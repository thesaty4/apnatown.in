import { BusinessOnboarding } from '../../../features/businesses/BusinessOnboarding';
import {
  ownerMapConfig,
  requireOwnerSession,
} from '../../../features/businesses/server';

export default async function VendorOnboardingPage() {
  await requireOwnerSession('/vendor/onboarding');
  return <BusinessOnboarding kind="shop" mapConfig={ownerMapConfig()} />;
}
