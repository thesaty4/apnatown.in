import { Money } from '@apnatown/shared';
import type {
  CheckoutGroupIssue,
  CheckoutQuoteGroup,
  CheckoutQuoteLine,
} from '@apnatown/shared/checkout';
import type { OrderMode } from '@apnatown/shared/orders';
import type { CheckoutBusinessView } from '../../businesses/application/business-checkout-read-port';
import type { CartProductView } from '../../products/application/product-cart-read-port';
import type { StoredCartLine } from './cart-ports';
import { activeQuantities, lineIssues } from './cart-view';

type Point = { readonly lat: number; readonly lng: number };
export type RiderFee = { readonly feePaise: number } | null;

export interface PricingInput {
  readonly lines: readonly StoredCartLine[];
  readonly products: ReadonlyMap<string, CartProductView>;
  readonly businesses: ReadonlyMap<string, CheckoutBusinessView>;
  readonly address: { readonly location: Point | null } | null;
  readonly modes: ReadonlyMap<string, OrderMode>;
  readonly platformFeePaise: number;
  /** Geo slab quote for platform-rider shops (null = unavailable). */
  readonly riderFees: ReadonlyMap<string, RiderFee>;
}

const EARTH_KM = 6371.0088;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line (great-circle) km, matching Geo's no-routing distance basis. */
export function straightLineKm(a: Point, b: Point): number {
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const paise = (value: number) => Money.fromPaise(value);

/** Every value delivery needs; null is never zero (cart-checkout rule 4). */
function deliveryConfigured(b: CheckoutBusinessView): boolean {
  return (
    b.deliveryMethod !== null &&
    b.deliveryRadiusKm !== null &&
    b.minimumOrderPaise !== null &&
    (b.deliveryMethod !== 'self' || b.deliveryFeePaise !== null)
  );
}

/** Delivery availability and fee for one shop, given the subtotal and address. */
function delivery(
  b: CheckoutBusinessView,
  subtotal: number,
  input: PricingInput,
): { reason: CheckoutGroupIssue | null; fee: number | null; source: 'business_flat' | 'geo_slab' | null } {
  if (!deliveryConfigured(b)) return { reason: 'DELIVERY_UNAVAILABLE', fee: null, source: null };
  if (!input.address) return { reason: 'ADDRESS_REQUIRED', fee: null, source: null };
  const destination = input.address.location;
  if (!destination) return { reason: 'ADDRESS_LOCATION_REQUIRED', fee: null, source: null };
  if (!b.location || straightLineKm(b.location, destination) > (b.deliveryRadiusKm ?? 0))
    return { reason: 'DELIVERY_OUT_OF_RANGE', fee: null, source: null };
  if (subtotal < (b.minimumOrderPaise ?? 0)) return { reason: 'MINIMUM_ORDER_NOT_MET', fee: null, source: null };
  if (b.deliveryMethod === 'self') return { reason: null, fee: b.deliveryFeePaise, source: 'business_flat' };
  const rider = input.riderFees.get(b.businessId) ?? null;
  return rider
    ? { reason: null, fee: rider.feePaise, source: 'geo_slab' }
    : { reason: 'DELIVERY_FEE_UNAVAILABLE', fee: null, source: null };
}

function quoteLines(lines: readonly StoredCartLine[], input: PricingInput): CheckoutQuoteLine[] {
  const totals = activeQuantities(input.lines);
  return lines.map((line) => {
    // Grouped lines always resolve (priceGroups skips unknown products).
    const product = input.products.get(line.productId)!;
    const issues = lineIssues(line, product, totals.get(line.productId) ?? 0);
    const unit = product.pricePaise;
    return {
      cartLineId: line.id,
      lineVersion: line.version,
      productId: line.productId,
      variantId: line.variantId,
      variantLabel: product.variants.find((v) => v.id === line.variantId)?.label ?? null,
      nameEn: product.nameEn,
      nameHi: product.nameHi,
      quantity: line.quantity,
      unitPricePaise: unit,
      discountPaise: 0,
      lineTotalPaise: unit !== null && !issues.length ? paise(unit).multiply(line.quantity).toPaiseNumber() : null,
      issues,
    };
  });
}

function group(businessId: string, lines: readonly StoredCartLine[], input: PricingInput): CheckoutQuoteGroup {
  const b = input.businesses.get(businessId) ?? null;
  const quoted = quoteLines(lines, input);
  const subtotal = quoted
    .reduce((sum, line) => sum.add(paise(line.lineTotalPaise ?? 0)), paise(0))
    .toPaiseNumber();
  const issues: CheckoutGroupIssue[] = [];
  if (quoted.some((line) => line.issues.length)) issues.push('LINE_ISSUES');
  const mode = input.modes.get(businessId) ?? null;
  const pickupReason: CheckoutGroupIssue | null = b?.pickupEnabled ? null : 'PICKUP_UNAVAILABLE';
  const del = b ? delivery(b, subtotal, input) : { reason: 'SHOP_UNAVAILABLE' as const, fee: null, source: null };
  if (!b) issues.push('SHOP_UNAVAILABLE');
  else if (b.temporarilyClosed) issues.push('SHOP_CLOSED');
  if (!mode) issues.push('MODE_REQUIRED');
  else if (mode === 'pickup' && pickupReason) issues.push(pickupReason);
  else if (mode === 'delivery' && del.reason && !issues.includes(del.reason)) issues.push(del.reason);
  const fee = mode === 'pickup' ? 0 : mode === 'delivery' ? del.fee : null;
  const platform = b ? input.platformFeePaise : null;
  const total =
    !issues.length && fee !== null && platform !== null
      ? paise(subtotal).add(paise(fee)).add(paise(platform)).toPaiseNumber()
      : null;
  return {
    businessId,
    business: b && { id: b.businessId, kind: b.kind, nameEn: b.nameEn, nameHi: b.nameHi, slug: b.slug },
    scope: b && { cityId: b.cityId, areaId: b.areaId },
    mode,
    deliveryMethod: mode === 'delivery' ? (b?.deliveryMethod ?? null) : null,
    settingsVersion: b?.version ?? null,
    fulfilment: {
      delivery: { available: del.reason === null, reasonCode: del.reason },
      pickup: { available: pickupReason === null && b !== null, reasonCode: b ? pickupReason : 'SHOP_UNAVAILABLE' },
    },
    lines: quoted,
    itemsSubtotalPaise: subtotal,
    minimumOrderPaise: b?.minimumOrderPaise ?? null,
    couponDiscountPaise: 0,
    deliveryFeePaise: fee,
    deliveryFeeSource: mode === 'pickup' ? 'pickup' : mode === 'delivery' && fee !== null ? del.source : null,
    platformFeePaise: platform,
    totalPaise: total,
    issues,
  };
}

/** Active lines grouped by shop in first-seen cart order (BR-03). */
export function priceGroups(input: PricingInput): CheckoutQuoteGroup[] {
  const byBusiness = new Map<string, StoredCartLine[]>();
  for (const line of input.lines) {
    const product = input.products.get(line.productId);
    if (!product) continue;
    byBusiness.set(product.businessId, [...(byBusiness.get(product.businessId) ?? []), line]);
  }
  return [...byBusiness].map(([businessId, lines]) => group(businessId, lines, input));
}
