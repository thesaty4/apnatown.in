import type { AdminModule, ScopeRef } from '@apnatown/shared/admin';
import type { TxContext } from '../../../shared/persistence/ports';

export const ADMIN_RECIPIENTS = Symbol('ADMIN_RECIPIENTS');
export interface AdminRecipient {
  userId: string;
  audienceRole: 'admin' | 'super_admin';
}
/**
 * Admin-owned recipient resolution for Notifications: active, currently
 * authorized recipients only. Global/unresolved scopes resolve to super
 * admins, never all area admins.
 */
export interface AdminRecipientsPort {
  list(
    input: {
      module: AdminModule;
      action: 'view';
      scope: ScopeRef;
      cursor?: string;
      limit: number;
    },
    tx?: TxContext,
  ): Promise<{ items: AdminRecipient[]; nextCursor: string | null }>;
}
