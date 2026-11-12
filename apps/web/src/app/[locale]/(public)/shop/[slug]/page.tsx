import {
  PublicListingPage,
  listingMetadata,
} from '../../../../../features/explore/PublicListingPage';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  return listingMetadata('shop', (await params).slug);
}
export default async function ShopPage({ params }: Props) {
  return <PublicListingPage kind="shop" slug={(await params).slug} />;
}
