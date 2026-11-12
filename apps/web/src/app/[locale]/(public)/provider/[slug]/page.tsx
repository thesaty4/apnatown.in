import {
  PublicListingPage,
  listingMetadata,
} from '../../../../../features/explore/PublicListingPage';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  return listingMetadata('provider', (await params).slug);
}
export default async function ProviderPage({ params }: Props) {
  return <PublicListingPage kind="provider" slug={(await params).slug} />;
}
