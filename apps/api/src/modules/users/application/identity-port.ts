import type { Principal } from '@apnatown/shared/auth';
import type { TxContext } from '../../../shared/persistence/ports';

export const USER_IDENTITY = Symbol('USER_IDENTITY');
export interface UserIdentityPort {
  resolveVerifiedPhone(
    tx: TxContext,
    normalizedPhone: string,
  ): Promise<Principal | null>;
  readPrincipal(tx: TxContext, userId: string): Promise<Principal | null>;
}
