import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { IdSchema } from '@apnatown/shared/wire';
import { ReelsFeed } from '../../../../../features/reels/ReelsFeed';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reels.feed');
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default async function VideoPage({ params }: Props) {
  const [{ id }, requestHeaders] = await Promise.all([params, headers()]);
  if (!IdSchema.safeParse(id).success) notFound();
  return (
    <ReelsFeed
      initialVideoId={id}
      nonce={requestHeaders.get('x-nonce') ?? ''}
    />
  );
}
