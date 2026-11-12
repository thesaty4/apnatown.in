'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { formatDistanceKm, formatMoney } from '@apnatown/shared/formatters';
import type { ExploreCard, ExploreTab } from '@apnatown/shared/search';
import { ServiceBookmarkButton, useServiceBookmarks } from '../engagement';
import { publicHref, type Locale } from '../../shared/i18n/preferences';

const localized = (
  item: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn);
const unitKeys: Record<string, string> = {
  hour: 'hour',
  day: 'day',
  event: 'event',
  sq_ft: 'squareFoot',
  unit: 'unit',
  visit: 'visit',
  plate: 'plate',
};

function ListingImage({
  item,
  square = false,
}: {
  item: ExploreCard;
  square?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center overflow-hidden bg-surface-2 ${square ? 'aspect-square' : 'aspect-video'}`}
    >
      {item.image ? (
        <img
          src={item.image.path}
          alt=""
          width={item.image.width}
          height={item.image.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="text-h1">
          {item.kind === 'product' ? '▧' : item.kind === 'shop' ? '⌂' : '✦'}
        </span>
      )}
    </div>
  );
}

function ListingPrice({ item, locale }: { item: ExploreCard; locale: Locale }) {
  const t = useTranslations('explore.screen');
  const unit =
    item.unit &&
    (item.kind === 'service' && unitKeys[item.unit]
      ? t(`unit.${unitKeys[item.unit]}`)
      : item.unit);
  return (
    <p className="font-display text-price font-bold">
      {item.pricePaise !== null ? (
        <>
          {item.priceType === 'range' && item.priceMaxPaise !== null
            ? t('priceRange', {
                min: formatMoney(item.pricePaise, locale),
                max: formatMoney(item.priceMaxPaise, locale),
              })
            : item.priceType === 'from'
              ? t('fromPrice', { price: formatMoney(item.pricePaise, locale) })
              : formatMoney(item.pricePaise, locale)}
          {item.mrpPaise !== null && item.mrpPaise > item.pricePaise && (
            <del className="ms-2 text-mrp font-normal text-muted">
              {formatMoney(item.mrpPaise, locale)}
            </del>
          )}
          {item.discountPercent !== null && item.discountPercent > 0 && (
            <span className="ms-1 text-small font-semibold text-offer">
              {t('discountOff', { percent: item.discountPercent })}
            </span>
          )}
          {item.kind === 'service' && unit && (
            <span className="ms-1 text-small font-normal">
              {t('perUnit', { unit })}
            </span>
          )}
        </>
      ) : (
        t('priceOnEnquiry')
      )}
    </p>
  );
}

function ProductResultCard({
  item,
  locale,
}: {
  item: ExploreCard;
  locale: Locale;
}) {
  const t = useTranslations('explore.screen');
  return (
    <Link
      href={publicHref(item.path, locale)}
      aria-label={localized(item, locale)}
      className="block h-full rounded-lg focus-visible:ring-focus"
    >
      <Card className="h-full overflow-hidden">
        <ListingImage item={item} square />
        <div className="grid gap-2 p-3">
          {item.featured && (
            <StatusBadge
              tone="offer"
              icon="★"
              label={t('featured')}
              className="justify-self-start"
            />
          )}
          <h2 className="text-body font-normal [overflow-wrap:anywhere]">
            {localized(item, locale)}
          </h2>
          <p className="text-small-min text-muted">
            {localized(item.business, locale)}
            {item.unit && ` · ${item.unit}`}
          </p>
          <ListingPrice item={item} locale={locale} />
          {item.inStock === false ? (
            <StatusBadge tone="bad" icon="!" label={t('outOfStock')} />
          ) : (
            item.lowStockQuantity !== null && (
              <StatusBadge
                tone="warn"
                icon="!"
                label={t('lowStock', { count: item.lowStockQuantity })}
              />
            )
          )}
        </div>
      </Card>
    </Link>
  );
}

export function ExploreCards({
  tab,
  items,
  locale,
}: {
  tab: ExploreTab;
  items: ExploreCard[];
  locale: Locale;
}) {
  const t = useTranslations('explore.screen');
  const bookmark = useServiceBookmarks(
    items.filter((item) => item.kind === 'service').map((item) => item.id),
  );
  return (
    <ul
      className={`grid gap-stack-gap ${tab === 'products' ? 'grid-cols-[repeat(auto-fill,minmax(min(100%,var(--at-product-card-min)),1fr))]' : tab === 'shops' ? 'shop-grid:grid-cols-2 desktop:grid-cols-3 wide:grid-cols-4' : 'grid-cols-[repeat(auto-fill,minmax(min(100%,var(--at-service-card-min)),1fr))]'}`}
    >
      {items.map((item) => {
        const href = publicHref(item.path, locale);
        const name = localized(item, locale);
        return (
          <li key={item.id} className="min-w-0">
            {item.kind === 'product' ? (
              <ProductResultCard item={item} locale={locale} />
            ) : (
              <Card className="grid h-full overflow-hidden">
                <Link href={href} aria-label={name}>
                  <ListingImage item={item} />
                </Link>
                <div className="grid content-start gap-2 p-3">
                  <div className="flex flex-wrap gap-1">
                    {item.featured && (
                      <StatusBadge
                        tone="offer"
                        icon="★"
                        label={t('featured')}
                      />
                    )}
                    {item.verified && (
                      <StatusBadge tone="ok" icon="✓" label={t('verified')} />
                    )}
                    {item.offers && (
                      <StatusBadge tone="offer" icon="%" label={t('offers')} />
                    )}
                    {item.kind === 'service' && item.subcategory && (
                      <StatusBadge
                        tone="secondary"
                        icon="✦"
                        label={localized(item.subcategory, locale)}
                      />
                    )}
                  </div>
                  <h2 className="text-body font-semibold [overflow-wrap:anywhere]">
                    <Link href={href}>{name}</Link>
                  </h2>
                  {item.kind === 'service' ? (
                    <Link
                      className="text-small text-text-2 underline"
                      href={publicHref(
                        `/${item.business.kind === 'shop' ? 'shop' : 'provider'}/${item.business.slug}`,
                        locale,
                      )}
                    >
                      {localized(item.business, locale)}
                    </Link>
                  ) : (
                    <p className="text-small text-muted">
                      {item.category && localized(item.category, locale)}
                      {item.area && ` · ${localized(item.area, locale)}`}
                    </p>
                  )}
                  {item.kind === 'service' && (
                    <ListingPrice item={item} locale={locale} />
                  )}
                  <div className="flex flex-wrap gap-2 text-small">
                    {item.rating !== null ? (
                      <span>
                        {t('ratingSummary', {
                          rating: item.rating,
                          count: item.reviewCount,
                        })}
                      </span>
                    ) : (
                      <span className="text-muted">{t('noReviews')}</span>
                    )}
                    {item.distanceKm !== null && (
                      <span>{formatDistanceKm(item.distanceKm, locale)}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.openNow !== null && (
                      <StatusBadge
                        tone={item.openNow ? 'ok' : 'neutral'}
                        icon={item.openNow ? '✓' : '◷'}
                        label={t(item.openNow ? 'openNow' : 'closed')}
                      />
                    )}
                    {item.delivers !== null && (
                      <StatusBadge
                        tone={item.delivers ? 'ok' : 'neutral'}
                        icon="⌖"
                        label={t(item.delivers ? 'delivers' : 'noDelivery')}
                      />
                    )}
                    {item.pickup && (
                      <StatusBadge
                        tone="neutral"
                        icon="⌂"
                        label={t('pickup')}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-start gap-2 pt-2">
                    {item.phone && (
                      <a
                        className="min-h-touch rounded-md border border-border bg-surface-2 px-3 py-2 font-semibold text-text"
                        href={`tel:${item.phone}`}
                        aria-label={`${t('call')} ${name}`}
                      >
                        {t('call')}
                      </a>
                    )}
                    {item.kind === 'service' && item.whatsappPhone && (
                      <a
                        className="min-h-touch rounded-md border border-border bg-surface-2 px-3 py-2 font-semibold text-text"
                        href={`https://wa.me/${item.whatsappPhone.slice(1)}?text=${encodeURIComponent(t('enquiryText', { name }))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('whatsapp')}
                      </a>
                    )}
                    {item.kind === 'service' && (
                      <ServiceBookmarkButton
                        serviceId={item.id}
                        bookmark={bookmark(item.id)}
                      />
                    )}
                    <Link href={href} className={buttonClassName}>
                      {t('view')}
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </li>
        );
      })}
    </ul>
  );
}
