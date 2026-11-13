import { z } from 'zod';
import { IdSchema } from './wire.js';

/**
 * Owner CSV/XLSX product import (products BE spec, Q-47): bounded,
 * synchronous and all-or-nothing with row-numbered errors. Hard ceilings
 * below are never raised by settings; the effective caps come from the
 * `product_import` setting and import stays disabled until it is configured.
 */

/** Exact template headers (spec "Import schema"); each exactly once. */
export const PRODUCT_IMPORT_HEADERS = Object.freeze([
  'nameEn',
  'nameHi',
  'categoryId',
  'subcategoryId',
  'brand',
  'sku',
  'priceINR',
  'mrpINR',
  'unit',
  'onHand',
  'lowStockThreshold',
  'availableForSale',
  'tags',
] as const);
export const ProductImportHeaderSchema = z.enum(PRODUCT_IMPORT_HEADERS);
export type ProductImportHeader = z.infer<typeof ProductImportHeaderSchema>;

/** Hard ceiling on data rows per file (header excluded). */
export const PRODUCT_IMPORT_MAX_ROWS = 1000;
/** Hard ceiling on uploaded file bytes (2 MiB). */
export const PRODUCT_IMPORT_MAX_BYTES = 2_097_152;
/** Row errors returned in `details.rows`; `details.totalErrors` counts all. */
export const PRODUCT_IMPORT_ERROR_LIMIT = 100;

/**
 * Stable machine codes for `details.rows[].code`; clients localise these.
 * - required: blank required cell
 * - too_long: text longer than the product field allows
 * - invalid_text: angle brackets or control characters
 * - formula_not_allowed: formula cell, or a cell starting with = + - @ tab CR
 * - invalid_price: priceINR/mrpINR not plain decimal INR (≤ 2 decimals)
 * - mrp_below_price: mrpINR lower than priceINR
 * - invalid_number: onHand/lowStockThreshold not a whole number ≥ 0
 * - invalid_boolean: availableForSale not true/false/yes/no/1/0
 * - invalid_id: categoryId/subcategoryId not an id
 * - unknown_category: not an active product category
 * - subcategory_mismatch: not an active subcategory of categoryId
 * - too_many_tags: more tags than a product allows
 * - duplicate_sku: SKU repeated in the file (later rows)
 * - sku_conflict: SKU already used by the business
 * - unexpected_column: value in a column without a header
 * - invalid_value: any other unreadable cell (e.g. a spreadsheet error)
 */
export const PRODUCT_IMPORT_ROW_ERROR_CODES = Object.freeze([
  'required',
  'too_long',
  'invalid_text',
  'formula_not_allowed',
  'invalid_price',
  'mrp_below_price',
  'invalid_number',
  'invalid_boolean',
  'invalid_id',
  'unknown_category',
  'subcategory_mismatch',
  'too_many_tags',
  'duplicate_sku',
  'sku_conflict',
  'unexpected_column',
  'invalid_value',
] as const);
export const ProductImportRowErrorCodeSchema = z.enum(
  PRODUCT_IMPORT_ROW_ERROR_CODES,
);
export type ProductImportRowErrorCode = z.infer<
  typeof ProductImportRowErrorCodeSchema
>;

/** `row` is the 1-based data row (header excluded); `field` null = whole row. */
export const ProductImportRowErrorSchema = z.strictObject({
  row: z.number().int().min(1),
  field: ProductImportHeaderSchema.nullable(),
  code: ProductImportRowErrorCodeSchema,
});
export type ProductImportRowError = z.infer<typeof ProductImportRowErrorSchema>;

/** Settings value for key `product_import`; within the hard ceilings. */
export const ProductImportPolicySchema = z.strictObject({
  enabled: z.boolean(),
  maxRows: z.number().int().min(1).max(PRODUCT_IMPORT_MAX_ROWS),
  maxBytes: z.number().int().min(1).max(PRODUCT_IMPORT_MAX_BYTES),
});
export type ProductImportPolicy = z.infer<typeof ProductImportPolicySchema>;

/** GET /businesses/me/products/import/policy; caps null unless enabled. */
export const ProductImportPolicyResultSchema = z.strictObject({
  enabled: z.boolean(),
  maxRows: z.number().int().min(1).max(PRODUCT_IMPORT_MAX_ROWS).nullable(),
  maxBytes: z.number().int().min(1).max(PRODUCT_IMPORT_MAX_BYTES).nullable(),
  headers: z.array(ProductImportHeaderSchema),
});
export type ProductImportPolicyResult = z.infer<
  typeof ProductImportPolicyResultSchema
>;

/** POST /businesses/me/products/import 200 result (ids in file row order). */
export const ProductImportResultSchema = z.strictObject({
  importedCount: z.number().int().min(1).max(PRODUCT_IMPORT_MAX_ROWS),
  productIds: z.array(IdSchema).min(1).max(PRODUCT_IMPORT_MAX_ROWS),
});
export type ProductImportResult = z.infer<typeof ProductImportResultSchema>;
