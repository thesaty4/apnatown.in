import { z } from 'zod';
import { PRODUCT_BULK_LIMIT, plain } from './product-fields.js';
import { IdSchema } from './wire.js';

/** Customer-facing product pill preferences; taxonomy itself never changes. */
export const ProductPillInputSchema = z.strictObject({
  subcategoryId: IdSchema,
  position: z.number().int().min(0).max(10000),
  labelEn: plain(1, 40).nullable().optional(),
  labelHi: plain(1, 40).nullable().optional(),
  hidden: z.boolean(),
});
export const ProductPillsReplaceSchema = z.strictObject({
  items: z.array(ProductPillInputSchema).max(PRODUCT_BULK_LIMIT),
});
export type ProductPillsReplace = z.infer<typeof ProductPillsReplaceSchema>;
export const ProductPillSchema = z.strictObject({
  subcategoryId: IdSchema,
  categoryId: IdSchema,
  slug: z.string().min(1),
  position: z.number().int().min(0),
  /** Owner override; null uses the catalog label. */
  labelEn: z.string().nullable(),
  labelHi: z.string().nullable(),
  catalogNameEn: z.string().min(1),
  catalogNameHi: z.string().min(1),
  hidden: z.boolean(),
  /** False when the row is a catalog default with no saved preference. */
  configured: z.boolean(),
});
export type ProductPill = z.infer<typeof ProductPillSchema>;
export const ProductPillsSchema = z.strictObject({
  items: z.array(ProductPillSchema),
});
export type ProductPills = z.infer<typeof ProductPillsSchema>;
