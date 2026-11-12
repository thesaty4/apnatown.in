import { PublicListingPage, listingMetadata } from '../../../../../features/explore/PublicListingPage';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return listingMetadata('service', (await params).slug); }
export default async function ServicePage({ params }: Props) { return <PublicListingPage kind="service" slug={(await params).slug} />; }
