import type { TxContext } from '../../../shared/persistence/ports';

export const EARNINGS_READ = Symbol('EARNINGS_READ');

/** Payments' owner-side financial reads for one business. */
export interface EarningsReadPort {
  /**
   * IST month (YYYY-MM) → fulfilled (delivered/picked up) orders whose
   * payment attempt is paid/collected, valued at fulfilled items − discount
   * (delivery and platform fees are not the seller's sales).
   */
  monthlySales(
    tx: TxContext,
    input: { businessId: string; fromIstMonth: string },
  ): Promise<Map<string, { grossPaise: number; orders: number }>>;
  /** Plan code + paid-through of the subscription covering `at`, if any. */
  activeSubscription(
    tx: TxContext,
    input: { businessId: string; at: Date },
  ): Promise<{ planKey: string; endsAt: string | null } | null>;
}
