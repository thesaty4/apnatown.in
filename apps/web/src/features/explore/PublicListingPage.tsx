import { cache } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CatalogSlugSchema } from '@apnatown/shared/catalog';
import {
  ProductPublicSchema,
  ServicePublicSchema,
} from '@apnatown/shared/public-listings';
import { formatMoney } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import {
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import {
  buttonClassName,
  buttonVariantClassName,
} from '@apnatown/ui/primitives/Button';
import { createPublicServerApi } from '../../shared/api/server';
import { resource, unwrap } from '../../shared/api/result';
import { maintenanceHref } from '../../shared/api/maintenance';
import { publicHref } from '../../shared/i18n/preferences';
import {
  currentLocale,
  noindex,
  publicPageMetadata,
} from '../support/metadata';
import { RetryButton } from '../../shared/ui/RetryButton';
import { ServiceBookmarkAction } from '../engagement';
import { EnquiryForm } from '../services';
import { AddToCart } from '../cart';
import { LinkedVideosStrip } from '../gallery';
import { NavIcon } from '../../shared/ui/NavIcon';
import { ProductDetail } from './ProductDetail';

/** S-CUST-08/09. Shop/provider profiles live in `features/businesses/public-profile`. */
type ListingKind = 'product' | 'service';
const readListing = cache(async (kind: ListingKind, slug: string) => {
  if (!CatalogSlugSchema.safeParse(slug).success) notFound();
  const api = createPublicServerApi();
  return resource(async () => {
    if (kind === 'product')
      return unwrap(
        await api.GET('/products/{slug}', { params: { path: { slug } } }),
        ProductPublicSchema,
      );
    return unwrap(
      await api.GET('/services/{slug}', { params: { path: { slug } } }),
      ServicePublicSchema,
    );
  });
});

export async function listingMetadata(kind: ListingKind, slug: string) {
  const result = await readListing(kind, slug);
  if (result.kind !== 'ready' || result.data.item.path !== `/${kind}/${slug}`)
    return noindex;
  const locale = await currentLocale();
  const name =
    locale === 'hi' && result.data.item.nameHi
      ? result.data.item.nameHi
      : result.data.item.nameEn;
  return publicPageMetadata(result.data.item.path, name);
}

export async function PublicListingPage({
  kind,
  slug,
}: {
  kind: ListingKind;
  slug: string;
}) {
  const result = await readListing(kind, slug);
  const locale = await currentLocale();
  const t = await getTranslations('explore.screen');
  const enquiry = await getTranslations('service.enquiry');
  if (result.kind === 'error') {
    if (result.code.endsWith('_NOT_FOUND')) notFound();
    if (result.code === 'MAINTENANCE')
      redirect(maintenanceHref(`/${kind}/${slug}`, locale === 'hi'));
    if (['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE'].includes(result.code)) {
      const permission = await getTranslations('common.noPermission');
      return (
        <NoPermissionState
          title={permission('title')}
          message={permission('message')}
          action={null}
        />
      );
    }
    return (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={<RetryButton>{t('retry')}</RetryButton>}
      />
    );
  }
  const { item, description, images } = result.data;
  if (item.path !== `/${kind}/${slug}`) notFound();
  if (item.kind === 'product' && 'inventory' in result.data)
    return <ProductDetail data={result.data} locale={locale} />;
  const name = locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn;
  const businessName =
    locale === 'hi' && item.business.nameHi
      ? item.business.nameHi
      : item.business.nameEn;
  return (
    <article className="grid gap-stack-gap">
      <Link
        href={publicHref('/explore', locale)}
        className="text-primary underline"
      >
        {t('title')}
      </Link>
      <header className="grid gap-2">
        <h1 className="text-h1">{name}</h1>
        <Link
          className="text-primary underline"
          href={publicHref(
            `/${item.business.kind === 'shop' ? 'shop' : 'provider'}/${item.business.slug}`,
            locale,
          )}
        >
          {businessName}
        </Link>
        <div className="flex flex-wrap gap-2">
          {item.verified && (
            <StatusBadge tone="ok" icon="✓" label={t('verified')} />
          )}
          {item.featured && (
            <StatusBadge tone="offer" icon="★" label={t('featured')} />
          )}
          {item.offers && (
            <StatusBadge tone="offer" icon="%" label={t('offers')} />
          )}
        </div>
        {item.area && (
          <p>
            {locale === 'hi' && item.area.nameHi
              ? item.area.nameHi
              : item.area.nameEn}
          </p>
        )}
        {item.rating !== null && (
          <p>
            {t('ratingSummary', {
              rating: item.rating,
              count: item.reviewCount,
            })}
          </p>
        )}
        <p className="text-h2 font-semibold">
          {item.pricePaise === null
            ? t('priceOnEnquiry')
            : item.priceType === 'range' && item.priceMaxPaise !== null
              ? t('priceRange', {
                  min: formatMoney(item.pricePaise, locale),
                  max: formatMoney(item.priceMaxPaise, locale),
                })
              : item.priceType === 'from'
                ? t('fromPrice', {
                    price: formatMoney(item.pricePaise, locale),
                  })
                : formatMoney(item.pricePaise, locale)}
        </p>
        {'inventory' in result.data && (
          <AddToCart
            productId={item.id}
            name={name}
            purchasable={item.pricePaise !== null}
            variants={result.data.variants}
            inventory={result.data.inventory}
          />
        )}
        {item.kind === 'service' && (
          <>
            <a
              href="#svenq"
              className={`${buttonVariantClassName('primary')} tablet:justify-self-start`}
            >
              <NavIcon name="send" className="size-4.5" />
              {enquiry('cta')}
            </a>
            <p className="m-0 flex min-w-0 items-start gap-3 rounded-md border border-info bg-info-soft px-3.5 py-3 text-small text-text">
              <span aria-hidden="true" className="shrink-0">
                ℹ️
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {enquiry('notice')}
              </span>
            </p>
          </>
        )}
      </header>
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.path}>
              <img
                src={image.path}
                alt={t('imageOf', { name, number: index + 1 })}
                width={image.width}
                height={image.height}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="aspect-square size-full rounded-md object-cover"
              />
            </li>
          ))}
        </ul>
      )}
      {description && (
        <Card padded>
          <p className="whitespace-pre-wrap">{description}</p>
        </Card>
      )}
      {'included' in result.data && (
        <>
          {result.data.included.length > 0 && (
            <Card padded>
              <h2 className="text-h3">{t('included')}</h2>
              <ul className="list-inside list-disc">
                {result.data.included.map((value, index) => (
                  <li key={index}>{value}</li>
                ))}
              </ul>
            </Card>
          )}
          {result.data.excluded.length > 0 && (
            <Card padded>
              <h2 className="text-h3">{t('excluded')}</h2>
              <ul className="list-inside list-disc">
                {result.data.excluded.map((value, index) => (
                  <li key={index}>{value}</li>
                ))}
              </ul>
            </Card>
          )}
          {result.data.serviceArea && (
            <p>{t('serviceArea', { area: result.data.serviceArea })}</p>
          )}
          {result.data.experienceYears !== null && (
            <p>{t('experience', { years: result.data.experienceYears })}</p>
          )}
        </>
      )}
      {'orderability' in result.data && !result.data.orderability.orderable && (
        <p role="status">{t('orderingUnavailable')}</p>
      )}
      <LinkedVideosStrip targetType={item.kind} targetId={item.id} />
      {item.kind === 'service' && (
        <EnquiryForm serviceId={item.id} serviceName={name} />
      )}
      {item.phone && (
        <a
          className={`${buttonClassName} justify-self-start`}
          href={`tel:${item.phone}`}
          aria-label={`${t('call')} ${name}`}
        >
          {t('call')}
        </a>
      )}
      {item.kind === 'service' && <ServiceBookmarkAction serviceId={item.id} />}
    </article>
  );
}
