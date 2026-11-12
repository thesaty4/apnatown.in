import Link from 'next/link';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { Category, Subcategory } from '@apnatown/shared/catalog';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { getWebEnvironment } from '../../shared/config/server';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import {
  CatalogSection,
  TileGrid,
  catalogName,
  categoryPath,
  categoryTiles,
  exploreHref,
} from './parts';

const chipClassName =
  'inline-flex min-h-touch max-w-full items-center gap-field-gap rounded-pill border-(length:--at-chip-border) px-field-inline py-1 text-chip font-medium no-underline [overflow-wrap:anywhere] focus-visible:ring-focus';

/** JSON-LD is data, not script: escape every HTML-significant character. */
function JsonLd({ data, nonce }: { data: unknown; nonce: string | undefined }) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

/**
 * S-CUST-05 category landing (also the subcategory route). Taxonomy only:
 * the Search-owned result list, filters and facet counts render in `results`
 * once that slice exists; nothing is faked here.
 */
export async function CategoryLanding({
  locale,
  category,
  subcategories,
  current,
  others,
  results,
}: {
  locale: Locale;
  category: Category;
  /** Active subcategories of the category, API order. */
  subcategories: readonly Subcategory[];
  /** Set on `/category/[slug]/[subcategorySlug]`. */
  current?: Subcategory | undefined;
  /** Other active categories of the same kind. */
  others: readonly Category[];
  results?: ReactNode;
}) {
  const t = await getTranslations('catalog.categories');
  const origin = new URL(getWebEnvironment().APP_BASE_URL).origin;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const name = catalogName(category, locale);
  const image = current?.image ?? category.image;
  const currentName = current && catalogName(current, locale);
  const path = categoryPath(category.slug, current?.slug);
  const url = (route: string) => `${origin}${publicHref(route, locale)}`;
  const crumbs = [
    { name: t('home'), href: publicHref('/', locale) },
    { name, href: publicHref(categoryPath(category.slug), locale) },
    ...(current && currentName
      ? [{ name: currentName, href: publicHref(path, locale) }]
      : []),
  ];
  const listed = current ? [] : subcategories;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: currentName ? `${currentName} - ${name}` : name,
        url: url(path),
        inLanguage: locale === 'hi' ? 'hi-IN' : 'en-IN',
        ...(listed.length && {
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: listed.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: catalogName(item, locale),
              url: url(categoryPath(category.slug, item.slug)),
            })),
          },
        }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `${origin}${crumb.href}`,
        })),
      },
    ],
  };

  return (
    <div className="grid min-w-0 gap-stack-gap">
      <JsonLd data={jsonLd} nonce={nonce} />
      <nav aria-label={t('breadcrumbs')}>
        <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-small text-text-2">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={crumb.href} className="flex min-w-0 items-center gap-1">
                {index > 0 && <span aria-hidden="true">›</span>}
                {last ? (
                  <span
                    aria-current="page"
                    className="[overflow-wrap:anywhere]"
                  >
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="inline-flex min-h-touch items-center underline [overflow-wrap:anywhere]"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <header className="flex flex-wrap items-center gap-3">
        <Avatar
          label=""
          emoji={category.icon || '🏷️'}
          {...(image ? { src: image.publicUrl } : {})}
        />
        <div className="grid min-w-0 flex-1 gap-1">
          <h1 className="text-h1 [overflow-wrap:anywhere]">
            {currentName ?? name}
          </h1>
          {currentName && (
            <p className="text-text-2 [overflow-wrap:anywhere]">{name}</p>
          )}
        </div>
        <Link
          href={exploreHref(
            category.kind,
            locale,
            category.slug,
            current?.slug,
          )}
          className={buttonClassName}
        >
          {t(category.kind === 'service' ? 'exploreServices' : 'explore')}
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      {subcategories.length ? (
        <nav aria-label={t('subcategories')}>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {[undefined, ...subcategories].map((item) => {
              const selected = item ? item.id === current?.id : !current;
              return (
                <li key={item?.id ?? 'all'} className="min-w-0">
                  <Link
                    href={publicHref(
                      categoryPath(category.slug, item?.slug),
                      locale,
                    )}
                    aria-current={selected ? 'page' : undefined}
                    className={`${chipClassName} ${selected ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface text-text'}`}
                  >
                    {selected && <span aria-hidden="true">✓</span>}
                    {item ? catalogName(item, locale) : t('allSubcategories')}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : (
        <EmptyState
          title={t('emptyCategoryTitle')}
          message={t('tryAnother')}
          action={
            <Link
              href={exploreHref(category.kind, locale, category.slug)}
              className={buttonClassName}
            >
              {t(category.kind === 'service' ? 'exploreServices' : 'explore')}
            </Link>
          }
        />
      )}

      {results}

      {others.length > 0 && (
        <CatalogSection id="other-categories" title={t('otherCategories')}>
          <TileGrid
            label={t('otherCategories')}
            tiles={categoryTiles(others, locale, (item) =>
              publicHref(categoryPath(item.slug), locale),
            )}
          />
        </CatalogSection>
      )}
    </div>
  );
}
