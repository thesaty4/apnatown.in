import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';

export default async function Loading() {
  const t = await getTranslations('admin.state');
  return <Skeleton label={t('loading')} />;
}
