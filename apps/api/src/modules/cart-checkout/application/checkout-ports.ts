import type { CheckoutQuote } from '@apnatown/shared/checkout';
import type { PaymentMethod } from '@apnatown/shared/orders';
import type { TxContext } from '../../../shared/persistence/ports';

export const CHECKOUT_REPOSITORY = Symbol('CHECKOUT_REPOSITORY');

export interface StoredQuote {
  readonly id: string;
  readonly cartId: string;
  readonly cartVersion: number;
  readonly addressId: string | null;
  readonly addressVersion: number | null;
  readonly snapshot: unknown;
  readonly expiresAt: Date;
}

export interface StoredAttempt {
  readonly id: string;
  readonly quoteId: string;
  readonly status: string;
  readonly paymentMethod: PaymentMethod;
  readonly paymentRound: number;
  readonly version: number;
  readonly createdAt: Date;
}

/** Cart-checkout-owned `checkout_quotes`/`checkout_attempts`. */
export interface CheckoutRepository {
  insertQuote(
    tx: TxContext,
    input: {
      quote: CheckoutQuote;
      cartId: string;
      userId: string;
      inputHash: string;
      at: Date;
    },
  ): Promise<void>;
  /** The caller's own quote only. */
  findQuote(tx: TxContext, quoteId: string, userId: string): Promise<StoredQuote | null>;
  insertAttempt(
    tx: TxContext,
    input: {
      id: string;
      userId: string;
      cartId: string;
      quoteId: string;
      keyHash: string;
      requestHash: string;
      paymentMethod: PaymentMethod;
      expiresAt: Date;
      at: Date;
    },
  ): Promise<void>;
  findAttempt(tx: TxContext, attemptId: string, userId: string): Promise<StoredAttempt | null>;
}
