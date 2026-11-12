import type { UserRole } from '@apnatown/shared/users';
import type { AdminReadContext } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

export const USER_ROLES = Symbol('USER_ROLES');
/** Calling module; Users enforces the caller/role allow-list. */
export type ApprovedRoleCaller = 'admin' | 'businesses' | 'delivery';
export interface UserRolePort {
  /**
   * Internal, idempotent grant inside the caller's transaction. Businesses may
   * grant vendor/provider, Delivery rider, Admin alone admin/super_admin.
   */
  assignApprovedRole(
    input: {
      userId: string;
      role: UserRole;
      sourceId: string;
      caller: ApprovedRoleCaller;
    },
    tx: TxContext,
  ): Promise<void>;
  /** Current membership of a live, active account; never cached. */
  hasActiveRole(
    input: { userId: string; role: UserRole },
    tx?: TxContext,
  ): Promise<boolean>;
  /** Keyset page of live, active holders ordered by user ID. */
  activeHolders(
    input: {
      role: 'admin' | 'super_admin';
      afterUserId?: string | undefined;
      limit: number;
    },
    tx?: TxContext,
  ): Promise<string[]>;
}

export const USER_ADMIN_READ = Symbol('USER_ADMIN_READ');
export interface UserAdminReadPort {
  /**
   * super_admin admin-management purpose only: ≤50 existing admin user IDs →
   * full contact phone. Non-admin IDs are omitted.
   */
  adminContacts(
    ctx: AdminReadContext,
    input: { userIds: readonly string[] },
    tx?: TxContext,
  ): Promise<{ userId: string; phoneE164: string }[]>;
}
