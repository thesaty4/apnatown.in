import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CatalogSlugSchema } from '@apnatown/shared/catalog';
import {
  ProductPublicSchema,
  ServicePublicSchema,
} from '@apnatown/shared/public-listings';
import { ErrorState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { createPublicServerApi } from '../../shared/api/server';
import { resource, unwrap } from '../../shared/api/result';
import { maintenanceHref } from '../../shared/api/maintenance';
import {
  currentLocale,
  noindex,
  publicPageMetadata,
} from '../support/metadata';
import { RetryButton } from '../../shared/ui/RetryButton';
import { ProductDetail } from './ProductDetail';
import { ServiceDetail } from './ServiceDetail';

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
  const { item } = result.data;
  if (item.path !== `/${kind}/${slug}`) notFound();
  if (kind === 'product' && 'inventory' in result.data)
    return <ProductDetail data={result.data} locale={locale} />;
  if (kind === 'service' && 'included' in result.data)
    return <ServiceDetail data={result.data} locale={locale} />;
  notFound();
}
