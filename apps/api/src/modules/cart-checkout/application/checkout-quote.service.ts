import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { canonicalJson } from '@apnatown/shared';
import type { CheckoutQuote, CheckoutQuoteRequest } from '@apnatown/shared/checkout';
import type { OrderMode } from '@apnatown/shared/orders';
import { DomainError } from '../../../shared/errors/errors';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import { CartSupport, type CartActor } from './cart-support';
import { CHECKOUT_REPOSITORY, type CheckoutRepository } from './checkout-ports';
import { CheckoutQuoteBuilder } from './checkout-quote-builder';

/**
 * `POST /cart/quote` (F-CK-002..005): authenticated customer's own cart at
 * the expected version. A read calculation persisted as an immutable quote
 * (15 min); claims no stock. Coupons are not configured in this slice.
 */
@Injectable()
export class CheckoutQuoteService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CHECKOUT_REPOSITORY) private readonly checkout: CheckoutRepository,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly support: CartSupport,
    private readonly builder: CheckoutQuoteBuilder,
  ) {}

  quote(actor: CartActor, input: CheckoutQuoteRequest): Promise<CheckoutQuote> {
    if (input.couponCode !== undefined) throw new DomainError('CHECKOUT_COUPON_POLICY_UNAVAILABLE');
    const userId = actor.principalId;
    if (!userId) throw new DomainError('SESSION_EXPIRED');
    return this.uow.run(async (tx) => {
      await this.support.verifyActor(tx, actor);
      const cart = await this.support.find(tx, { kind: 'user', userId }, false);
      if (!cart || cart.version !== input.cartVersion) throw new DomainError('CART_VERSION_CONFLICT');
      const modes = new Map<string, OrderMode>(
        (input.deliveryModes ?? []).map((choice) => [choice.businessId, choice.mode]),
      );
      const at = this.support.clock.now();
      const { quote } = await this.builder.build(tx, {
        userId,
        cart,
        lines: await this.support.carts.lines(tx, cart.id),
        address:
          input.addressId && input.addressVersion
            ? { id: input.addressId, version: input.addressVersion }
            : null,
        modes,
        quoteId: this.ids.uuidv7(),
        at,
        lockBusinesses: false,
      });
      await this.checkout.insertQuote(tx, {
        quote,
        cartId: cart.id,
        userId,
        inputHash: createHash('sha256').update(canonicalJson(input)).digest('hex'),
        at,
      });
      return quote;
    });
  }
}
