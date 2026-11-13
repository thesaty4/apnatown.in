import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { canonicalJson, Money } from '@apnatown/shared';
import {
  CHECKOUT_QUOTE_TTL_MINUTES,
  CheckoutQuoteSchema,
  type CheckoutQuote,
} from '@apnatown/shared/checkout';
import type { OrderMode } from '@apnatown/shared/orders';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  BUSINESS_CHECKOUT_READ,
  type BusinessCheckoutReadPort,
  type CheckoutBusinessView,
} from '../../businesses/application/business-checkout-read-port';
import { GEO_DELIVERY, type GeoDeliveryPort } from '../../geo/application/geo-delivery.port';
import type { CheckoutAddress } from '../../orders/application/order-ports';
import { SETTINGS_READ, type SettingsReadPort } from '../../settings/application/settings-ports';
import { USERS_ADDRESS, type UsersAddressPort } from '../../users/application/address-port';
import type { StoredCart, StoredCartLine } from './cart-ports';
import { CartSupport } from './cart-support';
import { priceGroups, type RiderFee } from './checkout-pricing';

export interface QuoteBuild {
  readonly quote: CheckoutQuote;
  readonly address: CheckoutAddress | null;
  readonly businesses: ReadonlyMap<string, CheckoutBusinessView>;
}

const sumNullable = (values: readonly (number | null)[]) =>
  values.some((v) => v === null)
    ? null
    : values.reduce((sum: Money, v) => sum.add(Money.fromPaise(v ?? 0)), Money.fromPaise(0)).toPaiseNumber();

/**
 * Server-priced quote (cart-checkout BE rules 3–5): current product/offer
 * price and shared stock, Businesses fulfilment settings, Geo slab fee for
 * platform-rider shops, configured platform fee (0 when unconfigured, local
 * slice decision) and the live COD flag. Used both for `POST /cart/quote`
 * and to re-verify the pinned quote inside the placement UoW.
 */
@Injectable()
export class CheckoutQuoteBuilder {
  constructor(
    private readonly support: CartSupport,
    @Inject(BUSINESS_CHECKOUT_READ) private readonly businesses: BusinessCheckoutReadPort,
    @Inject(USERS_ADDRESS) private readonly addresses: UsersAddressPort,
    @Inject(GEO_DELIVERY) private readonly geo: GeoDeliveryPort,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
  ) {}

  async build(
    tx: TxContext,
    input: {
      userId: string;
      cart: StoredCart;
      lines: readonly StoredCartLine[];
      address: { id: string; version: number } | null;
      modes: ReadonlyMap<string, OrderMode>;
      quoteId: string;
      at: Date;
      lockBusinesses: boolean;
    },
  ): Promise<QuoteBuild> {
    const lines = input.lines.filter((line) => !line.savedForLater);
    const products = await this.support.products.forCart(tx, lines.map((l) => l.productId));
    const businessIds = [...new Set([...products.values()].map((p) => p.businessId))];
    const businesses = await this.businesses.forCheckout(tx, businessIds, input.lockBusinesses);
    const address = input.address ? await this.address(tx, input.userId, input.address) : null;
    const commission = await this.settings.get('commission', tx);
    const cod = await this.settings.getCurrentFlag('payments_cod', tx);
    const riderFees = await this.riderFees(tx, businesses, address);
    const platformFeePaise = commission?.value.platformFeePaise ?? 0;
    const groups = priceGroups({
      lines, products, businesses, address, modes: input.modes, platformFeePaise, riderFees,
    });
    const issues: CheckoutQuote['issues'] = [];
    if (!lines.length) issues.push('CART_EMPTY');
    if (groups.some((g) => g.issues.length) || lines.some((l) => !products.has(l.productId))) issues.push('SHOP_ISSUES');
    if (!cod.enabled) issues.push('PAYMENT_UNAVAILABLE');
    const total = groups.length ? sumNullable(groups.map((g) => g.totalPaise)) : null;
    const revision = canonicalJson({
      v: 1,
      products: [...products.values()].map((p) => [p.productId, p.pricePaise]),
      businesses: [...businesses.values()].map((b) => [b.businessId, b.version]),
      commission: commission?.version ?? null,
      cod: cod.version,
      riderFees: [...riderFees].map(([id, fee]) => [id, fee?.feePaise ?? null]),
    });
    const quote = CheckoutQuoteSchema.parse({
      quoteId: input.quoteId,
      cartVersion: input.cart.version,
      addressId: address?.id ?? null,
      addressVersion: address?.version ?? null,
      pricingRevision: createHash('sha256').update(revision).digest('hex'),
      createdAt: input.at.toISOString(),
      expiresAt: new Date(input.at.getTime() + CHECKOUT_QUOTE_TTL_MINUTES * 60_000).toISOString(),
      ready: issues.length === 0 && total !== null,
      groups,
      totals: {
        itemsSubtotalPaise: sumNullable(groups.map((g) => g.itemsSubtotalPaise)) ?? 0,
        discountPaise: 0,
        deliveryFeePaise: groups.length ? sumNullable(groups.map((g) => g.deliveryFeePaise)) : null,
        platformFeePaise: groups.length ? sumNullable(groups.map((g) => g.platformFeePaise)) : null,
        totalPaise: total,
      },
      paymentMethods: [
        { method: 'cash', available: cod.enabled },
        ...(['upi', 'card', 'net_banking', 'wallet'] as const).map((method) => ({ method, available: false })),
      ],
      issues,
    });
    return { quote, address, businesses };
  }

  private async address(
    tx: TxContext,
    userId: string,
    ref: { id: string; version: number },
  ): Promise<CheckoutAddress> {
    try {
      return await this.addresses.forCheckout({ userId, addressId: ref.id, expectedVersion: ref.version }, tx);
    } catch (error) {
      if (error instanceof DomainError && error.code.startsWith('ADDRESS_'))
        throw new DomainError('CHECKOUT_ADDRESS_INVALID');
      throw error;
    }
  }

  private async riderFees(
    tx: TxContext,
    businesses: ReadonlyMap<string, CheckoutBusinessView>,
    address: CheckoutAddress | null,
  ): Promise<Map<string, RiderFee>> {
    const fees = new Map<string, RiderFee>();
    for (const b of businesses.values()) {
      if (b.deliveryMethod !== 'apna_town_rider' || !b.location || !address?.location) continue;
      try {
        const quote = await this.geo.quoteDeliveryFee(
          { cityId: b.cityId, destination: address.location, origin: b.location },
          tx,
        );
        fees.set(b.businessId, quote.status === 'quoted' ? { feePaise: quote.feePaise } : null);
      } catch (error) {
        if (!(error instanceof DomainError)) throw error;
        fees.set(b.businessId, null);
      }
    }
    return fees;
  }
}
