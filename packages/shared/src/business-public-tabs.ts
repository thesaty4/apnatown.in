import { z } from 'zod';
import { CatalogSlugSchema } from './catalog.js';
import { ExploreCardSchema } from './discovery.js';
import { CountSchema, CursorSchema, IdSchema, PageQuerySchema } from './wire.js';

/**
 * Public business profile tabs (S-CUST-06/07). Items reuse the Explore card
 * projection; pills/facets carry both locales so one cached response serves
 * EN and HI. Counts are preselection counts of the business's public items.
 */
export const BusinessPublicProductsQuerySchema = PageQuerySchema.extend({
  /** Subcategory slug; an unknown slug yields an empty page, not an error. */
  subcategory: CatalogSlugSchema.optional(),
});
export type BusinessPublicProductsQuery = z.infer<typeof BusinessPublicProductsQuerySchema>;

export const BusinessPublicProductPillSchema = z.strictObject({
  subcategoryId: IdSchema,
  slug: CatalogSlugSchema,
  /** Owner label override, else the Catalog name. */
  labelEn: z.string().min(1),
  labelHi: z.string().min(1),
  /** Public products of this business in the subcategory (before filtering). */
  count: CountSchema,
  /** 0-based display order: owner pill order, then Catalog order. */
  position: z.number().int().nonnegative(),
});
export type BusinessPublicProductPill = z.infer<typeof BusinessPublicProductPillSchema>;

export const BusinessPublicProductsResponseSchema = z.strictObject({
  items: z.array(ExploreCardSchema.extend({ kind: z.literal('product') })).max(50),
  nextCursor: CursorSchema.nullable(),
  pills: z.array(BusinessPublicProductPillSchema),
});
export type BusinessPublicProductsResponse = z.infer<typeof BusinessPublicProductsResponseSchema>;

export const BusinessPublicServicesQuerySchema = PageQuerySchema.extend({
  /** Service category slug (globally unique). */
  category: CatalogSlugSchema.optional(),
  /** Subcategory slug, scoped by `category` when both are supplied. */
  subcategory: CatalogSlugSchema.optional(),
});
export type BusinessPublicServicesQuery = z.infer<typeof BusinessPublicServicesQuerySchema>;

export const BusinessPublicServiceCategorySchema = z.strictObject({
  id: IdSchema,
  slug: CatalogSlugSchema,
  labelEn: z.string().min(1),
  labelHi: z.string().min(1),
  /** Active services of this business in the category; ignores filters. */
  count: CountSchema,
});
export const BusinessPublicServiceSubcategorySchema = BusinessPublicServiceCategorySchema.extend({
  categoryId: IdSchema,
  /** Respects the `category` filter only. */
  count: CountSchema,
});

export const BusinessPublicServicesResponseSchema = z.strictObject({
  items: z.array(ExploreCardSchema.extend({ kind: z.literal('service') })).max(50),
  nextCursor: CursorSchema.nullable(),
  categories: z.array(BusinessPublicServiceCategorySchema),
  subcategories: z.array(BusinessPublicServiceSubcategorySchema),
});
export type BusinessPublicServicesResponse = z.infer<typeof BusinessPublicServicesResponseSchema>;
