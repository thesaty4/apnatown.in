import { headers } from 'next/headers';
import { PublicVideo } from '../../../features/reels/VideoManager';

type Props = { params: Promise<{ id: string }> };

export default async function VideoPage({ params }: Props) {
  const [{ id }, requestHeaders] = await Promise.all([params, headers()]);
  return <PublicVideo id={id} nonce={requestHeaders.get('x-nonce') ?? ''} />;
}
