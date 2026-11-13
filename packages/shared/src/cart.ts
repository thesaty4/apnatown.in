import { z } from 'zod';
import { IdSchema, PaiseSchema, VersionSchema } from './wire.js';
import { PublicImageVariantSchema } from './media.js';

/**
 * Cart wire contracts (cart-checkout BE spec; F-CK-001, S-CUST-10, J12).
 * The cart is identified only by the authenticated account or the httpOnly
 * guest-cart cookie; clients never send a cart ID, prices, fees or stock.
 * Quote-only amounts (fees, coupon, payable total) come from the later
 * `POST /cart/quote` contract and are intentionally absent here.
 */

export const CART_LINE_MAX_QUANTITY = 10;
/**
 * Stepper maximum for a purchasable product's shared stock:
 * `availableForSale ? min(CART_LINE_MAX_QUANTITY, onHand) : 0`.
 */
export function stockMaxQuantity(stock: {
  readonly onHand: number;
  readonly availableForSale: boolean;
}): number {
  if (!stock.availableForSale) return 0;
  return Math.max(0, Math.min(CART_LINE_MAX_QUANTITY, stock.onHand));
}
/** TODO(verify): the spec bounds quantity only; distinct lines per cart. */
export const CART_MAX_LINES = 50;

export const CART_ERROR_CODES = [
  'CART_NOT_FOUND',
  'CART_LINE_NOT_FOUND',
  'CART_LINE_INVALID',
  'CART_QUANTITY_INVALID',
  'CART_VERSION_CONFLICT',
  'PRODUCT_NOT_AVAILABLE',
] as const;
export type CartErrorCode = (typeof CART_ERROR_CODES)[number];

export const CartQuantitySchema = z
  .number()
  .int()
  .min(1)
  .max(CART_LINE_MAX_QUANTITY);
/** `0` only addresses the transient, not-yet-persisted cart. */
export const CartVersionInputSchema = z.number().int().min(0).max(2147483647);

export const CartLineParamsSchema = z.strictObject({ lineId: IdSchema });
export type CartLineParams = z.infer<typeof CartLineParamsSchema>;

export const AddCartLineSchema = z.strictObject({
  productId: IdSchema,
  variantId: IdSchema.nullable(),
  quantity: CartQuantitySchema,
  expectedCartVersion: CartVersionInputSchema,
});
export type AddCartLine = z.infer<typeof AddCartLineSchema>;

export const UpdateCartLineSchema = z.strictObject({
  quantity: CartQuantitySchema,
  expectedVersion: VersionSchema,
  expectedCartVersion: VersionSchema,
});
export type UpdateCartLine = z.infer<typeof UpdateCartLineSchema>;

/** DELETE, save-for-later and restore bodies. */
export const CartLineVersionsSchema = z.strictObject({
  expectedVersion: VersionSchema,
  expectedCartVersion: VersionSchema,
});
export type CartLineVersions = z.infer<typeof CartLineVersionsSchema>;

export const CART_LINE_ISSUE_CODES = [
  'PRODUCT_UNAVAILABLE',
  'OUT_OF_STOCK',
  'QUANTITY_EXCEEDS_STOCK',
  'VARIANT_SELECTION_REQUIRED',
  'VARIANT_UNAVAILABLE',
] as const;
export const CartLineIssueCodeSchema = z.enum(CART_LINE_ISSUE_CODES);
export type CartLineIssueCode = z.infer<typeof CartLineIssueCodeSchema>;

export const CartVariantOptionSchema = z.strictObject({
  id: IdSchema,
  label: z.string().min(1).max(60),
});

/** Public route slug (businesses allow ≤100); keeps cart links on known route shapes. */
const CartLinkSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/**
 * Server-read product context, revalidated on every read. Price is null when
 * the product is no longer publicly purchasable. `maxQuantity` is the stepper
 * bound min(10, shared product stock); 0 when nothing can be bought.
 */
