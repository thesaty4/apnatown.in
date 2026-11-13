import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ProductPublic } from '@apnatown/shared/public-listings';
import { ExploreResponseSchema } from '@apnatown/shared/search';
import { formatDistanceKm, formatMoney } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { createPublicServerApi } from '../../shared/api/server';
import { resource, unwrap } from '../../shared/api/result';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { AddToCart } from '../cart';
import { ShareAction } from '../businesses';
import { LinkedVideosStrip } from '../gallery';
import { ReviewsSection } from '../reviews';
import { readCategories } from '../catalog/server';
import { ExploreCards } from './ExploreCards';
import { ProductGallery } from './ProductGallery';

const RELATED_LIMIT = 6;
const localized = (
  value: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && value.nameHi ? value.nameHi : value.nameEn);

async function readRelated(product: ProductPublic) {
  const category = product.item.category?.slug;
  if (!category) return [];
  const api = createPublicServerApi();
  const result = await resource(async () =>
    unwrap(
      await api.GET('/explore', {
        params: {
          query: { tab: 'products', category, limit: RELATED_LIMIT + 1 },
        },
      }),
      ExploreResponseSchema,
    ),
  );
  if (result.kind !== 'ready') return [];
  return result.data.page.items
    .filter((item) => item.id !== product.item.id && item.kind === 'product')
    .slice(0, RELATED_LIMIT);
}

