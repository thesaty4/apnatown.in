import { z } from 'zod';
import {
  CursorSchema,
  IdSchema,
  LimitSchema,
  PaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import {
  PRODUCT_BULK_LIMIT,
  PRODUCT_MEDIA_LIMIT,
  PRODUCT_RESTOCK_TARGET,
  STOCK_MAX,
  multiline,
  plain,
} from './product-fields.js';

/**
 * Products owner wire contracts (F-VD-004/005/009, F-PV-005; S-VEND-05/06/08,
 * S-PROV-06/07). Money is integer paise; the owner business is always resolved
 * server-side from the session, never from a body field. Text caps below are
 * input-size bounds. TODO(verify): no product maximums are specified.
 */

export {
  PRODUCT_BULK_LIMIT,
  PRODUCT_DEFAULT_LOW_STOCK_THRESHOLD,
  PRODUCT_DEFAULT_STOCK,
  PRODUCT_MARK_IN_STOCK_QUANTITY,
  PRODUCT_MEDIA_LIMIT,
  PRODUCT_RESTOCK_TARGET,
} from './product-fields.js';
export * from './product-pills.js';
export * from './product-import.js';

export const StockQuantitySchema = z.number().int().min(0).max(STOCK_MAX);
export const ProductSpecSchema = z.strictObject({
  label: plain(1, 60),
  value: plain(1, 200),
});
export const ProductVariantInputSchema = z.strictObject({
  id: IdSchema.optional(),
  label: plain(1, 60),
});
export const ProductMediaItemSchema = z.strictObject({
  assetId: IdSchema,
  showInGallery: z.boolean(),
});
export type ProductMediaItem = z.infer<typeof ProductMediaItemSchema>;
/** Write item; an omitted gallery flag defaults from the business setting. */
export const ProductMediaInputSchema = z.strictObject({
  assetId: IdSchema,
  showInGallery: z.boolean().optional(),
});
export type ProductMediaInput = z.infer<typeof ProductMediaInputSchema>;

const inventoryFields = {
  onHand: StockQuantitySchema.optional(),
  lowStockThreshold: StockQuantitySchema.optional(),
  availableForSale: z.boolean().optional(),
};
const productFields = {
  nameEn: plain(1, 120),
  nameHi: plain(1, 120).nullable().optional(),
  description: multiline(2000).nullable().optional(),
  categoryId: IdSchema,
  subcategoryId: IdSchema,
  brand: plain(1, 80).nullable().optional(),
  sku: plain(1, 64).nullable().optional(),
  pricePaise: PaiseSchema,
  mrpPaise: PaiseSchema,
  unit: plain(1, 40),
  tags: z.array(plain(1, 40)).max(20).optional(),
  specs: z.array(ProductSpecSchema).max(30).optional(),
  featuredSelected: z.boolean().optional(),
  published: z.boolean().optional(),
  variants: z.array(ProductVariantInputSchema).max(20).optional(),
  media: z.array(ProductMediaInputSchema).max(PRODUCT_MEDIA_LIMIT).optional(),
};

/**
 * POST /businesses/me/products. Omitted inventory uses the new-product
 * defaults (stock 10, threshold 5, available); a missing SKU is generated.
 * `taxCode` is not accepted until Settings exposes its allow-listed tax port.
 */
export const ProductCreateSchema = z.strictObject({
  ...productFields,
  inventory: z.strictObject(inventoryFields).optional(),
});
export type ProductCreate = z.infer<typeof ProductCreateSchema>;

/**
 * PATCH /businesses/me/products/{productId}: partial, product-version guarded.
 * Inventory changes carry the inventory version and commit with the edit.
 * `variants`/`media`/`tags`/`specs` replace the whole ordered list.
 */
export const ProductUpdateSchema = z.strictObject({
  nameEn: productFields.nameEn.optional(),
  nameHi: productFields.nameHi,
  description: productFields.description,
  categoryId: IdSchema.optional(),
  subcategoryId: IdSchema.optional(),
  brand: productFields.brand,
  sku: productFields.sku,
  pricePaise: PaiseSchema.optional(),
  mrpPaise: PaiseSchema.optional(),
  unit: productFields.unit.optional(),
  tags: productFields.tags,
  specs: productFields.specs,
  featuredSelected: productFields.featuredSelected,
  published: productFields.published,
  variants: productFields.variants,
  media: productFields.media,
  inventory: z
    .strictObject({ ...inventoryFields, expectedVersion: VersionSchema })
    .optional(),
  expectedVersion: VersionSchema,
});
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

export const ProductParamsSchema = z.strictObject({ productId: IdSchema });
export type ProductParams = z.infer<typeof ProductParamsSchema>;

const versionParam = z.preprocess(
  (value) =>
    typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value)
      ? Number(value)
      : value,
  VersionSchema,
);
/** DELETE /businesses/me/products/{productId}?expectedVersion= */
export const ProductDeleteQuerySchema = z.strictObject({
  expectedVersion: versionParam,
});
export type ProductDeleteQuery = z.infer<typeof ProductDeleteQuerySchema>;

const limitParam = z.preprocess(
  (value) =>
    typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
      ? Number(value)
      : value,
  LimitSchema,
);
/** Allow-listed owner stock filters: low = on_hand <= threshold. */
export const PRODUCT_STOCK_FILTERS = ['low', 'out_of_stock'] as const;
export const ProductStockFilterSchema = z.enum(PRODUCT_STOCK_FILTERS);
export type ProductStockFilter = z.infer<typeof ProductStockFilterSchema>;
export const ProductOwnerListQuerySchema = z.strictObject({
  query: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    plain(1, 100).optional(),
  ),
  stock: ProductStockFilterSchema.optional(),
  cursor: CursorSchema.optional(),
  limit: limitParam,
});
export type ProductOwnerListQuery = z.infer<typeof ProductOwnerListQuerySchema>;
export const InventoryListQuerySchema = z.strictObject({
  cursor: CursorSchema.optional(),
  limit: limitParam,
});
export type InventoryListQuery = z.infer<typeof InventoryListQuerySchema>;

