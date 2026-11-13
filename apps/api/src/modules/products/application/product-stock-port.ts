import type { TxContext } from '../../../shared/persistence/ports';

export const PRODUCT_STOCK = Symbol('PRODUCT_STOCK');

export interface StockLine {
  readonly productId: string;
  readonly quantity: number;
}

export interface StockResult {
  readonly stocks: readonly { productId: string; version: number; onHand: number }[];
}

/**
 * Products-owned trusted stock mutation (`ProductsStockPort`, orders BE
 * spec). Only Orders calls it, inside its unit of work, together with its
 * durable `order_stock_operations` claim; there is no public decrement.
 * Labels share product-level stock, so callers pass product totals.
 */
export interface ProductStockPort {
  /**
   * Locks inventory rows in product-ID order and decrements them. Throws
   * PRODUCT_NOT_AVAILABLE when any product is missing, deleted, not for sale
   * or short; nothing is written in that case (the caller's UoW rolls back).
   */
  reserve(tx: TxContext, lines: readonly StockLine[], at: Date): Promise<StockResult>;
  /** Restores previously reserved quantities (cancellation). */
  release(tx: TxContext, lines: readonly StockLine[], at: Date): Promise<StockResult>;
}
