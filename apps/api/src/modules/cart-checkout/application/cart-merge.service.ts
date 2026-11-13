import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  CART_LINE_MAX_QUANTITY,
  CART_MAX_LINES,
  CartMergeResultSchema,
  type CartMergeResult,
} from '@apnatown/shared/cart';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import type { CartOwner, StoredCart } from './cart-ports';
import { CartSupport, type CartActor } from './cart-support';

type Review = CartMergeResult['review'][number];
type Reason = Review['reasons'][number];

const identity = (line: { productId: string; variantId: string | null }) =>
  `${line.productId}:${line.variantId ?? ''}`;

/**
 * `POST /cart/merge-guest` (F-CK-001, J12; BE rule 1): after login, merges
 * the cookie-bound guest cart into the account cart by (productId,variantId)
 * up to quantity 10. Both carts are locked; the guest cart is consumed in
 * the same transaction and the controller clears its cookie only after the
 * commit. A same-key retry reauthorizes the account owner and replays the
 * recorded result even after the guest cart is gone, so quantities never
 * double and a second guest cart cannot be merged under that key.
 */
@Injectable()
export class CartMergeService {
  constructor(
    private readonly support: CartSupport,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  /**
   * `consumed` is true only when this call merged and deleted the guest cart
   * (not on a replay), so a replayed key never clears a newer guest cookie.
   */
  async merge(actor: CartActor): Promise<{ result: CartMergeResult; consumed: boolean }> {
    if (!actor.principalId) throw new DomainError('SESSION_EXPIRED');
    const account: CartOwner = { kind: 'user', userId: actor.principalId };
    // Not part of the fingerprint: the cookie is cleared after success and
    // a lost-response retry must still replay the recorded merge.
    const tokenHash = this.support.guest.enabled ? this.support.guest.hash(actor.guestCookie) : null;
    let consumed = false;
    const result = await this.support.run(
      actor,
      { name: 'cart.merge-guest', method: 'POST', resource: '/cart/merge-guest', payload: {} },
      null,
      async (tx) => {
        if (!tokenHash) throw new DomainError('CART_NOT_FOUND');
        const merged = await this.mergeInto(tx, account, { kind: 'guest', tokenHash });
        consumed = true;
        return merged as CartMergeResult & JsonValue;
      },
      (stored) => CartMergeResultSchema.parse(stored) as CartMergeResult & JsonValue,
    );
    return { result, consumed };
  }

  private async mergeInto(tx: TxContext, accountOwner: CartOwner, guestOwner: CartOwner) {
    // Fixed lock order (account, then guest) across all merges.
    let account: StoredCart | null = await this.support.find(tx, accountOwner, true);
    const guest = await this.support.find(tx, guestOwner, true);
    if (!guest) throw new DomainError('CART_NOT_FOUND');
    const at = this.support.clock.now();
    const created = !account;
    account ??= await this.support.carts.create(tx, this.ids.uuidv7(), accountOwner, at);
    if (!account) throw new DomainError('CART_VERSION_CONFLICT');
    const existing = created ? [] : await this.support.carts.lines(tx, account.id);
    const byIdentity = new Map(existing.map((line) => [identity(line), line]));
    const clipped = new Set<string>();
    const merged = new Set<string>();
    const dropped: Review[] = [];
    let count = existing.length;
    for (const line of await this.support.carts.lines(tx, guest.id)) {
      const target = byIdentity.get(identity(line));
      if (target) {
        const sum = target.quantity + line.quantity;
        const quantity = Math.min(CART_LINE_MAX_QUANTITY, sum);
        if (sum > CART_LINE_MAX_QUANTITY) clipped.add(target.id);
        // Active wins over saved-for-later.
        const savedForLater = target.savedForLater && line.savedForLater;
        await this.support.carts.updateLine(tx, target.id, { quantity, savedForLater, at });
        merged.add(target.id);
      } else if (count >= CART_MAX_LINES) {
        dropped.push({
          lineId: null,
          productId: line.productId,
          variantId: line.variantId,
          reasons: ['LINE_LIMIT_REACHED'],
        });
      } else {
        const id = this.ids.uuidv7();
        await this.support.carts.insertLine(tx, { ...line, id, cartId: account.id, at });
        byIdentity.set(identity(line), { ...line, id });
        merged.add(id);
        count += 1;
      }
    }
    await this.support.carts.deleteCart(tx, guest.id);
    if (!created) account = { ...account, version: await this.support.carts.touch(tx, account.id, at) };
    const cart = await this.support.view(tx, account);
    const review: Review[] = cart.lines.flatMap((line) => {
      if (!merged.has(line.id)) return [];
      const reasons: Reason[] = [
        ...(clipped.has(line.id) ? (['QUANTITY_CLIPPED'] as const) : []),
        ...line.issues,
      ];
      return reasons.length ? [{ lineId: line.id, productId: line.productId, variantId: line.variantId, reasons }] : [];
    });
    return CartMergeResultSchema.parse({ cart, review: [...review, ...dropped] });
  }
}
