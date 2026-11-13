import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OffersScreen } from '../../../../features/offers/public/OffersScreen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('offers.public');
  return { title: t('title'), description: t('intro') };
}

/** S-CUST-20 public offers page. */
export default function OffersPage() {
  return <OffersScreen />;
}
