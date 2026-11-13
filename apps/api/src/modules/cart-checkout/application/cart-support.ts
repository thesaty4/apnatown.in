import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import { CartSchema, type Cart } from '@apnatown/shared/cart';
import type { SessionBinding } from '../../../shared/auth';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  BUSINESS_CART_READ,
  type BusinessCartReadPort,
} from '../../businesses/application/business-cart-read-port';
import {
  PRODUCT_CART_READ,
  type ProductCartReadPort,
} from '../../products/application/product-cart-read-port';
import {
  CART_REPOSITORY,
  type CartOwner,
  type CartRepository,
  type StoredCart,
  type StoredCartLine,
} from './cart-ports';
import { cartView, type CartReadModel } from './cart-view';
import { GuestCartCapability } from './guest-cart-capability';

/** Browser caller of a cart route; the cart is never client-addressed. */
export interface CartActor {
  readonly session: SessionBinding;
  readonly principalId: string | null;
  /** Raw guest-cart cookie value (opaque; hashed, never stored or logged). */
  readonly guestCookie: unknown;
  readonly correlationId: string;
  readonly key: unknown;
}

export interface CartCommandSpec {
  readonly name: string;
  readonly method: 'POST' | 'PATCH' | 'DELETE';
  readonly resource: string;
  readonly payload: JsonValue;
}

/** Owner resolution, revalidated views and idempotent command plumbing. */
@Injectable()
export class CartSupport {
  constructor(
    @Inject(CART_REPOSITORY) readonly carts: CartRepository,
    @Inject(PRODUCT_CART_READ) readonly products: ProductCartReadPort,
    @Inject(BUSINESS_CART_READ) private readonly businesses: BusinessCartReadPort,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(CLOCK) readonly clock: Clock,
    readonly guest: GuestCartCapability,
  ) {}

  /**
   * Account carts for signed-in callers (the guest cookie is ignored outside
   * merge); otherwise the cookie-bound guest cart. A guest command needs a
   * cookie previously issued by `GET /cart`.
   */
  commandOwner(actor: CartActor): CartOwner {
    if (actor.principalId) return { kind: 'user', userId: actor.principalId };
    if (!this.guest.enabled) throw new DomainError('COMMON_UNAVAILABLE');
    const tokenHash = this.guest.hash(actor.guestCookie);
    if (!tokenHash) throw new DomainError('CART_NOT_FOUND');
    return { kind: 'guest', tokenHash };
  }

  /** Revalidates the signed-in identity through commit. */
  async verifyActor(tx: TxContext, actor: CartActor): Promise<void> {
    if (!actor.principalId) return;
    const principal = await this.sessions.requirePrincipal(tx, actor.session);
    if (principal.userId !== actor.principalId)
      throw new DomainError('SESSION_EXPIRED');
  }

  find(tx: TxContext, owner: CartOwner, lock: boolean): Promise<StoredCart | null> {
    return this.carts.find(tx, owner, {
      lock,
      guestNotBefore: this.guest.notBefore(this.clock.now()),
    });
  }

  async model(tx: TxContext, lines: readonly StoredCartLine[]): Promise<CartReadModel> {
    const products = await this.products.forCart(tx, lines.map((l) => l.productId));
    const businesses = await this.businesses.forCart(
      tx,
      [...products.values()].map((p) => p.businessId),
    );
    return { products, businesses };
  }

  async view(tx: TxContext, cart: StoredCart | null): Promise<Cart> {
    const lines = cart ? await this.carts.lines(tx, cart.id) : [];
    return cartView(cart, lines, await this.model(tx, lines));
  }

  /**
   * Idempotent cart command keyed per principal (or anonymous session). The
   * guest-cart hash joins the fingerprint only, so one key cannot replay a
   * different guest cart's result; it is never stored.
   */
  run<T extends JsonValue>(
    actor: CartActor,
    spec: CartCommandSpec,
    owner: CartOwner | null,
    work: (tx: TxContext) => Promise<T>,
    parse: (stored: JsonValue) => T,
  ): Promise<T> {
    const now = this.clock.now();
    const command = this.contexts.create(
      { name: spec.name, method: spec.method, scope: 'principal', successStatus: 200 },
      {
        actorId: actor.principalId ?? actor.session.id,
        correlationId: actor.correlationId,
        resource: spec.resource,
        business: null,
        expiresAt: new Date(now.getTime() + RECEIPT_TTL_MS),
      },
      {
        key: actor.key,
        payload: {
          owner:
            owner?.kind === 'guest'
              ? Buffer.from(owner.tokenHash).toString('hex')
              : 'account',
          input: spec.payload,
        },
      },
    );
    return this.commands.run(
      command,
      async (tx) => {
        await this.verifyActor(tx, actor);
        return work(tx);
      },
      {
        store: (result) => result,
        replay: async (tx, stored) => {
          await this.verifyActor(tx, actor);
          return parse(stored);
        },
      },
    );
  }

  parseCart(stored: JsonValue): Cart & JsonValue {
    return CartSchema.parse(stored) as Cart & JsonValue;
  }
}