/** Inventory state; `version` is the inventory row version. */
export const ProductInventorySchema = z.strictObject({
  onHand: StockQuantitySchema,
  lowStockThreshold: StockQuantitySchema,
  availableForSale: z.boolean(),
  /** on_hand <= low_stock_threshold. */
  lowStock: z.boolean(),
  /** available_for_sale AND on_hand > 0 (listing purchasability also needs publication). */
  inStock: z.boolean(),
  version: VersionSchema,
});
export type ProductInventory = z.infer<typeof ProductInventorySchema>;

export const ProductVariantSchema = z.strictObject({
  id: IdSchema,
  label: z.string().min(1),
  position: z.number().int().min(0),
});

const productOwnerBase = {
  id: IdSchema,
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameHi: z.string().nullable(),
  categoryId: IdSchema,
  subcategoryId: IdSchema,
  sku: z.string().nullable(),
  pricePaise: PaiseSchema,
  mrpPaise: PaiseSchema,
  unit: z.string().min(1),
  published: z.boolean(),
  /** Stored owner selection (retained across Premium expiry). */
  featuredSelected: z.boolean(),
  /** Effective: selection + publication + current Premium entitlement. */
  featured: z.boolean(),
  media: z.array(ProductMediaItemSchema).max(PRODUCT_MEDIA_LIMIT),
  inventory: ProductInventorySchema,
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
};
export const ProductOwnerListItemSchema = z.strictObject(productOwnerBase);
export type ProductOwnerListItem = z.infer<typeof ProductOwnerListItemSchema>;
export const ProductOwnerPageSchema = z.strictObject({
  items: z.array(ProductOwnerListItemSchema),
  nextCursor: CursorSchema.nullable(),
});
export type ProductOwnerPage = z.infer<typeof ProductOwnerPageSchema>;

export const ProductOwnerSchema = z.strictObject({
  ...productOwnerBase,
  businessId: IdSchema,
  description: z.string().nullable(),
  brand: z.string().nullable(),
  /** Allow-listed fiscal classification; null until configured. */
  taxCode: z.string().nullable(),
  tags: z.array(z.string()),
  specs: z.array(z.strictObject({ label: z.string(), value: z.string() })),
  variants: z.array(ProductVariantSchema),
});
export type ProductOwner = z.infer<typeof ProductOwnerSchema>;

/** Bulk: expectedVersions[i] guards productIds[i] (see action docs). */
export const PRODUCT_BULK_ACTIONS = [
  'mark_in_stock',
  'mark_out_of_stock',
  'delete',
] as const;
export const ProductBulkActionSchema = z.enum(PRODUCT_BULK_ACTIONS);
export type ProductBulkAction = z.infer<typeof ProductBulkActionSchema>;
export const ProductBulkCommandSchema = z.strictObject({
  productIds: z.array(IdSchema).min(1).max(PRODUCT_BULK_LIMIT),
  action: ProductBulkActionSchema,
  expectedVersions: z.array(VersionSchema).min(1).max(PRODUCT_BULK_LIMIT),
});
export type ProductBulkCommand = z.infer<typeof ProductBulkCommandSchema>;
export const ProductBulkResultSchema = z.strictObject({
  changedIds: z.array(IdSchema),
});
export type ProductBulkResult = z.infer<typeof ProductBulkResultSchema>;

export const InventoryItemSchema = z.strictObject({
  productId: IdSchema,
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameHi: z.string().nullable(),
  sku: z.string().nullable(),
  unit: z.string().min(1),
  onHand: StockQuantitySchema,
  lowStockThreshold: StockQuantitySchema,
  availableForSale: z.boolean(),
  lowStock: z.boolean(),
  inStock: z.boolean(),
  version: VersionSchema,
  updatedAt: TimestampSchema,
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export const InventoryPageSchema = z.strictObject({
  items: z.array(InventoryItemSchema),
  nextCursor: CursorSchema.nullable(),
});
export type InventoryPage = z.infer<typeof InventoryPageSchema>;

/** At least one change; `delta` is a signed stock adjustment. */
export const InventoryUpdateSchema = z
  .strictObject({
    delta: z.number().int().min(-STOCK_MAX).max(STOCK_MAX).optional(),
    availableForSale: z.boolean().optional(),
    lowStockThreshold: StockQuantitySchema.optional(),
    expectedVersion: VersionSchema,
  })
  .refine(
    (value) =>
      value.delta !== undefined ||
      value.availableForSale !== undefined ||
      value.lowStockThreshold !== undefined,
    { message: 'At least one inventory change is required' },
  );
export type InventoryUpdate = z.infer<typeof InventoryUpdateSchema>;

/** Restock every currently low row to 20; versions must cover exactly that set. */
export const InventoryRestockLowSchema = z.strictObject({
  targetOnHand: z.literal(PRODUCT_RESTOCK_TARGET),
  expectedVersions: z
    .array(z.strictObject({ productId: IdSchema, version: VersionSchema }))
    .max(PRODUCT_BULK_LIMIT),
});
export type InventoryRestockLow = z.infer<typeof InventoryRestockLowSchema>;
