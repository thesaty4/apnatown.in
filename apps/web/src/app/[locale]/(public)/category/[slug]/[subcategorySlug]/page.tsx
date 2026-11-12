import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CatalogSlugSchema } from '@apnatown/shared/catalog';
import {
  currentLocale,
  noindex,
  publicPageMetadata,
} from '../../../../../../features/support/metadata';
import {
  readCategories,
  readCategory,
  readSubcategory,
} from '../../../../../../features/catalog/server';
import { CategoryLanding } from '../../../../../../features/catalog/CategoryLanding';
import { catalogName } from '../../../../../../features/catalog/parts';
import { Suspense } from 'react';
import { ExploreResults, type ExploreSearchParams } from '../../../../../../features/explore/ExploreResults';

type Props = { params: Promise<{ slug: string; subcategorySlug: string }>; searchParams: Promise<ExploreSearchParams> };

async function load(slug: string, subcategorySlug: string) {
  if (
    !CatalogSlugSchema.safeParse(slug).success ||
    !CatalogSlugSchema.safeParse(subcategorySlug).success
  )
    return null;
  return readSubcategory(slug, subcategorySlug, await currentLocale());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subcategorySlug } = await params;
  const detail = await load(slug, subcategorySlug);
  if (!detail) return noindex;
  const locale = await currentLocale();
  const t = await getTranslations('catalog.categories');
  const name = catalogName(detail.subcategory, locale);
  const category = catalogName(detail.category, locale);
  const base = await publicPageMetadata(
    detail.canonicalPath,
    t('subcategorySeoTitle', { name, category }),
  );
  return {
    ...base,
    description: t('subcategorySeoDescription', { name, category }),
    // Indexable only with eligible public results (Search-owned, not built
    // yet): keep follow, withhold index until that slice confirms results.
    robots: { index: false, follow: true },
  };
}

/** S-CUST-05 reused for a subcategory; mismatched/inactive pairs → 404. */
export default async function SubcategoryPage({ params, searchParams }: Props) {
  const { slug, subcategorySlug } = await params;
  const detail = await load(slug, subcategorySlug);
  if (!detail) notFound();
  const locale = await currentLocale();
  const parent = await readCategory(slug, locale);
  if (!parent) notFound();
  const others =
    (await readCategories(
      detail.category.kind,
      detail.canonicalPath,
      locale,
    )) ?? [];
  return (
    <CategoryLanding
      locale={locale}
      category={detail.category}
      subcategories={parent.subcategories}
      current={detail.subcategory}
      others={others.filter((item) => item.id !== detail.category.id)}
      results={<Suspense><ExploreResults screen="category" path={detail.canonicalPath} searchParams={searchParams}
        defaults={{ tab: detail.category.kind === 'service' ? 'services' : 'products', category: slug, subcategory: subcategorySlug }} /></Suspense>}
    />
  );
}
