import type {
  RiderApplicationPage,
  RiderApplicationQuery,
  RiderDocumentKind,
} from '@apnatown/shared/delivery';
import type { AdminReadContext } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredJob } from '../domain/delivery-job';

// ---------------------------------------------------------------------------
// Ports Delivery depends on (adapters in ../infrastructure).
// ---------------------------------------------------------------------------

export const DELIVERY_JOB_READ = Symbol('DELIVERY_JOB_READ');
/**
 * Rider-owned job reads over persisted `delivery_jobs` rows. DTOs are
 * composed by the application (Orders/Payments projections), never here.
 */
export interface DeliveryJobReadPort {
  activeJobId(tx: TxContext, riderUserId: string): Promise<string | null>;
  /** The rider's single active (accepted..reached_drop) job. */
  activeJob(tx: TxContext, riderUserId: string): Promise<StoredJob | null>;
  /** Delivered jobs whose earned snapshot falls in [from, toExclusive). */
  completedTotals(
    tx: TxContext,
    input: { riderUserId: string; from: Date; toExclusive: Date },
  ): Promise<{ count: number; totalPaise: number }>;
  /** Terminal own jobs by terminal time, newest first; `from` null = all time. */
  history(
    tx: TxContext,
    input: {
      riderUserId: string;
      from: Date | null;
      toExclusive: Date;
      after?: readonly (string | number)[];
      limit: number;
      deliveredOnly?: boolean;
    },
  ): Promise<StoredJob[]>;
  /** Own terminal job only; null for foreign, active or missing jobs. */
  historyDetail(
    tx: TxContext,
    input: { riderUserId: string; jobId: string },
  ): Promise<StoredJob | null>;
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
