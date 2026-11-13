import { getTranslations } from 'next-intl/server';
import type { Category } from '@apnatown/shared/catalog';
import type { SearchHome, SearchHomeCardSection } from '@apnatown/shared/search';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';
import { HomeListingSection } from './HomeListingSection';
import { homeExploreHref } from './links';

/** Only a successful nonempty owner projection renders (`empty`,
 * `unavailable` and `location_required` are omitted on Home). */
const ready = (section: SearchHomeCardSection) =>
  section.state === 'ok' ? section.items : [];

/**
 * S-CUST-01 location-free listing sections from the public SSR
 * `GET /search/home`, in prototype `js4.js` V.home order after Nearby shops:
 * featured businesses (HM7), popular businesses (HM8), featured products
 * (HM9), popular service providers (HM10). Popularity is `unavailable` until
 * Q-57, so HM8/HM10 render nothing rather than a fabricated ranking.
 */
export async function HomeListings({
  home,
  locale,
  categories,
}: {
  home: SearchHome;
  locale: Locale;
  categories: Category[];
}) {
  const t = await getTranslations('search.home');
  const shared = { locale, categories };
  return (
    <>
      <HomeListingSection
        {...shared}
        id="home-featured-businesses"
        title={t('featuredBusinesses')}
        viewAll={{
          href: homeExploreHref(locale, { tab: 'shops', featured: 'true' }),
          label: t('viewAllBusinesses'),
        }}
        tab="shops"
        layout="wideRail"
        items={ready(home.featuredBusinesses)}
      />
      <HomeListingSection
        {...shared}
        id="home-popular-businesses"
        title={t('popularBusinesses')}
        viewAll={{
          href: homeExploreHref(locale, { tab: 'shops' }),
          label: t('seeAll'),
        }}
        tab="shops"
        layout="wideRail"
        items={ready(home.popularBusinesses)}
      />
      <HomeListingSection
        {...shared}
        id="home-featured-products"
        title={t('featuredProducts')}
        viewAll={{
          href: homeExploreHref(locale, { tab: 'products', featured: 'true' }),
          label: t('viewAllProducts'),
        }}
        tab="products"
        layout="rail"
        items={ready(home.featuredProducts)}
      />
      <HomeListingSection
        {...shared}
        id="home-popular-providers"
        title={t('popularProviders')}
        viewAll={{ href: publicHref('/services', locale), label: t('seeAll') }}
        tab="services"
        layout="grid"
        items={ready(home.popularProviders)}
      />
    </>
  );
}