export const CartLineProductSchema = z.strictObject({
  id: IdSchema,
  businessId: IdSchema,
  slug: CartLinkSlugSchema.nullable(),
  nameEn: z.string(),
  nameHi: z.string().nullable(),
  unit: z.string().nullable(),
  image: PublicImageVariantSchema.nullable(),
  unitPricePaise: PaiseSchema.nullable(),
  mrpPaise: PaiseSchema.nullable(),
  maxQuantity: z.number().int().min(0).max(CART_LINE_MAX_QUANTITY),
  variants: z.array(CartVariantOptionSchema).max(50),
});
export type CartLineProduct = z.infer<typeof CartLineProductSchema>;

export const CartLineSchema = z.strictObject({
  id: IdSchema,
  version: VersionSchema,
  productId: IdSchema,
  variantId: IdSchema.nullable(),
  variantLabel: z.string().nullable(),
  quantity: CartQuantitySchema,
  savedForLater: z.boolean(),
  /** Null when the product no longer exists (issue PRODUCT_UNAVAILABLE). */
  product: CartLineProductSchema.nullable(),
  /** Unit price × quantity; null while the line has issues. */
  lineSubtotalPaise: PaiseSchema.nullable(),
  issues: z.array(CartLineIssueCodeSchema),
});
export type CartLine = z.infer<typeof CartLineSchema>;

export const CartShopSchema = z.strictObject({
  id: IdSchema,
  slug: CartLinkSlugSchema,
  kind: z.string(),
  nameEn: z.string(),
  nameHi: z.string().nullable(),
  areaNameEn: z.string().nullable(),
  areaNameHi: z.string().nullable(),
  pickupEnabled: z.boolean(),
  deliveryAvailable: z.boolean(),
  temporarilyClosed: z.boolean(),
});
export type CartShop = z.infer<typeof CartShopSchema>;

/**
 * Active (not saved) lines grouped by shop. `shop` is null when the shop is
 * no longer public. The minimum applies to delivery only and is evaluated
 * authoritatively by the quote; here it is an estimate for display.
 */
export const CartGroupSchema = z.strictObject({
  businessId: IdSchema,
  shop: CartShopSchema.nullable(),
  lineIds: z.array(IdSchema),
  itemsSubtotalPaise: PaiseSchema,
  minimumOrderPaise: PaiseSchema.nullable(),
  minimumOrderShortfallPaise: PaiseSchema,
});
export type CartGroup = z.infer<typeof CartGroupSchema>;

export const CartEstimatedAmountsSchema = z.strictObject({
  /** Sum of issue-free active lines at current server prices. */
  itemsSubtotalPaise: PaiseSchema,
  activeLineCount: z.number().int().nonnegative(),
  activeItemCount: z.number().int().nonnegative(),
  savedLineCount: z.number().int().nonnegative(),
  /** Fees/coupon/total are quote-only; always `quote_required` here. */
  totals: z.literal('quote_required'),
});
export type CartEstimatedAmounts = z.infer<typeof CartEstimatedAmountsSchema>;

/** `id:null, version:0` is the transient, unpersisted empty cart. */
export const CartSchema = z.strictObject({
  id: IdSchema.nullable(),
  version: z.number().int().min(0).max(2147483647),
  lines: z.array(CartLineSchema),
  groups: z.array(CartGroupSchema),
  estimatedAmounts: CartEstimatedAmountsSchema,
});
export type Cart = z.infer<typeof CartSchema>;

export const CART_MERGE_REVIEW_REASONS = [
  'QUANTITY_CLIPPED',
  /** Not merged: the account cart already holds the maximum line count. */
  'LINE_LIMIT_REACHED',
  ...CART_LINE_ISSUE_CODES,
] as const;
export const CartMergeReviewReasonSchema = z.enum(CART_MERGE_REVIEW_REASONS);

export const CartMergeResultSchema = z.strictObject({
  cart: CartSchema,
  review: z.array(
    z.strictObject({
      /** Account-cart line; null when the guest line was not merged. */
      lineId: IdSchema.nullable(),
      productId: IdSchema,
      variantId: IdSchema.nullable(),
      reasons: z.array(CartMergeReviewReasonSchema).min(1),
    }),
  ),
});
export type CartMergeResult = z.infer<typeof CartMergeResultSchema>;
