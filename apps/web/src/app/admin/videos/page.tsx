import { Suspense } from 'react';
import { headers } from 'next/headers';
import { VideoModerationScreen } from '../../../features/admin/videos/VideoModerationScreen';

export default async function AdminVideosPage() {
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <Suspense>
      <VideoModerationScreen nonce={nonce} />
    </Suspense>
  );
}
