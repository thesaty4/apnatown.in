import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ReelsFeed } from '../../../../features/reels/ReelsFeed';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reels.feed');
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default async function VideosPage() {
  const requestHeaders = await headers();
  return <ReelsFeed nonce={requestHeaders.get('x-nonce') ?? ''} />;
}
