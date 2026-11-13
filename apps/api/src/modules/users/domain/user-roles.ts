import type { Preferences, UserRole } from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';

export const USER_ROLES_REPOSITORY = Symbol('USER_ROLES_REPOSITORY');
export interface UserRolesRepository {
  /** Idempotent: an existing membership is left unchanged. */
  insert(
    tx: TxContext,
    userId: string,
    role: UserRole,
    now: Date,
  ): Promise<void>;
  /** Membership of a live, active account. */
  hasActive(tx: TxContext, userId: string, role: UserRole): Promise<boolean>;
  activeHolders(
    tx: TxContext,
    role: UserRole,
    page: { afterUserId?: string | undefined; limit: number },
  ): Promise<string[]>;
  /** Live members of `role` among `userIds`, with phone ciphertext. */
  contacts(
    tx: TxContext,
    role: UserRole,
    userIds: readonly string[],
  ): Promise<{ userId: string; phoneCiphertext: string | null }[]>;
  findIdByPhoneHash(tx: TxContext, hash: Uint8Array): Promise<string | null>;
  describe(
    tx: TxContext,
    userIds: readonly string[],
  ): Promise<
    {
      userId: string;
      displayName: string | null;
      locale: Preferences['locale'];
    }[]
  >;
}
