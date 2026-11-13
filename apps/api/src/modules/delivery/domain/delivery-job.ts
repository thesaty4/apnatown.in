import type {
  DeliveryAssignmentState,
  DeliveryJobStatus,
  RiderVehicleType,
} from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';

/** Offer countdown (rule 2; ST-delivery-job "expires after 60 s"). */
export const DELIVERY_OFFER_TTL_MS = 60_000;

export const ACTIVE_JOB_STATUSES = ['accepted', 'reached_shop', 'picked_up', 'reached_drop'] as const;
export const TERMINAL_JOB_STATUSES = ['delivered', 'failed', 'cancelled'] as const;
export type DeliveryFailReason = 'customer_unreachable' | 'wrong_address' | 'customer_cancelled' | 'vehicle_problem';

export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

export interface JobEstimate {
  readonly basePaise: number;
  readonly perKmPaise: number;
  readonly totalPaise: number;
  readonly settingsVersion: string;
  readonly estimatedAt: string;
}

export interface JobEarned {
  readonly basePaise: number;
  readonly perKmPaise: number;
  readonly distanceM: number;
  readonly distancePayPaise: number;
  readonly roundingPaise: number;
  readonly totalPaise: number;
  readonly settingsVersion: string;
  readonly earnedAt: string;
}

/** `delivery_jobs` row (ISO-8601 UTC instants). */
export interface StoredJob {
  readonly id: string;
  readonly orderId: string;
  readonly cityId: string;
  readonly areaId: string;
  readonly riderUserId: string | null;
  readonly status: DeliveryJobStatus;
  readonly assignmentState: DeliveryAssignmentState;
  readonly failReason: DeliveryFailReason | null;
  readonly distanceM: number;
  readonly estimate: JobEstimate;
  readonly earned: JobEarned | null;
  readonly payableFinancialVersion: number;
  readonly checkedItemIds: readonly string[];
  readonly version: number;
  readonly acceptedAt: string | null;
  readonly deliveredAt: string | null;
  readonly failedAt: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
}

export interface StoredOffer {
  readonly id: string;
  readonly jobId: string;
  readonly riderUserId: string;
  readonly status: 'offered' | 'accepted' | 'rejected' | 'expired' | 'revoked';
  readonly expiresAt: Date;
  readonly version: number;
}

export interface NewJob {
  readonly id: string;
  readonly orderId: string;
  readonly cityId: string;
  readonly areaId: string;
  readonly pickup: GeoPoint;
  readonly drop: GeoPoint;
  readonly distanceM: number;
  readonly estimate: Omit<JobEstimate, 'estimatedAt'>;
  readonly payableFinancialVersion: number;
  readonly at: Date;
}

/** Progress write: status + its timestamp column (allow-listed in the adapter). */
export interface JobProgress {
  readonly id: string;
  readonly expectedVersion: number;
  readonly status: 'reached_shop' | 'picked_up' | 'reached_drop' | 'failed';
  readonly failReason?: DeliveryFailReason;
  readonly checked?: { readonly itemIds: readonly string[]; readonly financialVersion: number };
  readonly at: Date;
}

export const DELIVERY_JOB_REPOSITORY = Symbol('DELIVERY_JOB_REPOSITORY');
/** Owning `delivery_jobs` writes/locks; null results mean a version/state miss. */
export interface DeliveryJobRepository {
  distanceM(tx: TxContext, from: GeoPoint, to: GeoPoint): Promise<number>;
  /** Null when a job already exists for the order (unique order_id). */
  insert(tx: TxContext, job: NewJob): Promise<StoredJob | null>;
  byOrder(tx: TxContext, orderId: string, lock?: boolean): Promise<StoredJob | null>;
  find(tx: TxContext, jobId: string, lock?: boolean): Promise<StoredJob | null>;
  setAssignmentState(
    tx: TxContext,
    input: { id: string; expectedVersion: number; state: 'offered' | 'unassigned' | 'queued'; at: Date },
  ): Promise<StoredJob | null>;
  /** requested/offered -> accepted + assigned rider; unique active-rider backstop. */
  assign(
    tx: TxContext,
    input: { id: string; expectedVersion: number; riderUserId: string; at: Date },
  ): Promise<StoredJob | null>;
  progress(tx: TxContext, input: JobProgress): Promise<StoredJob | null>;
  deliver(
    tx: TxContext,
    input: { id: string; expectedVersion: number; earned: Omit<JobEarned, 'earnedAt'>; at: Date },
  ): Promise<StoredJob | null>;
}