/** S-CUST-08 product details in prototype `V.prod` order (js16/js23/js24). */
export async function ProductDetail({
  data,
  locale,
}: {
  data: ProductPublic;
  locale: Locale;
}) {
  const t = await getTranslations('explore.product');
  const screen = await getTranslations('explore.screen');
  const { item, description, images } = data;
  const name = localized(item, locale);
  const [related, categories] = await Promise.all([
    readRelated(data),
    readCategories('product', item.path, locale),
  ]);
  const businessHref = publicHref(
    `/${item.business.kind === 'shop' ? 'shop' : 'provider'}/${item.business.slug}`,
    locale,
  );
  const low =
    data.inventory.inStock &&
    item.lowStockQuantity !== null &&
    data.inventory.maxQuantity <= item.lowStockQuantity;
  return (
    <article className="grid gap-stack-gap">
      <nav aria-label={t('breadcrumb')} className="text-small text-text-2">
        <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          <li>
            <Link href={publicHref('/', locale)} className="underline">
              {t('home')}
            </Link>{' '}
            /
          </li>
          {item.category && (
            <li>
              <Link
                href={publicHref(`/category/${item.category.slug}`, locale)}
                className="underline"
              >
                {localized(item.category, locale)}
              </Link>{' '}
              /
            </li>
          )}
          <li
            aria-current="page"
            className="text-text [overflow-wrap:anywhere]"
          >
            {name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-stack-gap desktop:grid-cols-2">
        <ProductGallery name={name} images={images} />
        <div className="grid content-start gap-3">
          <h1 className="m-0 text-h1 [overflow-wrap:anywhere]">{name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-small">
            {item.rating !== null && (
              <span className="font-semibold">★ {item.rating.toFixed(1)}</span>
            )}
            <span className="text-text-2">
              {t('reviewsCount', { count: item.reviewCount })}
            </span>
            {item.verified && (
              <StatusBadge tone="ok" icon="✓" label={screen('verified')} />
            )}
            {item.offers && (
              <StatusBadge tone="offer" icon="%" label={screen('offers')} />
            )}
          </div>
          <div>
            <p className="m-0 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-h1 font-bold">
                {item.pricePaise === null
                  ? screen('priceOnEnquiry')
                  : formatMoney(item.pricePaise, locale)}
              </span>
              {item.pricePaise !== null &&
                item.mrpPaise !== null &&
                item.mrpPaise > item.pricePaise && (
                  <del className="text-mrp text-muted">
                    {formatMoney(item.mrpPaise, locale)}
                  </del>
                )}
              {item.discountPercent !== null && item.discountPercent > 0 && (
                <span className="text-small font-semibold text-offer">
                  {screen('discountOff', { percent: item.discountPercent })}
                </span>
              )}
            </p>
            <p className="m-0 text-caption text-muted">
              {t('inclusiveTaxes')}
              {item.unit ? ` · ${item.unit}` : ''}
            </p>
          </div>
          {!data.inventory.inStock ? null : low ? (
            <p
              role="status"
              className="m-0 rounded-md border border-warning bg-warning-soft px-3.5 py-2.5 text-small"
            >
              {t('lowStock', { count: data.inventory.maxQuantity })}
            </p>
          ) : (
            <StatusBadge
              tone="ok"
              icon="✓"
              label={screen('inStock')}
              className="justify-self-start"
            />
          )}
          <AddToCart
            productId={item.id}
            name={name}
            purchasable={item.pricePaise !== null}
            variants={data.variants}
            inventory={data.inventory}
          />
          {!data.orderability.orderable && (
            <p role="status" className="m-0 text-small text-text-2">
              {screen('orderingUnavailable')}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <ShareAction name={name} path={item.path} label={t('share')} />
            {item.phone && (
              <a
                className="inline-flex min-h-touch items-center gap-2 rounded-md px-3 font-semibold text-primary underline"
                href={`tel:${item.phone}`}
                aria-label={`${screen('call')} ${name}`}
              >
                <NavIcon name="phone" className="size-4.5" />
                {screen('call')}
              </a>
            )}
          </div>
        </div>
      </div>

      <Card padded className="grid gap-3">
        <h2 className="m-0 text-h3">{t('soldBy')}</h2>
        <Link href={businessHref} className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="text-h2">
            🏪
          </span>
          <span className="grid min-w-0 flex-1">
            <b className="[overflow-wrap:anywhere]">
              {localized(item.business, locale)}
            </b>
            <span className="text-small text-text-2">
              {[
                item.distanceKm !== null &&
                  t('distance', {
                    km: formatDistanceKm(item.distanceKm, locale),
                  }),
                item.openNow !== null &&
                  screen(item.openNow ? 'openNow' : 'closed'),
                item.area && localized(item.area, locale),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
          <NavIcon name="cr" className="size-5" />
        </Link>
        <hr className="m-0 border-border" />
        <p className="m-0 flex items-center gap-2 text-small">
          {item.delivers ? (
            <>
              <NavIcon name="bike" className="size-4" />
              <b>{screen('delivers')}</b>
            </>
          ) : item.pickup ? (
            <>
              <NavIcon name="pin" className="size-4" />
              {t('outsideDelivery')}
            </>
          ) : (
            <>
              <NavIcon name="pin" className="size-4" />
              {screen('noDelivery')}
            </>
          )}
        </p>
      </Card>

      {description && (
        <Card padded className="grid gap-2">
          <h2 className="m-0 text-h3">{t('details')}</h2>
          <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
            {description}
          </p>
        </Card>
      )}

      <LinkedVideosStrip targetType="product" targetId={item.id} />

      <ReviewsSection
        targetType="product"
        targetId={item.id}
        name={name}
        returnPath={item.path}
      />

      {related.length > 0 && (
        <section aria-labelledby="product-related" className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="product-related" className="m-0 text-h2">
              {t('related')}
            </h2>
            {item.category && (
              <Link
                href={`${publicHref('/explore', locale)}?${new URLSearchParams({ tab: 'products', category: item.category.slug })}`}
                className="inline-flex min-h-touch items-center gap-1 font-semibold text-primary"
              >
                {t('viewAll')}
                <NavIcon name="cr" className="size-4" />
              </Link>
            )}
          </div>
          <ExploreCards
            tab="products"
            items={related}
            locale={locale}
            categories={categories ?? []}
            headingLevel="h3"
            listClassName="grid-flow-col auto-cols-[minmax(var(--at-product-card-min),44%)] sheet:auto-cols-[minmax(--spacing(50),--spacing(57.5))] overflow-x-auto overscroll-x-contain pb-2 snap-x snap-proximity [&>li]:snap-start"
          />
        </section>
      )}
    </article>
  );
}
