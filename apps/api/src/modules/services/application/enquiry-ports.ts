import type {
  EnquiryStatus,
  EnquiryStatusCounts,
} from '@apnatown/shared/services';
import type { TxContext } from '../../../shared/persistence/ports';

export const ENQUIRY_REPOSITORY = Symbol('ENQUIRY_REPOSITORY');

/** Owner of a currently enquirable (public active) service. */
export interface EnquirableService {
  serviceId: string;
  businessId: string;
}

/** Stored row for owner reads. The phone stays ciphertext until the service decrypts it. */
export interface StoredEnquiry {
  id: string;
  serviceId: string;
  serviceSlug: string;
  serviceNameEn: string;
  serviceNameHi: string | null;
  businessId: string;
  customerUserId: string | null;
  name: string;
  phoneCiphertext: string;
  message: string;
  preferredDate: string | null;
  status: EnquiryStatus;
  version: number;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type EnquiryInboxRow = Omit<StoredEnquiry, 'phoneCiphertext'>;

export interface EnquiryPosition {
  createdAt: string;
  id: string;
}

/** Services-owned enquiry persistence (parameterized SQL only). */
export interface EnquiryRepository {
  /**
   * The service when it is active, not deleted and its business is publicly
   * visible (Businesses' public context + active service taxonomy); else null.
   */
  enquirableService(
    tx: TxContext,
    serviceId: string,
  ): Promise<EnquirableService | null>;
  insert(
    tx: TxContext,
    input: {
      id: string;
      serviceId: string;
      businessId: string;
      customerUserId: string | null;
      name: string;
      phoneCiphertext: string;
      message: string;
      preferredDate: string | null;
      at: Date;
    },
  ): Promise<void>;
  /** Newest first by `(createdAt,id)`; returns up to `limit + 1` rows. */
  page(
    tx: TxContext,
    input: {
      businessId: string;
      status?: EnquiryStatus;
      query?: string;
      after?: EnquiryPosition;
      limit: number;
    },
  ): Promise<EnquiryInboxRow[]>;
  /** Counts per status for the owner and `query`, ignoring any status filter. */
  statusCounts(
    tx: TxContext,
    input: { businessId: string; query?: string },
  ): Promise<EnquiryStatusCounts>;
  /** Row of this business only (ownership is part of the predicate). */
  find(
    tx: TxContext,
    input: { businessId: string; enquiryId: string; lock?: boolean },
  ): Promise<StoredEnquiry | null>;
  /**
   * Version-guarded transition from `from` to `to`; the first `converted_at`
   * is kept. Returns the updated row or null when the guard did not match.
   */
  transition(
    tx: TxContext,
    input: {
      businessId: string;
      enquiryId: string;
      from: EnquiryStatus;
      to: EnquiryStatus;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<StoredEnquiry | null>;
}
