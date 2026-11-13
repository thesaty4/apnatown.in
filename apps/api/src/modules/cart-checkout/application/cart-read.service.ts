import { Inject, Injectable } from '@nestjs/common';
import type { Cart } from '@apnatown/shared/cart';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { CartSupport } from './cart-support';

export interface CartReadResult {
  readonly cart: Cart;
  /** A fresh guest-cart token to set as the httpOnly cookie, if any. */
  readonly issueGuestToken: string | null;
}

/**
 * `GET /cart` (F-CK-001): the owner's cart revalidated against current
 * product price/stock/labels, or the transient `{id:null,version:0}` state.
 * Guest bootstrap issues the cookie capability without creating a cart row;
 * an expired guest binding (Q-70 lifetime) is rotated, never revived.
 */
@Injectable()
export class CartReadService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    private readonly support: CartSupport,
  ) {}

  read(actor: { principalId: string | null; guestCookie: unknown }): Promise<CartReadResult> {
    return this.uow.run(async (tx) => {
      if (actor.principalId) {
        const cart = await this.support.find(tx, { kind: 'user', userId: actor.principalId }, false);
        return { cart: await this.support.view(tx, cart), issueGuestToken: null };
      }
      const guest = this.support.guest;
      if (!guest.enabled) return { cart: await this.support.view(tx, null), issueGuestToken: null };
      const tokenHash = guest.hash(actor.guestCookie);
      if (!tokenHash) return { cart: await this.support.view(tx, null), issueGuestToken: guest.issue() };
      const owner = { kind: 'guest', tokenHash } as const;
      const cart = await this.support.find(tx, owner, false);
      if (cart) return { cart: await this.support.view(tx, cart), issueGuestToken: null };
      // A row older than the lifetime is expired: rotate to a new capability.
      const stale = await this.support.carts.find(tx, owner, { lock: false, guestNotBefore: null });
      return {
        cart: await this.support.view(tx, null),
        issueGuestToken: stale ? guest.issue() : null,
      };
    });
  }
}
