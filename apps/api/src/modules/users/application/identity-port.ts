import type { Principal } from '@apnatown/shared/auth';
import type { TxContext } from '../../../shared/persistence/ports';

export const USER_IDENTITY = Symbol('USER_IDENTITY');
export interface UserIdentityPort {
  resolveVerifiedPhone(
    tx: TxContext,
    normalizedPhone: string,
  ): Promise<Principal | null>;
  readPrincipal(tx: TxContext, userId: string): Promise<Principal | null>;
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
