import { z } from 'zod';
import { IdSchema, PaiseSchema, TimestampSchema, VersionSchema } from './wire.js';
import { DeliveryMethodSchema } from './businesses.js';
import { CartLineIssueCodeSchema, CartQuantitySchema } from './cart.js';
import { OrderModeSchema, OrderStatusSchema, PaymentMethodSchema } from './orders.js';

/**
 * Checkout wire contracts (cart-checkout BE spec: `POST /cart/quote`,
 * `POST /checkout/attempts`, `GET /checkout/attempts/{id}`; BR-01/03/04).
 * Every amount is server-computed paise; unknown fees/totals are null, never
 * zero. Clients send identities, versions, modes and a payment method only.
 */

export const CHECKOUT_QUOTE_TTL_MINUTES = 15;

export const CheckoutModeChoiceSchema = z.strictObject({
  businessId: IdSchema,
  mode: OrderModeSchema,
});

export const CheckoutQuoteRequestSchema = z
  .strictObject({
    cartVersion: VersionSchema,
    addressId: IdSchema.optional(),
    addressVersion: VersionSchema.optional(),
    deliveryModes: z.array(CheckoutModeChoiceSchema).max(50).optional(),
    /** Coupons are not configured in this slice (CHECKOUT_COUPON_POLICY_UNAVAILABLE). */
    couponCode: z.string().trim().min(1).max(40).optional(),
  })
  .refine((input) => (input.addressId === undefined) === (input.addressVersion === undefined), {
    path: ['addressVersion'],
  })
  .refine(
    (input) =>
      new Set((input.deliveryModes ?? []).map((choice) => choice.businessId)).size ===
      (input.deliveryModes ?? []).length,
    { path: ['deliveryModes'] },
  );
export type CheckoutQuoteRequest = z.infer<typeof CheckoutQuoteRequestSchema>;

export const CHECKOUT_GROUP_ISSUES = [
  'MODE_REQUIRED',
  'ADDRESS_REQUIRED',
  'ADDRESS_LOCATION_REQUIRED',
  'DELIVERY_UNAVAILABLE',
  'DELIVERY_OUT_OF_RANGE',
  'DELIVERY_FEE_UNAVAILABLE',
  'MINIMUM_ORDER_NOT_MET',
  'PICKUP_UNAVAILABLE',
  'SHOP_CLOSED',
  'SHOP_UNAVAILABLE',
  'LINE_ISSUES',
] as const;
export const CheckoutGroupIssueSchema = z.enum(CHECKOUT_GROUP_ISSUES);
export type CheckoutGroupIssue = z.infer<typeof CheckoutGroupIssueSchema>;

export const CHECKOUT_QUOTE_ISSUES = ['CART_EMPTY', 'SHOP_ISSUES', 'PAYMENT_UNAVAILABLE'] as const;
export const CheckoutQuoteIssueSchema = z.enum(CHECKOUT_QUOTE_ISSUES);

const availability = z.strictObject({
  available: z.boolean(),
  reasonCode: CheckoutGroupIssueSchema.nullable(),
});

export const CheckoutQuoteLineSchema = z.strictObject({
  cartLineId: IdSchema,
  lineVersion: VersionSchema,
  productId: IdSchema,
  variantId: IdSchema.nullable(),
  variantLabel: z.string().max(60).nullable(),
  nameEn: z.string().min(1).max(200),
  nameHi: z.string().max(200).nullable(),
  quantity: CartQuantitySchema,
  /** Current offer-effective price; null while the line is unavailable. */
  unitPricePaise: PaiseSchema.nullable(),
  discountPaise: PaiseSchema,
  lineTotalPaise: PaiseSchema.nullable(),
  issues: z.array(CartLineIssueCodeSchema),
});
export type CheckoutQuoteLine = z.infer<typeof CheckoutQuoteLineSchema>;

