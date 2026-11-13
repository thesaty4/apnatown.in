import type { BusinessKind } from '@apnatown/shared/businesses';
import { ProductStockFilterSchema } from '@apnatown/shared/products';
import { dashboardBase } from '../../businesses/parts';
import type { ProductListFilters } from './api';

/** Search input bound (name/SKU); the API trims and matches substrings. */
export const PRODUCT_QUERY_MAX = 100;

const one = (value: string | string[] | null | undefined) =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

/** Same normalization as the API (`trim`, empty → none); control characters
 * and over-long text are dropped rather than sent. */
export function normalizeQuery(value: string | undefined) {
  const text = (value ?? '').trim().slice(0, PRODUCT_QUERY_MAX);
  // eslint-disable-next-line no-control-regex
  return /[\u0000-\u001F\u007F-\u009F]/u.test(text) ? '' : text;
}

/** URL `?q=&stock=low|out_of_stock`, validated; anything else → defaults. */
export function readProductFilters(
  read: (name: string) => string | string[] | null | undefined,
): ProductListFilters {
  const stock = ProductStockFilterSchema.safeParse(one(read('stock')));
  return {
    stock: stock.success ? stock.data : undefined,
    query: normalizeQuery(one(read('q'))),
  };
}

export function productSearch({ stock, query }: ProductListFilters) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (stock) params.set('stock', stock);
  const value = params.toString();
  return value ? `?${value}` : '';
}

/** Canonical list URL; defaults are omitted so shared links stay short. */
export const productsHref = (
  kind: BusinessKind,
  filters?: ProductListFilters,
) => `${dashboardBase(kind)}/products${filters ? productSearch(filters) : ''}`;

/** Editor URL; the list filters ride along only to rebuild the Back link. */
export const productEditorHref = (
  kind: BusinessKind,
  id: string,
  filters?: ProductListFilters,
) =>
  `${dashboardBase(kind)}/products/${id}${filters ? productSearch(filters) : ''}`;

export const inventoryHref = (kind: BusinessKind) =>
  `${dashboardBase(kind)}/inventory`;
