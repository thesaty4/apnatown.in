import { formatMoney } from '@apnatown/shared/formatters';
import type {
  CheckoutQuote,
  CheckoutQuoteGroup,
} from '@apnatown/shared/checkout';

export type Locale = 'en' | 'hi';

export const money = (paise: number, locale: Locale) =>
  formatMoney(paise, locale);

/** Localized name with the English fallback the API always provides. */
export const localName = (
  value: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && value.nameHi) || value.nameEn;

type GroupIssue = CheckoutQuoteGroup['issues'][number];
type QuoteIssue = CheckoutQuote['issues'][number];

/** Server issue code → `checkout.issues.*` key (semantic keys are camelCase). */
export const groupIssueKey: Record<GroupIssue, string> = {
  MODE_REQUIRED: 'modeRequired',
  ADDRESS_REQUIRED: 'addressRequired',
  ADDRESS_LOCATION_REQUIRED: 'addressLocationRequired',
  DELIVERY_UNAVAILABLE: 'deliveryUnavailable',
  DELIVERY_OUT_OF_RANGE: 'outOfRange',
  DELIVERY_FEE_UNAVAILABLE: 'feeUnavailable',
  MINIMUM_ORDER_NOT_MET: 'minimumNotMet',
  PICKUP_UNAVAILABLE: 'pickupUnavailable',
  SHOP_CLOSED: 'shopClosed',
  SHOP_UNAVAILABLE: 'shopUnavailable',
  LINE_ISSUES: 'lineIssues',
};

export const quoteIssueKey: Record<QuoteIssue, string> = {
  CART_EMPTY: 'cartEmpty',
  SHOP_ISSUES: 'shopIssues',
  PAYMENT_UNAVAILABLE: 'paymentUnavailable',
};

/** Fee source → `checkout.group.feeSource.*` (BR-04 explanation). */
export const feeSourceKey = {
  pickup: 'pickup',
  business_flat: 'shop',
  geo_slab: 'platform',
} as const;
