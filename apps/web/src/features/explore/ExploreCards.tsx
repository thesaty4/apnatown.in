'use client';

import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Avatar } from '@apnatown/ui/data/Avatar';
import type { Category } from '@apnatown/shared/catalog';
import { formatDistanceKm, formatMoney } from '@apnatown/shared/formatters';
import type { ExploreCard, ExploreTab } from '@apnatown/shared/search';
import { ServiceBookmarkButton, useServiceBookmarks } from '../engagement';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';

const localized = (
  item: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn);
const unitKeys: Record<string, string> = {
  hour: 'hour',
  day: 'day',
  month: 'month',
  event: 'event',
  sq_ft: 'squareFoot',
  unit: 'unit',
  visit: 'visit',
  plate: 'plate',
};

function ListingImage({
  item,
  square = false,
  category,
}: {
  item: ExploreCard;
  square?: boolean;
  category: Category | undefined;
}) {
  return (
    <Avatar
      label=""
      emoji={
        category?.icon ||
        (item.kind === 'product' ? '🛍️' : item.kind === 'shop' ? '🏪' : '🛠️')
      }
      size="full"
      {...(item.image && {
        src: item.image.path,
        imageWidth: item.image.width,
        imageHeight: item.image.height,
      })}
      style={
        {
          '--at-art-hue': `var(--at-listing-hue-${category?.slug ?? ''}, var(--at-art-hue-default))`,
        } as CSSProperties
      }
      className={square ? '' : 'aspect-[16/10]! text-listing-art!'}
    />
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
  category,
}: {
  item: ExploreCard;
  locale: Locale;
  category: Category | undefined;
}) {
  const t = useTranslations('explore.screen');
  return (
    <Link
      href={publicHref(item.path, locale)}
      aria-label={localized(item, locale)}
      className="block h-full rounded-lg focus-visible:ring-focus"
    >
      <Card className="h-full overflow-hidden">
        <div className="relative">
          <ListingImage item={item} category={category} square />
          {item.featured && (
            <StatusBadge
              tone="offer"
              icon="★"
              label={t('featured')}
              className="absolute start-2 top-2"
            />
          )}
        </div>
        <div className="grid gap-1 px-3 pt-2.5 pb-3">
          <h2 className="min-h-product-title-min font-body text-product-title font-medium leading-listing-title [overflow-wrap:anywhere]">
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
  categories,
}: {
  tab: ExploreTab;
  items: ExploreCard[];
  locale: Locale;
  categories: Category[];
}) {
  const t = useTranslations('explore.screen');
  const format = useFormatter();
  const actionClass = (primary = false) =>
    `${buttonVariantClassName(primary ? 'primary' : 'ghost', 'card')} min-w-0 flex-1`;
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
        const category = categories.find(
          (category) => category.slug === item.category?.slug,
        );
        const rating = item.rating;
        return (
          <li key={item.id} className="min-w-0">
            {item.kind === 'product' ? (
              <ProductResultCard
                item={item}
                locale={locale}
                category={category}
              />
            ) : (
              <Card className="flex h-full flex-col overflow-hidden">
                <Link href={href} aria-label={name} className="relative block">
                  <ListingImage item={item} category={category} />
                  {item.featured && (
                    <StatusBadge
                      tone="offer"
                      icon="★"
                      label={t('featured')}
                      className="absolute start-2 top-2"
                    />
                  )}
                </Link>
                <div className="grid flex-1 content-end gap-1.5 p-3">
                  {item.kind === 'service' && (
                    <div className="flex flex-wrap gap-1">
                      {item.offers && (
                        <StatusBadge
                          tone="offer"
                          icon="%"
                          label={t('offers')}
                        />
                      )}
                      {item.subcategory && (
                        <StatusBadge
                          tone="secondary"
                          icon="✦"
                          label={localized(item.subcategory, locale)}
                        />
                      )}
                      {item.openNow !== null && (
                        <StatusBadge
                          tone={item.openNow ? 'ok' : 'neutral'}
                          icon={item.openNow ? '●' : '○'}
                          label={t(item.openNow ? 'openNow' : 'closed')}
                        />
                      )}
                    </div>
                  )}
                  <h2 className="font-body text-body font-semibold leading-listing-title [overflow-wrap:anywhere]">
                    <Link href={href}>{name}</Link>
                  </h2>
                  {item.kind === 'service' ? (
                    <Link
                      className="flex items-center gap-2 text-small text-text-2"
                      href={publicHref(
                        `/${item.business.kind === 'shop' ? 'shop' : 'provider'}/${item.business.slug}`,
                        locale,
                      )}
                    >
                      <span aria-hidden="true">{category?.icon}</span>
                      {localized(item.business, locale)}
                      {item.verified && (
                        <span
                          role="img"
                          aria-label={t('verified')}
                          className="text-secondary"
                        >
                          <NavIcon name="shield" className="size-3.5" />
                        </span>
                      )}
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
                  <div className="flex flex-wrap items-center gap-1 text-small">
                    {rating !== null ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="sr-only">
                          {t('ratingSummary', {
                            rating,
                            count: item.reviewCount,
                          })}
                        </span>
                        <span aria-hidden="true" className="inline-flex gap-px">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <NavIcon
                              key={star}
                              name="star"
                              className={`size-3.5 ${star <= Math.round(rating) ? 'fill-star text-star' : 'text-border-strong'}`}
                            />
                          ))}
                        </span>
                        <strong aria-hidden="true">
                          {format.number(rating, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </strong>
                        <span aria-hidden="true" className="text-muted">
                          ({format.number(item.reviewCount)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted">{t('noReviews')}</span>
                    )}
                    {item.distanceKm !== null && (
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden="true">·</span>
                        <NavIcon name="pin" className="size-3" />
                        {formatDistanceKm(item.distanceKm, locale)}
                      </span>
                    )}
                  </div>
                  {item.kind === 'shop' && (
                    <div className="flex flex-wrap gap-1.5">
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
                  )}
                  <div className="mt-1 flex items-start gap-2">
                    {item.phone && (
                      <a
                        className={actionClass()}
                        href={`tel:${item.phone}`}
                        aria-label={`${t('call')} ${name}`}
                      >
                        <NavIcon name="phone" className="size-4" />
                        {item.kind === 'shop' && t('call')}
                      </a>
                    )}
                    {item.kind === 'service' && item.whatsappPhone && (
                      <a
                        className={actionClass()}
                        aria-label={t('whatsapp')}
                        href={`https://wa.me/${item.whatsappPhone.slice(1)}?text=${encodeURIComponent(t('enquiryText', { name }))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <NavIcon name="chat" className="size-4" />
                      </a>
                    )}
                    {item.kind === 'service' && (
                      <ServiceBookmarkButton
                        serviceId={item.id}
                        bookmark={bookmark(item.id)}
                        compact
                      />
                    )}
                    <Link href={href} className={actionClass(true)}>
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
