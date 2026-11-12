import { cache } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CatalogSlugSchema } from '@apnatown/shared/catalog';
import { ProductPublicSchema, ServicePublicSchema, BusinessDiscoveryDetailSchema } from '@apnatown/shared/public-listings';
import { formatMoney } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import { ErrorState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { createPublicServerApi } from '../../shared/api/server';
import { resource, unwrap } from '../../shared/api/result';
import { maintenanceHref } from '../../shared/api/maintenance';
import { publicHref } from '../../shared/i18n/preferences';
import { currentLocale, noindex, publicPageMetadata } from '../support/metadata';
import { RetryListing } from './RetryListing';

type ListingKind = 'product' | 'service' | 'shop' | 'provider';
const readListing = cache(async (kind: ListingKind, slug: string) => {
  if (!CatalogSlugSchema.safeParse(slug).success) notFound();
  const api = createPublicServerApi();
  return resource(async () => {
    if (kind === 'product') return unwrap(await api.GET('/products/{slug}', { params: { path: { slug } } }), ProductPublicSchema);
    if (kind === 'service') return unwrap(await api.GET('/services/{slug}', { params: { path: { slug } } }), ServicePublicSchema);
    return unwrap(await api.GET('/businesses/public/{slug}', { params: { path: { slug } } }), BusinessDiscoveryDetailSchema);
  });
});

export async function listingMetadata(kind: ListingKind, slug: string) {
  const result = await readListing(kind, slug);
  if (result.kind !== 'ready' || result.data.item.path !== `/${kind}/${slug}`) return noindex;
  const locale = await currentLocale();
  const name = locale === 'hi' && result.data.item.nameHi ? result.data.item.nameHi : result.data.item.nameEn;
  return publicPageMetadata(result.data.item.path, name);
}

export async function PublicListingPage({ kind, slug }: { kind: ListingKind; slug: string }) {
  const result = await readListing(kind, slug);
  const locale = await currentLocale();
  const t = await getTranslations('explore.screen');
  if (result.kind === 'error') {
    if (result.code.endsWith('_NOT_FOUND')) notFound();
    if (result.code === 'MAINTENANCE') redirect(maintenanceHref(`/${kind}/${slug}`, locale === 'hi'));
    if (['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE'].includes(result.code)) {
      const permission = await getTranslations('common.noPermission');
      return <NoPermissionState title={permission('title')} message={permission('message')} action={null} />;
    }
    return <ErrorState title={t('errorTitle')} message={t('errorMessage')} action={<RetryListing />} />;
  }
  const { item, description, images } = result.data;
  if (item.path !== `/${kind}/${slug}`) notFound();
  const name = locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn;
  const businessName = locale === 'hi' && item.business.nameHi ? item.business.nameHi : item.business.nameEn;
  return <article className="grid gap-stack-gap">
    <Link href={publicHref('/explore', locale)} className="text-primary underline">{t('title')}</Link>
    <header className="grid gap-2">
      <h1 className="text-h1">{name}</h1>
      {item.kind !== 'shop' && <Link className="text-primary underline"
        href={publicHref(`/${item.business.kind === 'shop' ? 'shop' : 'provider'}/${item.business.slug}`, locale)}>{businessName}</Link>}
      <div className="flex flex-wrap gap-2">
        {item.verified && <StatusBadge tone="ok" icon="✓" label={t('verified')} />}
        {item.featured && <StatusBadge tone="offer" icon="★" label={t('featured')} />}
        {item.offers && <StatusBadge tone="offer" icon="%" label={t('offers')} />}
      </div>
      {item.area && <p>{locale === 'hi' && item.area.nameHi ? item.area.nameHi : item.area.nameEn}</p>}
      {item.rating !== null && <p>{t('ratingSummary', { rating: item.rating, count: item.reviewCount })}</p>}
      {item.kind !== 'shop' && <p className="text-h2 font-semibold">{item.pricePaise === null ? t('priceOnEnquiry')
        : item.priceType === 'range' && item.priceMaxPaise !== null ? t('priceRange', { min: formatMoney(item.pricePaise, locale), max: formatMoney(item.priceMaxPaise, locale) })
          : item.priceType === 'from' ? t('fromPrice', { price: formatMoney(item.pricePaise, locale) }) : formatMoney(item.pricePaise, locale)}</p>}
    </header>
    {images.length > 0 && <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
      {images.map((image, index) => <li key={image.path}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.path} alt={t('imageOf', { name, number: index + 1 })} width={image.width} height={image.height}
          loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="aspect-square size-full rounded-md object-cover" />
      </li>)}
    </ul>}
    {description && <Card padded><p className="whitespace-pre-wrap">{description}</p></Card>}
    {'included' in result.data && <>
      {result.data.included.length > 0 && <Card padded><h2 className="text-h3">{t('included')}</h2><ul className="list-inside list-disc">{result.data.included.map((value, index) => <li key={index}>{value}</li>)}</ul></Card>}
      {result.data.excluded.length > 0 && <Card padded><h2 className="text-h3">{t('excluded')}</h2><ul className="list-inside list-disc">{result.data.excluded.map((value, index) => <li key={index}>{value}</li>)}</ul></Card>}
      {result.data.serviceArea && <p>{t('serviceArea', { area: result.data.serviceArea })}</p>}
      {result.data.experienceYears !== null && <p>{t('experience', { years: result.data.experienceYears })}</p>}
    </>}
    {'hours' in result.data && result.data.hours.length > 0 && <Card padded>
      <h2 className="text-h3">{t('businessHours')}</h2>
      <dl className="grid gap-2">{result.data.hours.map((day) => <div key={day.dayOfWeek} className="flex flex-wrap justify-between gap-2">
        <dt>{t(`day.${day.dayOfWeek}`)}</dt><dd>{day.isClosed ? t('closed') : t('hoursRange', { opens: day.opensAt ?? '', closes: day.closesAt ?? '' })}</dd>
      </div>)}</dl>
    </Card>}
    {'orderability' in result.data && !result.data.orderability.orderable && <p role="status">{t('orderingUnavailable')}</p>}
    {item.phone && <a className={`${buttonClassName} justify-self-start`} href={`tel:${item.phone}`} aria-label={`${t('call')} ${name}`}>{t('call')}</a>}
  </article>;
}
