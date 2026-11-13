import type {
  DataRequestFailureCode,
  DataRequestStatus,
  DataRequestType,
} from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';

/** One owner-module receipt; never personal data. */
export interface DataRequestStep {
  receipt: string;
  status: 'completed' | 'blocked';
  reasonCode?: string | undefined;
}
export interface StoredDataRequest {
  id: string;
  userId: string;
  type: DataRequestType;
  status: DataRequestStatus;
  idempotencyKey: string;
  policyVersion: string | null;
  completedSteps: Record<string, DataRequestStep>;
  artifactStorageKey: string | null;
  artifactExpiresAt: Date | null;
  completionTokenHash: Uint8Array | null;
  completionTokenExpiresAt: Date | null;
  failureCode: DataRequestFailureCode | null;
  requestedAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}
export type DataRequestPatch = Partial<
  Pick<
    StoredDataRequest,
    | 'status'
    | 'policyVersion'
    | 'completedSteps'
    | 'artifactStorageKey'
    | 'artifactExpiresAt'
    | 'completionTokenHash'
    | 'completionTokenExpiresAt'
    | 'failureCode'
    | 'completedAt'
  >
> & { updatedAt: Date };

/** AEAD context binding a private export artifact to its owner and request. */
export function exportArtifactContext(userId: string, requestId: string) {
  return `user:${userId}:data-request:${requestId}:export`;
}

export const DATA_REQUEST_REPOSITORY = Symbol('DATA_REQUEST_REPOSITORY');
export interface DataRequestRepository {
  /** Row lock through commit; callers check ownership before use. */
  lock(tx: TxContext, id: string): Promise<StoredDataRequest | null>;
  findByKey(
    tx: TxContext,
    userId: string,
    idempotencyKey: string,
  ): Promise<StoredDataRequest | null>;
  /** Latest non-completed deletion; at most one exists per user. */
  openDeletion(
    tx: TxContext,
    userId: string,
  ): Promise<StoredDataRequest | null>;
  /** Latest queued/processing export. */
  activeExport(
    tx: TxContext,
    userId: string,
  ): Promise<StoredDataRequest | null>;
  insert(tx: TxContext, row: StoredDataRequest): Promise<void>;
  update(
    tx: TxContext,
    id: string,
    patch: DataRequestPatch,
  ): Promise<StoredDataRequest>;
}
