import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  CART_LINE_MAX_QUANTITY,
  CART_MAX_LINES,
  type AddCartLine,
  type Cart,
  type CartLineVersions,
  type UpdateCartLine,
} from '@apnatown/shared/cart';
import { DomainError, type ErrorCode } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import type { CartProductView } from '../../products/application/product-cart-read-port';
import type { CartOwner, StoredCart, StoredCartLine } from './cart-ports';
import { CartSupport, type CartActor } from './cart-support';

type Locked = { cart: StoredCart; lines: StoredCartLine[] };

/** Server-side purchasability of a product + nullable label (BE rule 2). */
export function selectionError(
  product: CartProductView | undefined,
  variantId: string | null,
): 'PRODUCT_NOT_AVAILABLE' | 'CART_LINE_INVALID' | null {
  if (!product || !product.visible || product.pricePaise === null)
    return 'PRODUCT_NOT_AVAILABLE';
  const labelled = product.variants.length > 0;
  if (labelled !== (variantId !== null)) return 'CART_LINE_INVALID';
  if (variantId !== null && !product.variants.some((v) => v.id === variantId))
    return 'CART_LINE_INVALID';
  if (!product.stock.availableForSale || product.stock.onHand <= 0)
    return 'PRODUCT_NOT_AVAILABLE';
  return null;
}

/** All labels of a product contend for its single shared stock. */
function activeOtherQuantity(lines: readonly StoredCartLine[], productId: string, exceptId: string | null) {
  return lines
    .filter((l) => !l.savedForLater && l.productId === productId && l.id !== exceptId)
    .reduce((sum, l) => sum + l.quantity, 0);
}

