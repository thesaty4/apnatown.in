import type { TxContext } from '../../../shared/persistence/ports';

export interface StoredAddress {
  id: string;
  userId: string;
  label: string;
  addressText: string; // AEAD ciphertext, never plaintext
  landmark: string | null; // AEAD ciphertext
  pinCode: string;
  cityId: string;
  areaId: string | null;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface AddressPosition {
  createdAt: string;
  id: string;
}
export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');
export interface AddressRepository {
  list(
    tx: TxContext,
    userId: string,
    limit: number,
    after?: AddressPosition,
  ): Promise<StoredAddress[]>;
  /** Owner is checked before any decryption; tombstones permit protected command replay. */
  lock(tx: TxContext, id: string): Promise<StoredAddress | null>;
  defaultAddress(tx: TxContext, userId: string): Promise<StoredAddress | null>;
  insert(tx: TxContext, row: StoredAddress): Promise<void>;
  /** CAS includes immutable owner, live state and version. */
  update(
    tx: TxContext,
    row: StoredAddress,
    expectedVersion: number,
  ): Promise<boolean>;
}
