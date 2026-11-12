'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { formatDistanceKm, formatMoney } from '@apnatown/shared/formatters';
import type { ExploreCard, ExploreTab } from '@apnatown/shared/search';
import { publicHref, type Locale } from '../../shared/i18n/preferences';

const localized = (item: { nameEn: string; nameHi: string | null }, locale: Locale) =>
  locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn;

export function ExploreCards({ tab, items, locale }: {
  tab: ExploreTab; items: ExploreCard[]; locale: Locale;
}) {
  const t = useTranslations('explore.screen');
  return (
    <ul className={`grid gap-3 ${tab === 'products' ? 'grid-cols-2 desktop:grid-cols-3' : tab === 'shops' ? 'tablet:grid-cols-2 desktop:grid-cols-3' : 'tablet:grid-cols-2'}`}>
      {items.map((item) => {
        const href = publicHref(item.path, locale);
        const name = localized(item, locale);
        return (
          <li key={item.id} className="min-w-0">
            <Card className="grid h-full overflow-hidden">
              <Link href={href} aria-label={name} className="grid aspect-video place-items-center overflow-hidden bg-surface-2">
                {item.image ? (
                  /* Media gateway paths are reauthorized by the API on every image read. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image.path} alt="" width={item.image.width} height={item.image.height}
                    loading="lazy" decoding="async" className="size-full object-cover" />
                ) : <span aria-hidden="true" className="text-h1">{tab === 'products' ? '▧' : tab === 'shops' ? '⌂' : '✦'}</span>}
              </Link>
              <div className="grid content-start gap-2 p-3">
                <div className="flex flex-wrap gap-1">
                  {item.featured && <StatusBadge tone="offer" icon="★" label={t('featured')} />}
                  {item.verified && <StatusBadge tone="ok" icon="✓" label={t('verified')} />}
                  {item.offers && <StatusBadge tone="offer" icon="%" label={t('offers')} />}
                </div>
                <h2 className="text-h3 [overflow-wrap:anywhere]"><Link href={href}>{name}</Link></h2>
                {item.kind !== 'shop' && <p className="text-small text-text-2">{localized(item.business, locale)}</p>}
                {item.category && <p className="text-small text-muted">{localized(item.category, locale)}
                  {item.subcategory && ` · ${localized(item.subcategory, locale)}`}</p>}
                {item.area && <p className="text-small text-muted"><span aria-hidden="true">⌖ </span>{localized(item.area, locale)}</p>}
                <div className="flex flex-wrap gap-2 text-small">
                  {item.rating !== null ? <span>{t('ratingSummary', { rating: item.rating, count: item.reviewCount })}</span>
                    : <span className="text-muted">{t('noReviews')}</span>}
                  {item.distanceKm !== null && <span>{formatDistanceKm(item.distanceKm, locale)}</span>}
                </div>
                {item.kind !== 'shop' && <p className="font-semibold">
                  {item.pricePaise !== null ? (
                    <>
                      {item.priceType === 'range' && item.priceMaxPaise !== null
                        ? t('priceRange', { min: formatMoney(item.pricePaise, locale), max: formatMoney(item.priceMaxPaise, locale) })
                        : item.priceType === 'from' ? t('fromPrice', { price: formatMoney(item.pricePaise, locale) }) : formatMoney(item.pricePaise, locale)}
                      {item.mrpPaise !== null && item.mrpPaise > item.pricePaise && <del className="ms-2 text-small font-normal text-muted">{formatMoney(item.mrpPaise, locale)}</del>}
                      {item.unit && <span className="ms-1 text-small font-normal">{t('perUnit', { unit: item.unit })}</span>}
                    </>
                  ) : t('priceOnEnquiry')}
                </p>}
                <div className="flex flex-wrap gap-1">
                  {item.openNow !== null && <StatusBadge tone={item.openNow ? 'ok' : 'neutral'} icon={item.openNow ? '✓' : '◷'} label={t(item.openNow ? 'openNow' : 'closed')} />}
                  {item.inStock !== null && <StatusBadge tone={item.inStock ? 'ok' : 'warn'} icon={item.inStock ? '✓' : '!'} label={t(item.inStock ? 'inStock' : 'outOfStock')} />}
                  {item.delivers !== null && <StatusBadge tone={item.delivers ? 'ok' : 'neutral'} icon="⌖" label={t(item.delivers ? 'delivers' : 'noDelivery')} />}
                  {item.pickup && <StatusBadge tone="neutral" icon="⌂" label={t('pickup')} />}
                </div>
                <Link href={href} className={`${buttonClassName} mt-2`}>{t('view')}</Link>
                {item.phone && <a className="min-h-touch py-2 text-center font-semibold text-primary underline" href={`tel:${item.phone}`} aria-label={`${t('call')} ${name}`}>{t('call')}</a>}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
