import type {
  ServicePriceType,
  ServiceStatus,
  ServiceUnit,
} from '@apnatown/shared/services';
import type { TxContext } from '../../../shared/persistence/ports';

export const SERVICE_OWNER_REPOSITORY = Symbol('SERVICE_OWNER_REPOSITORY');

/** Stored `services.media` item; Media's public projection reads `assetId`. */
export interface StoredServiceMedia {
  assetId: string;
  showInGallery: boolean;
}

/** Owner-editable listing columns. */
export interface ServiceFields {
  categoryId: string;
  subcategoryId: string;
  nameEn: string;
  nameHi: string | null;
  description: string | null;
  priceType: ServicePriceType;
  priceFromPaise: number | null;
  priceToPaise: number | null;
  unit: ServiceUnit | null;
  included: string[];
  excluded: string[];
  serviceArea: string | null;
  media: StoredServiceMedia[];
  galleryVisible: boolean;
  featuredSelected: boolean;
  status: ServiceStatus;
}

/** A non-deleted service row of one business. */
export interface StoredService extends ServiceFields {
  id: string;
  businessId: string;
  slug: string;
  experienceYears: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServicePosition {
  createdAt: string;
  id: string;
}

/** Services-owned persistence for owner listings (F-VD-014, F-PV-003). */
export interface ServiceOwnerRepository {
  /** Newest first, `(createdAt,id)` keyset; returns up to `limit + 1` rows. */
  page(
    tx: TxContext,
    input: {
      businessId: string;
      status?: ServiceStatus;
      after?: ServicePosition;
      limit: number;
    },
  ): Promise<StoredService[]>;
  /** Non-deleted service of the business; null for any other id. */
  find(
    tx: TxContext,
    input: { businessId: string; serviceId: string; lock?: boolean },
  ): Promise<StoredService | null>;
  /** Unique slug from `base`, serialized per base until commit. */
  allocateSlug(tx: TxContext, base: string): Promise<string>;
  insert(
    tx: TxContext,
    row: ServiceFields & {
      id: string;
      businessId: string;
      slug: string;
      at: Date;
    },
  ): Promise<StoredService>;
  /** Version-guarded full field write; bumps version; null when stale. */
  update(
    tx: TxContext,
    input: {
      businessId: string;
      serviceId: string;
      expectedVersion: number;
      fields: ServiceFields;
      at: Date;
    },
  ): Promise<StoredService | null>;
  /** Version-guarded soft delete; returns the new version or null when stale. */
  softDelete(
    tx: TxContext,
    input: {
      businessId: string;
      serviceId: string;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<number | null>;
}
