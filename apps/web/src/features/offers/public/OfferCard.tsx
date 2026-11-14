'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { OfferPublic } from '@apnatown/shared/offers';
import { formatMoney } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';
import { NavIcon } from '../../../shared/ui/NavIcon';

const localized = (
  value: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && value.nameHi ? value.nameHi : value.nameEn);

/** One active offer; the destination is the server-resolved business path. */
export function OfferCard({
  offer,
  locale,
  showBusiness = true,
}: {
  offer: OfferPublic;
  locale: Locale;
  /** Hide the business row/link on that business's own profile. */
  showBusiness?: boolean;
}) {
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
        {showBusiness && (
          <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
            {business} ·{' '}
            {t(offer.business.kind === 'shop' ? 'shop' : 'provider')}
          </p>
        )}
      </div>
      {terms && (
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {terms}
        </p>
      )}
      <p className="m-0 text-caption text-muted">
        {t('validUntil', { date: until })}
      </p>
      {showBusiness && (
        <Link
          href={publicHref(offer.destination, locale)}
          className="inline-flex min-h-touch items-center gap-1 justify-self-start font-semibold text-primary"
        >
          {t('viewBusiness')}
          <NavIcon name="cr" className="size-4" />
        </Link>
      )}
    </Card>
  );
}
