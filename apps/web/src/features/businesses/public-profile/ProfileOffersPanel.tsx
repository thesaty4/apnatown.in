'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useSession } from '../../../shared/auth/SessionProvider';
import type { Locale } from '../../../shared/i18n/preferences';
import { OfferCard } from '../../offers/public/OfferCard';
import { publicOffersOptions } from '../../offers/public/queries';

/**
 * The profile Offers tab: approved, in-window offers of this business. The
 * same public read and card as `/offers`; no owner draft or moderation data
 * crosses into the public page.
 */
export function ProfileOffersPanel({ businessId }: { businessId: string }) {
  const t = useTranslations('offers.public');
  const local = useTranslations('business.publicProfile.offers');
  const locale: Locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const query = useInfiniteQuery(publicOffersOptions(api, businessId));
  const offers = query.data?.pages.flatMap((page) => page.items) ?? [];

  let body;
  if (query.isPending) body = <Skeleton label={t('loading')} />;
  else if (query.isError)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        headingLevel="h2"
        action={<Button onClick={() => void query.refetch()}>{t('retry')}</Button>}
      />
    );
  else if (offers.length === 0)
    body = (
      <EmptyState
        icon="🏷️"
        title={local('emptyTitle')}
        message={local('emptyMessage')}
        headingLevel="h2"
        action={null}
      />
    );
  else
    body = (
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-stack-gap p-0">
        {offers.map((offer) => (
          <li key={offer.id} className="min-w-0">
            <OfferCard offer={offer} locale={locale} showBusiness={false} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="grid min-w-0 gap-stack-gap">
      {body}
      {query.hasNextPage && (
        <div className="justify-self-center">
          <Button
            variant="outline"
            loading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        </div>
      )}
      {query.isFetchNextPageError && (
        <p role="alert" className="m-0 text-small text-error">
          {t('loadMoreError')}
        </p>
      )}
    </div>
  );
}
