import { PublicListingPage, listingMetadata } from '../../../../../features/explore/PublicListingPage';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return listingMetadata('product', (await params).slug); }
export default async function ProductPage({ params }: Props) { return <PublicListingPage kind="product" slug={(await params).slug} />; }
