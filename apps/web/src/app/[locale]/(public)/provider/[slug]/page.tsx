import { BusinessProfilePage } from '../../../../../features/businesses/public-profile/BusinessProfilePage';
import { businessProfileMetadata } from '../../../../../features/businesses/public-profile/read';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  return businessProfileMetadata('provider', (await params).slug);
}
export default async function ProviderPage({ params }: Props) {
  return <BusinessProfilePage kind="provider" slug={(await params).slug} />;
}