export const CheckoutQuoteGroupSchema = z.strictObject({
  businessId: IdSchema,
  business: z
    .strictObject({
      id: IdSchema,
      kind: z.enum(['shop', 'provider']),
      nameEn: z.string().min(1).max(200),
      nameHi: z.string().max(200).nullable(),
      slug: z.string().max(100).nullable(),
    })
    .nullable(),
  scope: z.strictObject({ cityId: IdSchema, areaId: IdSchema }).nullable(),
  mode: OrderModeSchema.nullable(),
  deliveryMethod: DeliveryMethodSchema.nullable(),
  settingsVersion: z.number().int().min(1).nullable(),
  fulfilment: z.strictObject({ delivery: availability, pickup: availability }),
  lines: z.array(CheckoutQuoteLineSchema),
  itemsSubtotalPaise: PaiseSchema,
  minimumOrderPaise: PaiseSchema.nullable(),
  couponDiscountPaise: PaiseSchema,
  deliveryFeePaise: PaiseSchema.nullable(),
  deliveryFeeSource: z.enum(['pickup', 'business_flat', 'geo_slab']).nullable(),
  platformFeePaise: PaiseSchema.nullable(),
  totalPaise: PaiseSchema.nullable(),
  issues: z.array(CheckoutGroupIssueSchema),
});
export type CheckoutQuoteGroup = z.infer<typeof CheckoutQuoteGroupSchema>;

export const CheckoutPaymentOptionSchema = z.strictObject({
  method: PaymentMethodSchema,
  available: z.boolean(),
});

export const CheckoutQuoteSchema = z.strictObject({
  quoteId: IdSchema,
  cartVersion: VersionSchema,
  addressId: IdSchema.nullable(),
  addressVersion: VersionSchema.nullable(),
  pricingRevision: z.string().min(1).max(200),
  createdAt: TimestampSchema,
  expiresAt: TimestampSchema,
  /** True only when every shop group is placeable and every amount is known. */
  ready: z.boolean(),
  groups: z.array(CheckoutQuoteGroupSchema),
  totals: z.strictObject({
    itemsSubtotalPaise: PaiseSchema,
    discountPaise: PaiseSchema,
    deliveryFeePaise: PaiseSchema.nullable(),
    platformFeePaise: PaiseSchema.nullable(),
    totalPaise: PaiseSchema.nullable(),
  }),
  paymentMethods: z.array(CheckoutPaymentOptionSchema),
  issues: z.array(CheckoutQuoteIssueSchema),
});
export type CheckoutQuote = z.infer<typeof CheckoutQuoteSchema>;

/** `cash` = Cash on delivery / pay at pickup. Online methods need a provider. */
export const CheckoutAttemptCreateSchema = z.strictObject({
  quoteId: IdSchema,
  expectedCartVersion: VersionSchema,
  expectedAddressVersion: VersionSchema.optional(),
  paymentMethod: PaymentMethodSchema,
});
export type CheckoutAttemptCreate = z.infer<typeof CheckoutAttemptCreateSchema>;

export const CheckoutAttemptParamsSchema = z.strictObject({ attemptId: IdSchema });
export type CheckoutAttemptParams = z.infer<typeof CheckoutAttemptParamsSchema>;

export const CheckoutAttemptOrderSchema = z.strictObject({
  id: IdSchema,
  orderNumber: z.string().min(1).max(24),
  businessId: IdSchema,
  businessNameEn: z.string().min(1).max(200),
  businessNameHi: z.string().max(200).nullable(),
  mode: OrderModeSchema,
  totalPaise: PaiseSchema,
  status: OrderStatusSchema,
});

export const CheckoutAttemptSchema = z.strictObject({
  id: IdSchema,
  version: VersionSchema,
  status: z.enum(['placed']),
  paymentRound: z.number().int().min(1),
  quoteId: IdSchema,
  paymentMethod: PaymentMethodSchema,
  failureCode: z.null(),
  payment: z.strictObject({ method: PaymentMethodSchema, status: z.enum(['pending']) }),
  allowedActions: z.array(z.never()),
  orders: z.array(CheckoutAttemptOrderSchema).min(1),
  totalPaise: PaiseSchema,
  createdAt: TimestampSchema,
});
export type CheckoutAttempt = z.infer<typeof CheckoutAttemptSchema>;

export const CHECKOUT_EVENT_TYPES = Object.freeze({
  ordersCreated: 'checkout.orders_created',
} as const);
