import type { TxContext } from '../../../shared/persistence/ports';

export const BUSINESS_ENQUIRY_STATS = Symbol('BUSINESS_ENQUIRY_STATS');

/** Enquiry-created cohort over whole IST days (reporting-v1). */
export interface EnquiryCohortStats {
  /** IST date (YYYY-MM-DD) → enquiries created that day. */
  readonly daily: ReadonlyMap<string, number>;
  /** Current status of each cohort member. */
  readonly statusCounts: Readonly<Record<string, number>>;
  readonly total: number;
  readonly converted: number;
}

/** Implemented by Services (owner of `enquiries`); read-only, own business only. */
export interface BusinessEnquiryStatsPort {
  cohort(
    tx: TxContext,
    input: { businessId: string; fromIstDate: string; toIstDate: string },
  ): Promise<EnquiryCohortStats>;
}
