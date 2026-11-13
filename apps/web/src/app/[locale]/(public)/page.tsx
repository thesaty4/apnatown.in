import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { LocationBar } from '../../../features/geo/LocationBar';
import { HomeCategoryTiles } from '../../../features/catalog/HomeCategoryTiles';
import { HomeSections } from '../../../features/catalog/HomeSections';
import { HomeBookmarks } from '../../../features/engagement/HomeBookmarks';
import { readCategories } from '../../../features/catalog/server';
import { HomeHero } from '../../../features/offers/public/HomeHero';
import { HomeListings } from '../../../features/search/home/HomeListings';
import { NearbyShops } from '../../../features/search/home/NearbyShops';
import { readSearchHome } from '../../../features/search/server';
import { currentLocale } from '../../../features/support/metadata';
import { publicHref } from '../../../shared/i18n/preferences';

// S-CUST-01 in prototype order: location, category tiles, Search-composed
// Catalog sections, nearby shops (client island over the browse location),
// the public featured/popular listing sections, then the signed-in customer's
// bookmarks. Banners, offers, promotions and recently viewed are not in the
// API yet and render nothing.
export default async function HomePage() {
  const locale = await currentLocale();
  const [t, homeT, home, products, services] = await Promise.all([
    getTranslations('common.app'),
    getTranslations('search.home'),
    readSearchHome(locale),
    // Same cached taxonomy reads as the tiles; card art falls back without it.
    readCategories('product', '/', locale),
    readCategories('service', '/', locale),
  ]);
  const categories = [...(products ?? []), ...(services ?? [])];
  return (
    <>
      <h1 className="sr-only">{t('welcome')}</h1>
      <LocationBar />
      <HomeHero locale={locale} />
      <div className="mt-stack-gap grid min-w-0 gap-stack-gap">
        <HomeCategoryTiles locale={locale} />
        {home ? (
          <>
            <HomeSections sections={home.categorySections} />
            <NearbyShops categories={categories} />
            <HomeListings home={home} locale={locale} categories={categories} />
          </>
        ) : (
          <ErrorState
            title={homeT('errorTitle')}
            message={homeT('errorMessage')}
            action={
              <Link href={publicHref('/', locale)} className={buttonClassName}>
                {homeT('retry')}
              </Link>
            }
          />
        )}
        <HomeBookmarks />
      </div>
    </>
  );
}
