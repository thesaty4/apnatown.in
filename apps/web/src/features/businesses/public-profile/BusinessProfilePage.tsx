import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { Category } from '@apnatown/shared/catalog';
import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';
import { ErrorState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { maintenanceHref } from '../../../shared/api/maintenance';
import { mapConfiguration } from '../../../shared/config/maps';
import { getWebEnvironment } from '../../../shared/config/server';
import { publicHref } from '../../../shared/i18n/preferences';
import { JsonLd } from '../../../shared/ui/JsonLd';
import { RetryButton } from '../../../shared/ui/RetryButton';
import { readCategories } from '../../catalog/server';
import { currentLocale } from '../../support/metadata';
import { AboutPanel } from './AboutPanel';
import { ContactPanel } from './ContactPanel';
import { ProfileActions } from './ProfileActions';
import { ProfileHeader, type HeaderCategory } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { GalleryGrid, VideoGrid } from '../../gallery';
import { ReviewsSection } from '../../reviews';
import { ComingSoonPanel } from './StaticPanels';
import { localBusinessJsonLd } from './json-ld';
import { readProviderExpertise, readPublicBusiness, type ProfileKind } from './read';

/**
 * S-CUST-06 shop / S-CUST-07 provider unified public profile. Server shell
 * (header, actions, static panels); only tabs/pills/listings, share, map and
 * QR are client islands. The API returns 404 for missing and not-live alike.
 */
export async function BusinessProfilePage({ kind, slug }: { kind: ProfileKind; slug: string }) {
  const path = `/${kind}/${slug}`;
  const [result, locale] = await Promise.all([readPublicBusiness(slug), currentLocale()]);
  if (result.kind === 'error') {
    if (result.code.endsWith('_NOT_FOUND')) notFound();
    if (result.code === 'MAINTENANCE') redirect(maintenanceHref(path, locale === 'hi'));
    if (['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE'].includes(result.code)) {
      const permission = await getTranslations('common.noPermission');
      return <NoPermissionState title={permission('title')} message={permission('message')} action={null} />;
    }
    const t = await getTranslations('business.publicProfile');
    return (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={<RetryButton>{t('retry')}</RetryButton>}
      />
    );
  }
  const detail = result.data;
  const { item, profile } = detail;
  if (item.path !== path) {
    // Same slug under the other profile kind: send to its canonical route.
    if (item.path === `/${kind === 'shop' ? 'provider' : 'shop'}/${slug}`)
      redirect(publicHref(item.path, locale));
    notFound();
  }

  const [expertise, productCategories, serviceCategories, nonce, t] = await Promise.all([
    profile.kind === 'provider'
      ? readProviderExpertise(slug).then((read) => (read.kind === 'ready' ? read.data.items : null))
      : Promise.resolve([]),
    readCategories('product', path, locale),
    readCategories('service', path, locale),
    headers().then((list) => list.get('x-nonce') ?? undefined),
    getTranslations('business'),
  ]);
  const categories: Category[] = [...(productCategories ?? []), ...(serviceCategories ?? [])];
  const name = locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn;
  const headerCategory = pickCategory(detail, categories, locale);
  const environment = getWebEnvironment();
  const href = publicHref(item.path, locale);
  const profileUrl = new URL(href, environment.APP_BASE_URL).toString();

  return (
    <article className="grid min-w-0 gap-stack-gap">
      <JsonLd
        nonce={nonce}
        data={localBusinessJsonLd(detail, { name, url: profileUrl, origin: environment.APP_BASE_URL })}
      />
      <ProfileHeader detail={detail} name={name} category={headerCategory} locale={locale} />
      {profile.temporarilyClosed && (
        <p role="status" className="m-0 flex min-w-0 items-start gap-3 rounded-md border border-error bg-error-soft px-3.5 py-3 text-text">
          <span aria-hidden="true" className="shrink-0">⛔</span>
          <span className="min-w-0 [overflow-wrap:anywhere]">{t('profile.closed')}</span>
        </p>
      )}
      <ProfileActions detail={detail} name={name} locale={locale} />
      <ProfileTabs
        slug={slug}
        kind={profile.kind}
        categories={categories}
        panels={{
          about: <AboutPanel detail={detail} expertise={expertise} locale={locale} />,
          offers: <ComingSoonPanel section="offers" />,
          gallery: <GalleryGrid slug={slug} profilePath={path} businessName={name} />,
          videos: <VideoGrid slug={slug} />,
          reviews: (
            <ReviewsSection
              targetType="business"
              targetId={item.business.id}
              name={name}
              returnPath={path}
            />
          ),
          contact: (
            <ContactPanel
              detail={detail}
              name={name}
              mapConfig={mapConfiguration(environment)}
              profileUrl={profileUrl}
            />
          ),
        }}
      />
    </article>
  );
}

/** Primary product category (with Catalog icon) else the card's category. */
function pickCategory(
  detail: BusinessDiscoveryDetail,
  categories: Category[],
  locale: 'en' | 'hi',
): HeaderCategory | null {
  const source = detail.profile.primaryCategory ?? detail.item.category;
  if (!source) return null;
  const catalog = categories.find((category) => category.slug === source.slug);
  return {
    slug: source.slug,
    name: locale === 'hi' && source.nameHi ? source.nameHi : source.nameEn,
    icon: catalog?.icon ?? null,
  };
}
