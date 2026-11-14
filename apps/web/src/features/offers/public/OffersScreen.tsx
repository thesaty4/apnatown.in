'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useSession } from '../../../shared/auth/SessionProvider';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';
import { OfferCard } from './OfferCard';
import { publicOffersOptions } from './queries';

/** S-CUST-20 offers list: approved, in-window offers of public businesses. */
export function OffersScreen() {
  const t = useTranslations('offers.public');
  const locale: Locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const query = useInfiniteQuery(publicOffersOptions(api));
  const offers = query.data?.pages.flatMap((page) => page.items) ?? [];

  let body;
  if (query.isPending) body = <Skeleton label={t('loading')} />;
  else if (query.isError)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={
          <Button onClick={() => void query.refetch()}>{t('retry')}</Button>
        }
      />
    );
  else if (offers.length === 0)
    body = (
      <EmptyState
        icon="🏷️"
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={
          <Link
            href={publicHref('/explore', locale)}
            className="font-semibold text-primary underline"
          >
            {t('explore')}
          </Link>
        }
      />
    );
  else
    body = (
      <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-stack-gap p-0">
        {offers.map((offer) => (
          <li key={offer.id} className="min-w-0">
            <OfferCard offer={offer} locale={locale} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="grid min-w-0 gap-stack-gap">
      <header className="grid gap-1">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <p className="m-0 text-text-2">{t('intro')}</p>
      </header>
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
