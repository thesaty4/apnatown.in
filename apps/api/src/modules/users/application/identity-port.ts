import type { Principal } from '@apnatown/shared/auth';
import type { TxContext } from '../../../shared/persistence/ports';

export const USER_IDENTITY = Symbol('USER_IDENTITY');
export interface UserIdentityPort {
  resolveVerifiedPhone(
    tx: TxContext,
    normalizedPhone: string,
  ): Promise<Principal | null>;
  readPrincipal(tx: TxContext, userId: string): Promise<Principal | null>;
  /**
   * Verified login phone (E.164) of a live, active user, for owning modules
   * that must snapshot it server-side (Businesses application contact).
   * Locks the user row through commit; null for missing/inactive users.
   */
  verifiedPhone(tx: TxContext, userId: string): Promise<string | null>;
  /** Exact live-user lookup by verified phone; never creates a user. */
  findByPhone(tx: TxContext, phone: string): Promise<string | null>;
  /** Minimal display data for privileged labels; no contact fields. */
  describe(
    tx: TxContext,
    userIds: readonly string[],
  ): Promise<
    { userId: string; displayName: string | null; locale: 'en' | 'hi' }[]
  >;
}
