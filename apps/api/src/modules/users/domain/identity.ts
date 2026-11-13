import type {
  AccountStatus,
  Preferences,
  UserRole,
} from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';

export interface UserIdentity {
  id: string;
  phoneCiphertext: string | null;
  phoneLookupHash: Uint8Array | null;
  emailCiphertext: string | null;
  displayName: string | null;
  preferences: Preferences;
  accountStatus: AccountStatus;
  deletedAt: Date | null;
  version: number;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
export interface UsersRepository {
  lockPhone(tx: TxContext, hash: Uint8Array): Promise<void>;
  findPhone(tx: TxContext, hash: Uint8Array): Promise<UserIdentity | null>;
  lock(tx: TxContext, id: string): Promise<UserIdentity | null>;
  insert(tx: TxContext, user: UserIdentity): Promise<void>;
  updateProfile(
    tx: TxContext,
    id: string,
    patch: {
      displayName?: string;
      emailCiphertext?: string | null;
    },
    now: Date,
  ): Promise<UserIdentity>;
  updatePreferences(
    tx: TxContext,
    id: string,
    patch: Partial<Preferences>,
    now: Date,
  ): Promise<Preferences>;
  /** Data-request deletion: blocks new sessions/writes before erasure. */
  markDeleting(tx: TxContext, id: string, now: Date): Promise<UserIdentity>;
  /** Removes optional profile data; phone retention is Q-32-gated. */
  eraseProfile(tx: TxContext, id: string, now: Date): Promise<void>;
  /** Final anonymized tombstone; the row stays for foreign keys. */
  markDeleted(tx: TxContext, id: string, now: Date): Promise<UserIdentity>;
}
