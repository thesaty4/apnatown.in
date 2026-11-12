import { z } from 'zod';
import { CatalogHomeSectionSchema } from './catalog.js';
import { LocaleSchema } from './users.js';

export const SearchHomeQuerySchema = z.strictObject({
  locale: LocaleSchema.default('en'),
});
export type SearchHomeQuery = z.infer<typeof SearchHomeQuerySchema>;

/**
 * `GET /search/home` composition. Only sections whose owning module exists
 * are present; Offers/Products/Businesses discovery sections are added when
 * those modules ship (never fabricated).
 */
export const SearchHomeSchema = z.strictObject({
  /** Catalog-owned dedicated/curated category sections, in position order. */
  categorySections: z.array(CatalogHomeSectionSchema),
});
export type SearchHome = z.infer<typeof SearchHomeSchema>;