/** Eligible-rider row for the owner picker (no phone/KYC/payout). */
export interface CandidateRow {
  readonly riderUserId: string;
  readonly status: string;
  readonly fullName: string | null;
  readonly vehicleType: RiderVehicleType | null;
  readonly vehicleNumber: string | null;
  readonly cityId: string;
  readonly areaId: string | null;
  readonly online: boolean;
  readonly busy: boolean;
  readonly pendingOffer: boolean;
  readonly declined: boolean;
  readonly distanceM: number | null;
}

export interface RiderPublicRow {
  readonly fullName: string | null;
  readonly vehicleType: RiderVehicleType | null;
  readonly vehicleNumber: string | null;
}

export const DELIVERY_OFFER_REPOSITORY = Symbol('DELIVERY_OFFER_REPOSITORY');
/** Owning `delivery_offers` writes plus dispatch candidate reads. */
export interface DeliveryOfferRepository {
  insert(
    tx: TxContext,
    offer: { id: string; jobId: string; riderUserId: string; expiresAt: Date; at: Date },
  ): Promise<StoredOffer>;
  find(tx: TxContext, offerId: string, lock?: boolean): Promise<StoredOffer | null>;
  liveForJob(tx: TxContext, jobId: string, lock?: boolean): Promise<StoredOffer | null>;
  /** The rider's unexpired live offer, newest first. */
  currentFor(tx: TxContext, riderUserId: string, now: Date): Promise<StoredOffer | null>;
  respond(
    tx: TxContext,
    input: { id: string; expectedVersion: number; status: 'accepted' | 'rejected' | 'expired' | 'revoked'; at: Date },
  ): Promise<boolean>;
  /** Live offers past expiry (worker sweep), oldest first. */
  dueIds(tx: TxContext, now: Date, limit: number): Promise<string[]>;
  /** Next auto-assign candidate (decision D-RD-01 ordering) or null. */
  nextCandidate(tx: TxContext, input: { jobId: string; cityId: string; now: Date }): Promise<string | null>;
  /** Same eligibility for one rider; null when the rider has no profile. */
  candidate(
    tx: TxContext,
    input: { jobId: string | null; cityId: string; riderUserId: string; now: Date; pickup?: GeoPoint },
  ): Promise<CandidateRow | null>;
  /** Approved online riders of the city, nearest first (≤ 50). */
  candidates(
    tx: TxContext,
    input: { jobId: string | null; cityId: string; now: Date; pickup?: GeoPoint },
  ): Promise<CandidateRow[]>;
  riderPublic(tx: TxContext, riderUserId: string): Promise<RiderPublicRow | null>;
}

const EDGES = {
  reached_shop: { from: ['accepted'], to: 'reached_shop' },
  picked_up: { from: ['reached_shop'], to: 'picked_up' },
  reached_drop: { from: ['picked_up'], to: 'reached_drop' },
  fail: { from: ACTIVE_JOB_STATUSES, to: 'failed' },
} as const;
export type RiderEvent = keyof typeof EDGES;

/** ST-delivery-job rider edge, or null when not allowed from `status`. */
export function riderEdge(status: DeliveryJobStatus, event: RiderEvent) {
  const edge = EDGES[event];
  return (edge.from as readonly string[]).includes(status) ? edge.to : null;
}

export type RiderJobAction = 'reached_shop' | 'picked_up' | 'reached_drop' | 'fail' | 'complete';
export function riderJobActions(status: DeliveryJobStatus): RiderJobAction[] {
  const actions: RiderJobAction[] = (Object.keys(EDGES) as RiderEvent[]).filter(
    (event) => event !== 'fail' && riderEdge(status, event),
  );
  if (status === 'reached_drop') actions.push('complete');
  if (riderEdge(status, 'fail')) actions.push('fail');
  return actions;
}

/**
 * Rule 12: total = round_to_nearest_rupee(base + perKm × distanceM / 1000)
 * on the exact expression; the displayed distance component is rounded to
 * whole paise and the signed rounding reconciles the breakdown.
 */
export function riderEarning(basePaise: number, perKmPaise: number, distanceM: number) {
  const exactMilli = BigInt(basePaise) * 1000n + BigInt(perKmPaise) * BigInt(distanceM);
  const totalPaise = Number(((exactMilli + 50_000n) / 100_000n) * 100n);
  const distancePayPaise = Number((BigInt(perKmPaise) * BigInt(distanceM) + 500n) / 1000n);
  return { distancePayPaise, totalPaise, roundingPaise: totalPaise - basePaise - distancePayPaise };
}

/** "Bike · UP57 AB 2210"-style label; null when no vehicle is recorded. */
export function vehicleLabel(type: RiderVehicleType | null, number: string | null): string | null {
  if (!type) return null;
  const name = type.charAt(0).toUpperCase() + type.slice(1);
  return (number ? `${name} · ${number}` : name).slice(0, 40);
}
