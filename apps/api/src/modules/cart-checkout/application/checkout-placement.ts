import { Inject, Injectable } from '@nestjs/common';
import { CheckoutQuoteSchema, type CheckoutAttemptCreate, type CheckoutQuote } from '@apnatown/shared/checkout';
import type { OrderMode } from '@apnatown/shared/orders';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import type { CheckoutBusinessView } from '../../businesses/application/business-checkout-read-port';
import type { CheckoutAddress, CheckoutShopOrder } from '../../orders/application/order-ports';
import type { StoredCart } from './cart-ports';
import { CartSupport } from './cart-support';
import { CHECKOUT_REPOSITORY, type CheckoutRepository } from './checkout-ports';
import { CheckoutQuoteBuilder } from './checkout-quote-builder';

export interface PinnedCheckout {
  readonly cart: StoredCart;
  /** Freshly recomputed under lock; equal to the pinned quote's amounts. */
  readonly quote: CheckoutQuote;
  readonly address: CheckoutAddress | null;
  readonly businesses: ReadonlyMap<string, CheckoutBusinessView>;
  readonly expiresAt: Date;
}

/** What the customer confirmed: per-shop mode, lines, versions and paise. */
function fingerprint(quote: CheckoutQuote) {
  return JSON.stringify(
    quote.groups.map((g) => [
      g.businessId, g.mode, g.deliveryMethod, g.deliveryFeePaise, g.platformFeePaise, g.totalPaise,
      g.lines.map((l) => [l.cartLineId, l.lineVersion, l.variantId, l.quantity, l.unitPricePaise]),
    ]),
  );
}

/**
 * Placement-time re-verification (cart-checkout BE rules 7–9, 12): own
 * unexpired quote, unchanged cart/address versions, and an identical
 * recomputation against current prices/settings/fees. Any change requires a
 * new quote and explicit confirmation (CHECKOUT_QUOTE_STALE).
 */
@Injectable()
export class CheckoutPlacement {
  constructor(
    @Inject(CHECKOUT_REPOSITORY) private readonly checkout: CheckoutRepository,
    private readonly support: CartSupport,
    private readonly builder: CheckoutQuoteBuilder,
  ) {}

  async verify(tx: TxContext, userId: string, input: CheckoutAttemptCreate, at: Date): Promise<PinnedCheckout> {
    const stored = await this.checkout.findQuote(tx, input.quoteId, userId);
    if (!stored || stored.expiresAt.getTime() <= at.getTime()) throw new DomainError('CHECKOUT_QUOTE_STALE');
    const pinned = CheckoutQuoteSchema.parse(stored.snapshot);
    if (!pinned.ready) throw new DomainError('ORDER_CHECKOUT_INVALID');
    const cart = await this.support.find(tx, { kind: 'user', userId }, true);
    if (
      !cart ||
      cart.id !== stored.cartId ||
      cart.version !== stored.cartVersion ||
      cart.version !== input.expectedCartVersion ||
      (input.expectedAddressVersion !== undefined && input.expectedAddressVersion !== stored.addressVersion)
    )
      throw new DomainError('CHECKOUT_QUOTE_STALE');
    const modes = new Map<string, OrderMode>();
    for (const group of pinned.groups) if (group.mode) modes.set(group.businessId, group.mode);
    let fresh;
    try {
      fresh = await this.builder.build(tx, {
        userId,
        cart,
        lines: await this.support.carts.lines(tx, cart.id),
        address:
          stored.addressId && stored.addressVersion ? { id: stored.addressId, version: stored.addressVersion } : null,
        modes,
        quoteId: pinned.quoteId,
        at,
        lockBusinesses: true,
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'CHECKOUT_ADDRESS_INVALID')
        throw new DomainError('CHECKOUT_QUOTE_STALE');
      throw error;
    }
    if (!fresh.quote.ready) {
      const stock = fresh.quote.groups.some((g) => g.lines.some((l) => l.issues.length));
      throw new DomainError(stock ? 'PRODUCT_NOT_AVAILABLE' : 'CHECKOUT_QUOTE_STALE');
    }
    if (fingerprint(fresh.quote) !== fingerprint(pinned)) throw new DomainError('CHECKOUT_QUOTE_STALE');
    return { cart, quote: fresh.quote, address: fresh.address, businesses: fresh.businesses, expiresAt: stored.expiresAt };
  }

  /** Per-shop order inputs from the verified quote (no payment link yet). */
  shops(
    quote: CheckoutQuote,
    businesses: ReadonlyMap<string, CheckoutBusinessView>,
  ): Omit<CheckoutShopOrder, 'paymentAttemptId'>[] {
    return quote.groups.map((group) => {
      const b = businesses.get(group.businessId);
      if (!b || !group.mode || group.totalPaise === null || group.deliveryFeePaise === null || group.platformFeePaise === null)
        throw new DomainError('ORDER_CHECKOUT_INVALID');
      return {
        businessId: b.businessId,
        scope: { cityId: b.cityId, areaId: b.areaId },
        mode: group.mode,
        deliveryMethod: group.mode === 'delivery' ? b.deliveryMethod : null,
        business: {
          id: b.businessId, kind: b.kind, nameEn: b.nameEn, nameHi: b.nameHi, slug: b.slug,
          areaNameEn: b.areaNameEn, areaNameHi: b.areaNameHi, addressText: b.addressText,
          pickupInstructions: b.pickupInstructions, version: b.version,
        },
        amounts: {
          itemsSubtotalPaise: group.itemsSubtotalPaise,
          discountPaise: 0,
          deliveryFeePaise: group.deliveryFeePaise,
          platformFeePaise: group.platformFeePaise,
          totalPaise: group.totalPaise,
        },
        lines: group.lines.map((line) => {
          if (line.unitPricePaise === null) throw new DomainError('PRODUCT_NOT_AVAILABLE');
          return {
            productId: line.productId, variantId: line.variantId, variantLabel: line.variantLabel,
            nameEn: line.nameEn, nameHi: line.nameHi, quantity: line.quantity,
            unitPricePaise: line.unitPricePaise, discountPaise: line.discountPaise,
          };
        }),
      };
    });
  }

  /** Clears only the pinned purchased lines; saved lines stay (rule 12). */
  async clearPurchasedLines(tx: TxContext, cartId: string, quote: CheckoutQuote, at: Date) {
    for (const group of quote.groups)
      for (const line of group.lines) await this.support.carts.deleteLine(tx, line.cartLineId);
    await this.support.carts.touch(tx, cartId, at);
  }
}
