import Link from 'next/link';
import type { ReactNode } from 'react';
import type {
  Category,
  CategoryKind,
  Subcategory,
  TaxonomyImage,
} from '@apnatown/shared/catalog';
import { CategoryTile } from '@apnatown/ui/cards/CategoryTile';
import { publicHref, type Locale } from '../../shared/i18n/preferences';

type Named = Pick<Category, 'nameEn' | 'nameHi'>;
/** Taxonomy names come from the API in both languages; never translated here. */
export const catalogName = (item: Named, locale: string) =>
  locale === 'hi' ? item.nameHi : item.nameEn;

export const taxonomySrcSet = (image: TaxonomyImage | undefined) =>
  image?.variants.map((variant) => `${variant.path} ${variant.width}w`).join(', ');

/** Explore owns the result lists; Catalog only links with URL filters. */
export function exploreHref(
  kind: CategoryKind,
  locale: Locale,
  category?: string,
  subcategory?: string,
) {
  const query = new URLSearchParams({
    tab: kind === 'service' ? 'services' : 'products',
  });
  if (category) query.set('category', category);
  if (subcategory) query.set('subcategory', subcategory);
  return `${publicHref('/explore', locale)}?${query}`;
}

export const categoryPath = (slug: string, subcategorySlug?: string) =>
  subcategorySlug
    ? `/category/${slug}/${subcategorySlug}`
    : `/category/${slug}`;

const gridClassName =
  'm-0 grid list-none grid-cols-3 gap-2 p-0 tablet:grid-cols-4 desktop:grid-cols-6';

/** Shared tile grid for categories (to Explore) or subcategories. */
export function TileGrid({
  label,
  tiles,
}: {
  /** Accessible list name (usually the visible heading text). */
  label: string;
  tiles: readonly {
    id: string;
    href: string;
    label: string;
    icon?: string | undefined;
    imageSrc?: string | undefined;
    imageSrcSet?: string | undefined;
    imageWidth?: number | undefined;
    imageHeight?: number | undefined;
  }[];
}) {
  return (
    <ul aria-label={label} className={gridClassName}>
      {tiles.map((tile) => (
        <li key={tile.id} className="min-w-0">
          <CategoryTile
            href={tile.href}
            label={tile.label}
            icon={tile.icon}
            imageSrc={tile.imageSrc}
            imageSrcSet={tile.imageSrcSet}
            imageWidth={tile.imageWidth}
            imageHeight={tile.imageHeight}
            linkAs={Link}
          />
        </li>
      ))}
    </ul>
  );
}

export function categoryTiles(
  categories: readonly Category[],
  locale: Locale,
  href: (category: Category) => string = (category) =>
    exploreHref(category.kind, locale, category.slug),
) {
  return categories.map((category) => ({
    id: category.id,
    href: href(category),
    label: catalogName(category, locale),
    icon: category.icon,
    imageSrc: category.image?.path,
    imageSrcSet: taxonomySrcSet(category.image),
    imageWidth: category.image?.width,
    imageHeight: category.image?.height,
  }));
}

export function subcategoryTiles(
  category: Category,
  subcategories: readonly Subcategory[],
  locale: Locale,
  href: (subcategory: Subcategory) => string,
) {
  return subcategories.map((subcategory) => ({
    id: subcategory.id,
    href: href(subcategory),
    label: catalogName(subcategory, locale),
    // Subcategories have no icon field; the parent icon is the fallback art.
    icon: category.icon,
    imageSrc: subcategory.image?.path,
    imageSrcSet: taxonomySrcSet(subcategory.image),
    imageWidth: subcategory.image?.width,
    imageHeight: subcategory.image?.height,
  }));
}

/** Titled section with an optional trailing action (e.g. "All subcategories"). */
export function CatalogSection({
  id,
  title,
  intro,
  action,
  children,
}: {
  id: string;
  title: string;
  intro?: string | null | undefined;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid min-w-0 gap-1">
          <h2 id={id} className="text-h2 [overflow-wrap:anywhere]">
            {title}
          </h2>
          {intro && (
            <p className="text-small text-text-2 [overflow-wrap:anywhere]">
              {intro}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
