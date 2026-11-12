import 'server-only';
import { redirect } from 'next/navigation';
import {
  CategoryDetailSchema,
  CategoryListSchema,
  SubcategoryDetailSchema,
  type CategoryKind,
} from '@apnatown/shared/catalog';
import { createPublicServerApi } from '../../shared/api/server';
import { ApiFailure, unwrap } from '../../shared/api/result';
import { maintenanceHref } from '../../shared/api/maintenance';
import type { Locale } from '../../shared/i18n/preferences';

/** ISR-style data cache; taxonomy changes revalidate `catalog-taxonomy`, the
 * time window bounds staleness. */
const api = () =>
  createPublicServerApi({ revalidate: 300, tags: ['catalog-taxonomy'] });

async function read<T>(
  path: string,
  locale: Locale,
  load: () => Promise<T>,
  missing: readonly string[] = [],
): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiFailure) {
      if (missing.includes(error.code) || error.status === 404) return null;
      if (error.code === 'MAINTENANCE')
        redirect(maintenanceHref(path, locale === 'hi'));
    }
    throw error;
  }
}

/** Active categories of one kind, ordered by the API; null when the read
 * failed so the page can show its error state instead of an empty group. */
export async function readCategories(
  kind: CategoryKind,
  path: string,
  locale: Locale,
) {
  try {
    const list = await read(path, locale, async () =>
      unwrap(
        await api().GET('/catalog/categories', {
          params: { query: { kind } },
        }),
        CategoryListSchema,
      ),
    );
    return (list?.items ?? []).filter((category) => category.active);
  } catch (error) {
    if (error instanceof ApiFailure) return null;
    throw error; // Includes the maintenance redirect.
  }
}

/** Active category + active subcategories, or null (route 404s). */
export async function readCategory(slug: string, locale: Locale) {
  const detail = await read(
    `/category/${slug}`,
    locale,
    async () =>
      unwrap(
        await api().GET('/catalog/categories/{slug}', {
          params: { path: { slug } },
        }),
        CategoryDetailSchema,
      ),
    ['CATEGORY_NOT_FOUND', 'VALIDATION_ERROR', 'COMMON_VALIDATION_FAILED'],
  );
  if (!detail?.category.active || detail.category.slug !== slug) return null;
  return {
    category: detail.category,
    subcategories: detail.subcategories.filter((item) => item.active),
  };
}

/** Active parent/child pair, or null for inactive/mismatched (noindex 404). */
export async function readSubcategory(
  slug: string,
  subcategorySlug: string,
  locale: Locale,
) {
  const detail = await read(
    `/category/${slug}/${subcategorySlug}`,
    locale,
    async () =>
      unwrap(
        await api().GET(
          '/catalog/categories/{slug}/subcategories/{subcategorySlug}',
          { params: { path: { slug, subcategorySlug } } },
        ),
        SubcategoryDetailSchema,
      ),
    [
      'CATEGORY_NOT_FOUND',
      'SUBCATEGORY_NOT_FOUND',
      'VALIDATION_ERROR',
      'COMMON_VALIDATION_FAILED',
    ],
  );
  if (
    !detail?.category.active ||
    !detail.subcategory.active ||
    detail.category.slug !== slug ||
    detail.subcategory.slug !== subcategorySlug ||
    detail.subcategory.categoryId !== detail.category.id
  )
    return null;
  return detail;
}
