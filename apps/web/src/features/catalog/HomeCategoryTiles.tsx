import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Category } from '@apnatown/shared/catalog';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import { readCategories } from './server';
import { CatalogSection, TileGrid, categoryTiles, exploreHref } from './parts';

/** S-CUST-01 Home category tile groups (ISR taxonomy). An empty group is
 * hidden; a failed read shows a retryable error without blocking Home. */
export async function HomeCategoryTiles({ locale }: { locale: Locale }) {
  const t = await getTranslations('catalog.categories');
  const [products, services] = await Promise.all([
    readCategories('product', '/', locale),
    readCategories('service', '/', locale),
  ]);
  if (!products || !services)
    return (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={
          <Link href={publicHref('/', locale)} className={buttonClassName}>
            {t('retry')}
          </Link>
        }
      />
    );
  const group = (
    id: string,
    title: string,
    kind: 'product' | 'service',
    items: Category[],
    more: string,
  ) =>
    items.length > 0 && (
      <CatalogSection
        id={id}
        title={title}
        action={
          <Link
            href={
              kind === 'service'
                ? publicHref('/services', locale)
                : exploreHref(kind, locale)
            }
            className="inline-flex min-h-touch items-center font-semibold text-primary underline"
          >
            {more}
          </Link>
        }
      >
        <TileGrid label={title} tiles={categoryTiles(items, locale)} />
      </CatalogSection>
    );
  return (
    <>
      {group(
        'home-products',
        t('shopByCategory'),
        'product',
        products,
        t('explore'),
      )}
      {group(
        'home-services',
        t('localServices'),
        'service',
        services,
        t('allServices'),
      )}
    </>
  );
}
