import type { TxContext } from '../../../shared/persistence/ports';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

/** Exactly one owner: an account or a hashed guest-cart capability. */
export type CartOwner =
  | { readonly kind: 'user'; readonly userId: string }
  | { readonly kind: 'guest'; readonly tokenHash: Uint8Array };

export interface StoredCart {
  readonly id: string;
  readonly version: number;
}

export interface StoredCartLine {
  readonly id: string;
  readonly version: number;
  readonly productId: string;
  readonly variantId: string | null;
  readonly quantity: number;
  readonly savedForLater: boolean;
}

export interface CartLookup {
  /** Lock the cart row FOR UPDATE (commands only). */
  readonly lock: boolean;
  /** Guest carts last written before this instant are expired (Q-70). */
  readonly guestNotBefore: Date | null;
}

export interface NewCartLine {
  readonly id: string;
  readonly cartId: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly quantity: number;
  readonly savedForLater: boolean;
  readonly at: Date;
}

export interface CartRepository {
  find(tx: TxContext, owner: CartOwner, lookup: CartLookup): Promise<StoredCart | null>;
  /** Version-1 insert; null when a concurrent first command won the owner. */
  create(tx: TxContext, id: string, owner: CartOwner, at: Date): Promise<StoredCart | null>;
  /** Increments the cart version; returns the new version. */
  touch(tx: TxContext, cartId: string, at: Date): Promise<number>;
  deleteCart(tx: TxContext, cartId: string): Promise<void>;
  lines(tx: TxContext, cartId: string): Promise<StoredCartLine[]>;
  insertLine(tx: TxContext, line: NewCartLine): Promise<void>;
  /** Writes quantity/saved and increments the line version. */
  updateLine(
    tx: TxContext,
    lineId: string,
    change: { quantity: number; savedForLater: boolean; at: Date },
  ): Promise<void>;
  deleteLine(tx: TxContext, lineId: string): Promise<void>;
}
