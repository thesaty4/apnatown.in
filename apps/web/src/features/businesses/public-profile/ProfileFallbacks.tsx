import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { NotFoundState } from '@apnatown/ui/feedback/StateViews';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { publicHref } from '../../../shared/i18n/preferences';
import { currentLocale } from '../../support/metadata';

/**
 * Missing or not-live profile. The API deliberately returns the same 404 for
 * both, so no private application/approval state is disclosed.
 */
export async function ProfileNotFound() {
  const [t, profile, locale] = await Promise.all([
    getTranslations('business.publicProfile'),
    getTranslations('business.profile'),
    currentLocale(),
  ]);
  return (
    <NotFoundState
      title={profile('notLive')}
      message={t('notLiveMessage')}
      action={
        <Link href={publicHref('/explore', locale)} className={buttonVariantClassName('primary')}>
          {t('exploreNearby')}
        </Link>
      }
    />
  );
}

/** Route-level skeleton shaped like the profile header, actions and tabs. */
export async function ProfileLoading() {
  const t = await getTranslations('business.publicProfile');
  return (
    <div role="status" aria-busy="true" className="grid gap-stack-gap">
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true" className="grid gap-stack-gap">
        <div className="aspect-[16/9] rounded-lg skeleton-fill animate-skeleton motion-reduce:animate-none tablet:aspect-[3/1]" />
        <div className="h-8 w-2/3 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none" />
        <div className="h-5 w-1/2 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-11 flex-1 rounded-md skeleton-fill animate-skeleton motion-reduce:animate-none" />
          ))}
        </div>
        <Skeleton label="" />
      </div>
    </div>
  );
}
