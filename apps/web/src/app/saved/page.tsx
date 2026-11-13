import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { SavedScreen } from '../../features/engagement/SavedScreen';
import { SavedViewSchema } from '../../features/engagement/saved-state';
import { readSaved } from '../../features/engagement/saved-server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const view = SavedViewSchema.safeParse(await searchParams);
  if (!view.success) {
    const t = await getTranslations('engagement.saved');
    return (
      <ErrorState
        title={t('title')}
        message={t('invalidFilters')}
        action={
          <Link className={buttonClassName} href="/saved">
            {t('resetFilters')}
          </Link>
        }
      />
    );
  }
  return <SavedScreen view={view.data} {...await readSaved(view.data)} />;
}
