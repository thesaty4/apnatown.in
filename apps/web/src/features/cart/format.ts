import { formatMoney } from '@apnatown/shared/formatters';
import {
  CART_LINE_MAX_QUANTITY,
  type CartLine,
  type CartLineIssueCode,
  type CartShop,
} from '@apnatown/shared/cart';

export type Locale = 'en' | 'hi';

export const money = (paise: number, locale: Locale) =>
  formatMoney(paise, locale);

/** A line whose product row still exists. Lines with `product: null` are
 * outside every group and only offer Remove (`UnavailableLines`). */
export type AvailableLine = CartLine & {
  product: NonNullable<CartLine['product']>;
};

export const isAvailable = (line: CartLine): line is AvailableLine =>
  line.product !== null;

export const productName = (line: AvailableLine, locale: Locale) =>
  (locale === 'hi' && line.product.nameHi) || line.product.nameEn;

export const shopName = (shop: CartShop, locale: Locale) =>
  (locale === 'hi' && shop.nameHi) || shop.nameEn;

export const shopArea = (shop: CartShop, locale: Locale) =>
  (locale === 'hi' && shop.areaNameHi) || shop.areaNameEn;

/** Stepper upper bound: min(10, server stock bound); never below 1. */
export const lineMax = (line: AvailableLine) =>
  Math.max(1, Math.min(CART_LINE_MAX_QUANTITY, line.product.maxQuantity));

/** Issue code → `cart.issues.*` key, icon and tone (text + icon, never colour). */
export const issueView: Record<
  CartLineIssueCode,
  { key: string; tone: 'bad' | 'warn' }
> = {
  PRODUCT_UNAVAILABLE: { key: 'productUnavailable', tone: 'bad' },
  OUT_OF_STOCK: { key: 'outOfStock', tone: 'bad' },
  QUANTITY_EXCEEDS_STOCK: { key: 'quantityExceedsStock', tone: 'warn' },
  VARIANT_SELECTION_REQUIRED: { key: 'variantSelectionRequired', tone: 'warn' },
  VARIANT_UNAVAILABLE: { key: 'variantUnavailable', tone: 'bad' },
};
