import { Inject, Injectable } from '@nestjs/common';
import type { ScopeRef } from '@apnatown/shared/admin';
import type { UserRole } from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  ADMIN_RECIPIENTS,
  type AdminRecipientsPort,
} from '../../admin/application/admin-recipients.port';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  NOTIFICATION_BUSINESS_CONTEXT,
  type NotificationBusinessContextPort,
  type NotificationBusinessRecipient,
} from './notification-ports';
import type { AlertScope } from '../domain/notification';
import type { NotificationRecipient } from './notification-publisher';

const ADMIN_PAGE = 500;

/**
 * Live recipient eligibility through owner ports only (Users, Admin,
 * Businesses). Ineligible recipients are returned with an explicit
 * suppression reason so the outcome is recorded truthfully.
 */
@Injectable()
export class NotificationRecipients {
  constructor(
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(ADMIN_RECIPIENTS)
    private readonly adminRecipients: AdminRecipientsPort,
    @Inject(NOTIFICATION_BUSINESS_CONTEXT)
    private readonly businesses: NotificationBusinessContextPort,
  ) {}

  /** Active account holding `role` now (customer, or a live seller role). */
  async user(
    tx: TxContext,
    userId: string,
    role: UserRole,
  ): Promise<NotificationRecipient> {
    const principal = await this.identity.readPrincipal(tx, userId);
    if (!principal)
      return { userId, audienceRole: role, suppressed: 'subject_inactive' };
    if (!principal.roles.includes(role))
      return { userId, audienceRole: role, suppressed: 'scope_revoked' };
    return { userId, audienceRole: role };
  }

  /** Current owner of a live business; null when it no longer exists. */
  business(
    tx: TxContext,
    businessId: string,
  ): Promise<NotificationBusinessRecipient | null> {
    return this.businesses.recipient(tx, businessId);
  }

  /**
   * Applicant/owner of the business with the vendor/provider audience. With
   * `requireRole`, the owner must currently hold that seller role (B);
   * otherwise the owning application capability suffices (applicant feed).
   */
  async owner(
    tx: TxContext,
    business: NotificationBusinessRecipient,
    requireRole: boolean,
  ): Promise<NotificationRecipient> {
    const audienceRole = business.audienceRole;
    const userId = business.ownerUserId;
    if (business.deleted)
      return { userId, audienceRole, suppressed: 'target_unavailable' };
    if (requireRole) return this.user(tx, userId, audienceRole);
    const principal = await this.identity.readPrincipal(tx, userId);
    return principal
      ? { userId, audienceRole }
      : { userId, audienceRole, suppressed: 'subject_inactive' };
  }

  /** A(module, scope): active view-authorized scoped admins + super admins. */
  async admins(
    tx: TxContext,
    alert: AlertScope,
  ): Promise<NotificationRecipient[]> {
    const scope: ScopeRef = { cityId: alert.cityId, areaId: alert.areaId };
    const recipients: NotificationRecipient[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.adminRecipients.list(
        {
          module: alert.module,
          action: 'view',
          scope,
          limit: ADMIN_PAGE,
          ...(cursor ? { cursor } : {}),
        },
        tx,
      );
      for (const item of page.items)
        recipients.push({ userId: item.userId, audienceRole: item.audienceRole });
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    return recipients;
  }
}