/** Cart line commands (F-CK-001): key + optimistic cart/line versions. */
@Injectable()
export class CartLinesService {
  constructor(
    private readonly support: CartSupport,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  add(actor: CartActor, input: AddCartLine): Promise<Cart> {
    const owner = this.support.commandOwner(actor);
    return this.command(actor, owner, 'add', 'POST', '/cart/lines', input, async (tx) => {
      const { lines, created, ...locked } = await this.lockForAdd(tx, owner, input.expectedCartVersion);
      let cart = locked.cart;
      const product = (await this.support.products.forCart(tx, [input.productId])).get(input.productId);
      const invalid = selectionError(product, input.variantId);
      if (invalid || !product) throw new DomainError(invalid ?? 'PRODUCT_NOT_AVAILABLE');
      const existing = lines.find(
        (l) => l.productId === input.productId && l.variantId === input.variantId,
      );
      if (!existing && lines.length >= CART_MAX_LINES) throw new DomainError('CART_LINE_INVALID');
      const quantity = (existing?.quantity ?? 0) + input.quantity;
      if (
        quantity > CART_LINE_MAX_QUANTITY ||
        activeOtherQuantity(lines, input.productId, existing?.id ?? null) + quantity >
          product.stock.onHand
      )
        throw new DomainError('CART_QUANTITY_INVALID');
      const at = this.support.clock.now();
      if (existing)
        await this.support.carts.updateLine(tx, existing.id, { quantity, savedForLater: false, at });
      else
        await this.support.carts.insertLine(tx, {
          id: this.ids.uuidv7(),
          cartId: cart.id,
          productId: input.productId,
          variantId: input.variantId,
          quantity,
          savedForLater: false,
          at,
        });
      if (!created) cart = { ...cart, version: await this.support.carts.touch(tx, cart.id, at) };
      return this.support.view(tx, cart);
    });
  }

  update(actor: CartActor, lineId: string, input: UpdateCartLine): Promise<Cart> {
    const owner = this.support.commandOwner(actor);
    return this.lineCommand(actor, owner, 'update', 'PATCH', lineId, input, async (tx, locked, line) => {
      if (!line.savedForLater && input.quantity > line.quantity)
        await this.assertStock(tx, locked.lines, line, input.quantity, 'CART_QUANTITY_INVALID');
      return { quantity: input.quantity, savedForLater: line.savedForLater };
    });
  }

  remove(actor: CartActor, lineId: string, input: CartLineVersions): Promise<Cart> {
    const owner = this.support.commandOwner(actor);
    return this.lineCommand(actor, owner, 'remove', 'DELETE', lineId, input, () =>
      Promise.resolve(null),
    );
  }

  saveForLater(actor: CartActor, lineId: string, input: CartLineVersions): Promise<Cart> {
    const owner = this.support.commandOwner(actor);
    return this.lineCommand(actor, owner, 'save', 'POST', lineId, input, (_tx, _locked, line) =>
      Promise.resolve({ quantity: line.quantity, savedForLater: true }),
    );
  }

  /** Restore revalidates label, availability and shared stock. */
  restore(actor: CartActor, lineId: string, input: CartLineVersions): Promise<Cart> {
    const owner = this.support.commandOwner(actor);
    return this.lineCommand(actor, owner, 'restore', 'POST', lineId, input, async (tx, locked, line) => {
      if (line.savedForLater)
        await this.assertStock(tx, locked.lines, line, line.quantity, 'CART_LINE_INVALID');
      return { quantity: line.quantity, savedForLater: false };
    });
  }

  private async assertStock(
    tx: TxContext,
    lines: readonly StoredCartLine[],
    line: StoredCartLine,
    quantity: number,
    code: ErrorCode,
  ) {
    const product = (await this.support.products.forCart(tx, [line.productId])).get(line.productId);
    if (
      !product ||
      selectionError(product, line.variantId) ||
      activeOtherQuantity(lines, line.productId, line.id) + quantity > product.stock.onHand
    )
      throw new DomainError(code);
  }

  private async lockForAdd(tx: TxContext, owner: CartOwner, expected: number) {
    const cart = await this.support.find(tx, owner, true);
    if (cart) {
      if (cart.version !== expected) throw new DomainError('CART_VERSION_CONFLICT');
      return { cart, lines: await this.support.carts.lines(tx, cart.id), created: false };
    }
    // Version 0 addresses only the transient empty cart.
    if (expected !== 0) throw new DomainError('CART_VERSION_CONFLICT');
    const created = await this.support.carts.create(tx, this.ids.uuidv7(), owner, this.support.clock.now());
    if (!created) throw new DomainError('CART_VERSION_CONFLICT');
    return { cart: created, lines: [] as StoredCartLine[], created: true };
  }

  /** Locks the owner's cart, then checks line ownership before versions. */
  private lineCommand(
    actor: CartActor,
    owner: CartOwner,
    action: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    lineId: string,
    input: CartLineVersions | UpdateCartLine,
    change: (
      tx: TxContext,
      locked: Locked,
      line: StoredCartLine,
    ) => Promise<{ quantity: number; savedForLater: boolean } | null>,
  ): Promise<Cart> {
    const suffix = action === 'save' ? '/save-for-later' : action === 'restore' ? '/restore' : '';
    return this.command(actor, owner, action, method, `/cart/lines/${lineId}${suffix}`, input, async (tx) => {
      const cart = await this.support.find(tx, owner, true);
      const lines = cart ? await this.support.carts.lines(tx, cart.id) : [];
      const line = lines.find((l) => l.id === lineId);
      if (!cart || !line) throw new DomainError('CART_LINE_NOT_FOUND');
      if (cart.version !== input.expectedCartVersion || line.version !== input.expectedVersion)
        throw new DomainError('CART_VERSION_CONFLICT');
      const next = await change(tx, { cart, lines }, line);
      const at = this.support.clock.now();
      if (next) await this.support.carts.updateLine(tx, line.id, { ...next, at });
      else await this.support.carts.deleteLine(tx, line.id);
      const version = await this.support.carts.touch(tx, cart.id, at);
      return this.support.view(tx, { ...cart, version });
    });
  }

  private command(
    actor: CartActor,
    owner: CartOwner,
    action: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    resource: string,
    input: AddCartLine | UpdateCartLine | CartLineVersions,
    work: (tx: TxContext) => Promise<Cart>,
  ): Promise<Cart> {
    return this.support.run(
      actor,
      { name: `cart.lines.${action}`, method, resource, payload: input as JsonValue },
      owner,
      async (tx) => (await work(tx)) as Cart & JsonValue,
      (stored) => this.support.parseCart(stored),
    );
  }
}
