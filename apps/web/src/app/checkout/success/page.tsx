import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { IdSchema } from '@apnatown/shared/wire';
import { CheckoutSuccess } from '../../../features/checkout';

// Owner-checked attempt summary: never cached or indexed (S-CUST-12).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('checkout.success');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const attempt = IdSchema.safeParse((await searchParams).attempt);
  return <CheckoutSuccess attemptId={attempt.success ? attempt.data : null} />;
}
