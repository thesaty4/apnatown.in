import type {
  RiderApplicationPage,
  RiderApplicationQuery,
  RiderDocumentKind,
  RiderHistory,
  RiderJob,
  RiderOffer,
} from '@apnatown/shared/delivery';
import type { AdminReadContext } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

// ---------------------------------------------------------------------------
// Ports Delivery depends on (adapters in ../infrastructure).
// ---------------------------------------------------------------------------

export const DELIVERY_JOB_READ = Symbol('DELIVERY_JOB_READ');
/**
 * Rider-owned job reads. Jobs/offers/earning snapshots are created from
 * Orders' ready events; until Orders/Payments ship the adapter has no jobs,
 * so every read is an explicit "none" (never sample data).
 */
export interface DeliveryJobReadPort {
  activeJobId(tx: TxContext, riderUserId: string): Promise<string | null>;
  activeJob(tx: TxContext, riderUserId: string): Promise<RiderJob | null>;
  currentOffer(tx: TxContext, riderUserId: string): Promise<RiderOffer | null>;
  /** Delivered jobs whose earned snapshot falls in [from, toExclusive). */
  completedTotals(
    tx: TxContext,
    input: { riderUserId: string; from: Date; toExclusive: Date },
  ): Promise<{ count: number; totalPaise: number }>;
  /** Terminal own jobs, newest first; `from` null means all time. */
  history(
    tx: TxContext,
    input: {
      riderUserId: string;
      from: Date | null;
      toExclusive: Date;
      after?: readonly (string | number)[];
      limit: number;
    },
  ): Promise<RiderHistory[]>;
  /** Own assigned/terminal job only; null for foreign or missing jobs. */
  historyDetail(
    tx: TxContext,
    input: { riderUserId: string; jobId: string },
  ): Promise<RiderHistory | null>;
}

export const RIDER_REQUIREMENTS = Symbol('RIDER_REQUIREMENTS');
export interface RiderRequirementsSnapshot {
  readonly availability: 'available' | 'unavailable';
  readonly version?: string;
  readonly requiredDocumentKinds: readonly RiderDocumentKind[];
}
/** Typed KYC requirement policy (Q-05); unavailable gates submission. */
export interface RiderRequirementsPort {
  current(tx: TxContext): Promise<RiderRequirementsSnapshot>;
}

// ---------------------------------------------------------------------------
// Ports Delivery exposes to other modules.
// ---------------------------------------------------------------------------

export const RIDER_APPLICATIONS_READ = Symbol('RIDER_APPLICATIONS_READ');
/** Scoped rider approval queue for Admin approvals composition (S-ADMN-02). */
export interface RiderApplicationsReadPort {
  list(
    ctx: AdminReadContext,
    query: RiderApplicationQuery,
  ): Promise<RiderApplicationPage>;
}
