import type {
  RiderDecisionAction,
  RiderStatus,
  RiderVehicleType,
} from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';

/** Stored rider application/profile (`rider_profiles`), ciphertext only. */
export interface StoredRider {
  userId: string;
  cityId: string | null;
  areaId: string | null;
  fullName: string | null;
  vehicleType: RiderVehicleType | null;
  vehicleNumber: string | null;
  payoutUpiCiphertext: string | null;
  payoutBankCiphertext: string | null;
  status: RiderStatus;
  decisionReason: string | null;
  requirementsVersion: string | null;
  submittedAt: string | null;
  isOnline: boolean;
  preferredLocale: 'en' | 'hi';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredRiderDocument {
  kind: 'selfie' | 'licence' | 'id_proof' | 'rc' | 'other';
  assetId: string;
  createdAt: string;
}

/** Allow-listed draft columns; undefined leaves a column unchanged. */
export interface RiderDraftChanges {
  fullName?: string;
  cityId?: string | null;
  areaId?: string | null;
  vehicleType?: RiderVehicleType;
  vehicleNumber?: string | null;
  payoutUpiCiphertext?: string;
  payoutBankCiphertext?: string | null;
}

export interface RiderVisibility {
  platformWide: boolean;
  cityIds: readonly string[];
  areaIds: readonly string[];
}

export const RIDER_REPOSITORY = Symbol('RIDER_REPOSITORY');
export interface RiderRepository {
  find(tx: TxContext, userId: string, lock?: boolean): Promise<StoredRider | null>;
  /** First draft; false when a row already exists (concurrent create). */
  insertDraft(
    tx: TxContext,
    input: { userId: string; locale: 'en' | 'hi'; changes: RiderDraftChanges; at: Date },
  ): Promise<boolean>;
  updateDraft(
    tx: TxContext,
    input: { userId: string; expectedVersion: number; changes: RiderDraftChanges; at: Date },
  ): Promise<boolean>;
  transition(
    tx: TxContext,
    input: {
      userId: string;
      expectedVersion: number;
      status: RiderStatus;
      reason?: string | null;
      submittedAt?: Date;
      at: Date;
    },
  ): Promise<boolean>;
  /** Operational state (no application version change); offline clears location. */
  setOnline(tx: TxContext, input: { userId: string; online: boolean; at: Date }): Promise<void>;
  /** Latest point only, for an approved online rider; false otherwise. */
  recordLocation(
    tx: TxContext,
    input: { userId: string; lat: number; lng: number; at: Date },
  ): Promise<boolean>;
  documents(tx: TxContext, userId: string): Promise<StoredRiderDocument[]>;
  scopedPage(
    tx: TxContext,
    input: {
      status: RiderStatus;
      visibility: RiderVisibility;
      after?: [string, string];
      limit: number;
    },
  ): Promise<StoredRider[]>;
}

/** ST-approval (rider) admin edges. */
export const RIDER_DECISION_EDGES: Readonly<
  Record<RiderDecisionAction, { from: readonly RiderStatus[]; to: RiderStatus }>
> = {
  approve: { from: ['pending'], to: 'approved' },
  reject: { from: ['pending'], to: 'rejected' },
  request_changes: { from: ['pending'], to: 'changes_requested' },
  suspend: { from: ['approved'], to: 'suspended' },
  restore: { from: ['suspended'], to: 'approved' },
};

/** Applicant-editable states; suspended cannot edit/resubmit itself. */
export const RIDER_EDITABLE: readonly RiderStatus[] = [
  'draft',
  'rejected',
  'changes_requested',
];

export function allowedRiderActions(status: RiderStatus): RiderDecisionAction[] {
  return (Object.keys(RIDER_DECISION_EDGES) as RiderDecisionAction[]).filter(
    (action) => RIDER_DECISION_EDGES[action].from.includes(status),
  );
}

/** Fields required at submit (the prototype's onboarding source fields). */
export const RIDER_REQUIRED_FIELDS = [
  'profile.fullName',
  'profile.cityId',
  'profile.areaId',
  'vehicle.type',
  'payout.upi',
] as const;

export function missingRiderFields(rider: StoredRider | null): string[] {
  const present: Record<(typeof RIDER_REQUIRED_FIELDS)[number], boolean> = {
    'profile.fullName': rider?.fullName != null,
    'profile.cityId': rider?.cityId != null,
    'profile.areaId': rider?.areaId != null,
    'vehicle.type': rider?.vehicleType != null,
    'payout.upi': rider?.payoutUpiCiphertext != null,
  };
  return RIDER_REQUIRED_FIELDS.filter((field) => !present[field]);
}

/** The application's validated Geo scope; unresolved needs super_admin. */
export function riderScope(rider: StoredRider) {
  return rider.areaId && rider.cityId
    ? { cityId: rider.cityId, areaId: rider.areaId }
    : { cityId: null, areaId: null };
}
