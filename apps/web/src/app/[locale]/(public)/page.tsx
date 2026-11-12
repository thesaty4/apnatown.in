import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { LocationBar } from '../../../features/geo/LocationBar';
import { HomeCategoryTiles } from '../../../features/catalog/HomeCategoryTiles';
import { HomeSections } from '../../../features/catalog/HomeSections';
import { HomeBookmarks } from '../../../features/engagement/HomeBookmarks';
import { readSearchHome } from '../../../features/search/server';
import { currentLocale } from '../../../features/support/metadata';
import { publicHref } from '../../../shared/i18n/preferences';

// S-CUST-01 in prototype order: location, category tiles, Search-composed
// Catalog sections, then the signed-in customer's bookmarks. Offers, shops,
// products, providers and recently viewed join when their modules exist.
export default async function HomePage() {
  const locale = await currentLocale();
  const [t, catalog, home] = await Promise.all([
    getTranslations('common.app'),
    getTranslations('catalog.categories'),
    readSearchHome(locale),
  ]);
  return (
    <>
      <h1 className="sr-only">{t('welcome')}</h1>
      <LocationBar />
      <div className="grid min-w-0 gap-stack-gap">
        <HomeCategoryTiles locale={locale} />
        {home ? (
          <HomeSections sections={home.categorySections} />
        ) : (
          <ErrorState
            title={catalog('errorTitle')}
            message={catalog('errorMessage')}
            action={
              <Link href={publicHref('/', locale)} className={buttonClassName}>
                {catalog('retry')}
              </Link>
            }
          />
        )}
        <HomeBookmarks />
      </div>
    </>
  );
}
