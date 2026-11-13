import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import {
  currentLocale,
  publicPageMetadata,
} from '../../../../features/support/metadata';
import { readCategories } from '../../../../features/catalog/server';
import {
  CatalogSection,
  TileGrid,
  categoryTiles,
  exploreHref,
} from '../../../../features/catalog/parts';
import { publicHref } from '../../../../shared/i18n/preferences';

export async function generateMetadata() {
  const t = await getTranslations('catalog.categories');
  return {
    ...(await publicPageMetadata('/services', t('servicesTitle'))),
    description: t('servicesDescription'),
  };
}

/** S-CUST-04 Services home: ISR-cached service categories. Featured providers
 * are Search-owned and are added by that slice; nothing is faked here. */
export default async function ServicesPage() {
  const t = await getTranslations('catalog.categories');
  const locale = await currentLocale();
  const categories = await readCategories('service', '/services', locale);
  const explore = exploreHref('service', locale);
  let body;
  if (!categories)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={
          <Link
            href={publicHref('/services', locale)}
            className={buttonClassName}
          >
            {t('retry')}
          </Link>
        }
      />
    );
  else if (!categories.length)
    body = (
      <EmptyState
        title={t('emptyServicesTitle')}
        message={t('tryAnother')}
        action={
          <Link href={explore} className={buttonClassName}>
            {t('exploreServices')}
          </Link>
        }
      />
    );
  else
    body = (
      <CatalogSection
        id="service-categories"
        title={t('serviceCategories')}
        action={
          <Link
            href={explore}
            className="inline-flex min-h-touch items-center font-semibold text-primary underline"
          >
            {t('exploreServices')}
          </Link>
        }
      >
        <TileGrid
          label={t('serviceCategories')}
          tiles={categoryTiles(categories, locale)}
        />
      </CatalogSection>
    );
  return (
    <div className="grid min-w-0 gap-stack-gap">
      <h1 className="text-h1">{t('servicesTitle')}</h1>
      {body}
    </div>
  );
}
