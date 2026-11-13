import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogSlugSchema } from '@apnatown/shared/catalog';
import {
  currentLocale,
  noindex,
  publicPageMetadata,
} from '../../../../../features/support/metadata';
import {
  readCategories,
  readCategory,
} from '../../../../../features/catalog/server';
import { CategoryLanding } from '../../../../../features/catalog/CategoryLanding';
import { catalogName } from '../../../../../features/catalog/parts';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ExploreResults, type ExploreSearchParams } from '../../../../../features/explore/ExploreResults';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ExploreSearchParams> };

async function load(slug: string) {
  if (!CatalogSlugSchema.safeParse(slug).success) return null;
  return readCategory(slug, await currentLocale());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) return noindex;
  const locale = await currentLocale();
  const t = await getTranslations('catalog.categories');
  const name = catalogName(detail.category, locale);
  return {
    ...(await publicPageMetadata(`/category/${slug}`, t('seoTitle', { name }))),
    description: t('seoDescription', { name }),
  };
}

/** S-CUST-05 category landing: ISR taxonomy; inactive/unknown → noindex 404. */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) notFound();
  const locale = await currentLocale();
  const others =
    (await readCategories(detail.category.kind, `/category/${slug}`, locale)) ??
    [];
  return (
    <CategoryLanding
      locale={locale}
      category={detail.category}
      subcategories={detail.subcategories}
      others={others.filter((item) => item.id !== detail.category.id)}
      results={<Suspense><ExploreResults screen="category" path={`/category/${slug}`} searchParams={searchParams}
        defaults={{ tab: detail.category.kind === 'service' ? 'services' : 'products', category: slug }} /></Suspense>}
    />
  );
}
