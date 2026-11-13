import { BusinessProfilePage } from '../../../../../features/businesses/public-profile/BusinessProfilePage';
import { businessProfileMetadata } from '../../../../../features/businesses/public-profile/read';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  return businessProfileMetadata('shop', (await params).slug);
}
export default async function ShopPage({ params }: Props) {
  return <BusinessProfilePage kind="shop" slug={(await params).slug} />;
}
