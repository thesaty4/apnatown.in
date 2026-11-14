import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MyReviewsScreen } from '../../features/reviews/MyReviewsScreen';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.myReviews');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function MyReviewsPage() {
  const t = await getTranslations('account.myReviews');
  return (
    <div className="mx-auto grid max-w-state-copy gap-4">
      <h1 className="m-0 text-h1">{t('title')}</h1>
      <p className="m-0 text-text-2">{t('intro')}</p>
      <MyReviewsScreen />
    </div>
  );
}
