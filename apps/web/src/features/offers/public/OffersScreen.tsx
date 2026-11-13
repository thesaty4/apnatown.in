'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { OfferPublic } from '@apnatown/shared/offers';
import { formatMoney } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useSession } from '../../../shared/auth/SessionProvider';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { publicOffersOptions } from './queries';

const localized = (
  value: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && value.nameHi ? value.nameHi : value.nameEn);

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

/** One active offer; the destination is the server-resolved business path. */
function OfferCard({ offer, locale }: { offer: OfferPublic; locale: Locale }) {
  const t = useTranslations('offers.public');
  const business = localized(offer.business, locale);
  const title = locale === 'hi' && offer.titleHi ? offer.titleHi : offer.titleEn;
  const terms = locale === 'hi' && offer.termsHi ? offer.termsHi : offer.termsEn;
  const discount =
    offer.discount.type === 'percent' && offer.discount.percent !== null
      ? t('percentOff', { value: offer.discount.percent })
      : offer.discount.type === 'flat' && offer.discount.flatPaise !== null
        ? t('flatOff', { amount: formatMoney(offer.discount.flatPaise, locale) })
        : t('freeDelivery');
  const until = new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(offer.validTo));
  return (
    <Card padded className="grid h-full content-start gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-pill bg-offer-soft px-2.5 py-1 text-chip font-semibold text-offer">
          <NavIcon name="tag" className="size-3.5" />
          {discount}
        </span>
        {offer.featured && (
          <span className="rounded-pill bg-primary-soft px-2.5 py-1 text-chip font-semibold text-primary-ink">
            {t('featured')}
          </span>
        )}
        {offer.state === 'out_of_stock' && (
          <span className="rounded-pill bg-warning-soft px-2.5 py-1 text-chip font-semibold text-text">
            {t('outOfStock')}
          </span>
        )}
      </div>
      <div className="grid gap-1">
        <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">{title}</h2>
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {business} ·{' '}
          {t(offer.business.kind === 'shop' ? 'shop' : 'provider')}
        </p>
      </div>
      {terms && (
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {terms}
        </p>
      )}
      <p className="m-0 text-caption text-muted">
        {t('validUntil', { date: until })}
      </p>
      <Link
        href={publicHref(offer.destination, locale)}
        className="inline-flex min-h-touch items-center gap-1 justify-self-start font-semibold text-primary"
      >
        {t('viewBusiness')}
        <NavIcon name="cr" className="size-4" />
      </Link>
    </Card>
  );
}
