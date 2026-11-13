import { Money } from '@apnatown/shared';
import {
  CartSchema,
  type Cart,
  type CartGroup,
  type CartLine,
  type CartLineIssueCode,
  stockMaxQuantity,
} from '@apnatown/shared/cart';
import type { CartBusinessView } from '../../businesses/application/business-cart-read-port';
import type { CartProductView } from '../../products/application/product-cart-read-port';
import type { StoredCart, StoredCartLine } from './cart-ports';

export interface CartReadModel {
  readonly products: ReadonlyMap<string, CartProductView>;
  readonly businesses: ReadonlyMap<string, CartBusinessView>;
}

const paise = (value: number) => Money.fromPaise(value);

/** Sum of active quantities per product: all labels share product stock. */
export function activeQuantities(lines: readonly StoredCartLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines)
    if (!line.savedForLater)
      totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  return totals;
}

/** Revalidated on every read; never trusts stored price, label or stock. */
export function lineIssues(
  line: StoredCartLine,
  product: CartProductView | undefined,
  activeTotal: number,
): CartLineIssueCode[] {
  if (!product || !product.visible || product.pricePaise === null)
    return ['PRODUCT_UNAVAILABLE'];
  const issues: CartLineIssueCode[] = [];
  if (line.variantId === null && product.variants.length > 0)
    issues.push('VARIANT_SELECTION_REQUIRED');
  if (line.variantId !== null && !product.variants.some((v) => v.id === line.variantId))
    issues.push('VARIANT_UNAVAILABLE');
  const { onHand, availableForSale } = product.stock;
  if (!availableForSale || onHand <= 0) issues.push('OUT_OF_STOCK');
  else if ((line.savedForLater ? line.quantity : activeTotal) > onHand)
    issues.push('QUANTITY_EXCEEDS_STOCK');
  return issues;
}

function maxQuantity(product: CartProductView): number {
  if (!product.visible || product.pricePaise === null) return 0;
  return stockMaxQuantity(product.stock);
}

function lineView(
  line: StoredCartLine,
  product: CartProductView | undefined,
  issues: CartLineIssueCode[],
): CartLine {
  // A missing product row renders as unavailable so the line stays removable.
  if (!product)
    return {
      id: line.id,
      version: line.version,
      productId: line.productId,
      variantId: line.variantId,
      variantLabel: null,
      quantity: line.quantity,
      savedForLater: line.savedForLater,
      product: null,
      lineSubtotalPaise: null,
      issues,
    };
  const label = product.variants.find((v) => v.id === line.variantId)?.label ?? null;
  const unit = product.pricePaise;
  return {
    id: line.id,
    version: line.version,
    productId: line.productId,
    variantId: line.variantId,
    variantLabel: label,
    quantity: line.quantity,
    savedForLater: line.savedForLater,
    product: {
      id: product.productId,
      businessId: product.businessId,
      slug: product.slug,
      nameEn: product.nameEn,
      nameHi: product.nameHi,
      unit: product.unit,
      image: product.image,
      unitPricePaise: unit,
      mrpPaise: product.mrpPaise,
      maxQuantity: maxQuantity(product),
      variants: product.variants.map((v) => ({ id: v.id, label: v.label })),
    },
    lineSubtotalPaise:
      unit !== null && issues.length === 0
        ? paise(unit).multiply(line.quantity).toPaiseNumber()
        : null,
    issues,
  };
}

function groups(lines: readonly CartLine[], model: CartReadModel): CartGroup[] {
  const byBusiness = new Map<string, CartLine[]>();
  for (const line of lines) {
    if (line.savedForLater || !line.product) continue;
    const list = byBusiness.get(line.product.businessId) ?? [];
    list.push(line);
    byBusiness.set(line.product.businessId, list);
  }
  return [...byBusiness].map(([businessId, members]) => {
    const shop = model.businesses.get(businessId) ?? null;
    const subtotal = members.reduce(
      (sum, line) => sum.add(paise(line.lineSubtotalPaise ?? 0)),
      paise(0),
    ).toPaiseNumber();
    const minimum = shop?.minimumOrderPaise ?? null;
    return {
      businessId,
      shop: shop && {
        id: shop.businessId,
        slug: shop.slug,
        kind: shop.kind,
        nameEn: shop.nameEn,
        nameHi: shop.nameHi,
        areaNameEn: shop.areaNameEn,
        areaNameHi: shop.areaNameHi,
        pickupEnabled: shop.pickupEnabled,
        deliveryAvailable: shop.deliveryAvailable,
        temporarilyClosed: shop.temporarilyClosed,
      },
      lineIds: members.map((line) => line.id),
      itemsSubtotalPaise: subtotal,
      minimumOrderPaise: minimum,
      minimumOrderShortfallPaise:
        minimum !== null && shop?.deliveryAvailable && minimum > subtotal
          ? paise(minimum).subtract(paise(subtotal)).toPaiseNumber()
          : 0,
    };
  });
}

/** `id:null, version:0` is the transient, unpersisted empty cart. */
export function cartView(
  cart: StoredCart | null,
  stored: readonly StoredCartLine[],
  model: CartReadModel,
): Cart {
  const totals = activeQuantities(stored);
  const lines = stored.map((line) => {
    const product = model.products.get(line.productId);
    return lineView(line, product, lineIssues(line, product, totals.get(line.productId) ?? 0));
  });
  const active = lines.filter((line) => !line.savedForLater);
  const grouped = groups(lines, model);
  return CartSchema.parse({
    id: cart?.id ?? null,
    version: cart?.version ?? 0,
    lines,
    groups: grouped,
    estimatedAmounts: {
      itemsSubtotalPaise: grouped
        .reduce((sum, group) => sum.add(paise(group.itemsSubtotalPaise)), paise(0))
        .toPaiseNumber(),
      activeLineCount: active.length,
      activeItemCount: active.reduce((sum, line) => sum + line.quantity, 0),
      savedLineCount: lines.length - active.length,
      totals: 'quote_required',
    },
  });
}
