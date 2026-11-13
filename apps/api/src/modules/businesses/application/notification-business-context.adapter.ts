import { Inject, Injectable } from '@nestjs/common';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  NotificationBusinessContextPort,
  NotificationBusinessRecipient,
} from '../../notifications/application/notification-ports';
import {
  BUSINESS_REPOSITORY,
  ROLE_FOR_KIND,
  type BusinessRepository,
} from '../domain/business';

/**
 * Businesses-owned binding of Notifications' NOTIFICATION_BUSINESS_CONTEXT:
 * least-privilege owner/audience/scope only (no contact fields, no name).
 * Applicant capability = roles of the user's non-deleted businesses, so an
 * applicant without a seller role can read its own decision notices.
 */
@Injectable()
export class NotificationBusinessContextAdapter
  implements NotificationBusinessContextPort
{
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
  ) {}

  async recipient(
    tx: TxContext,
    businessId: string,
  ): Promise<NotificationBusinessRecipient | null> {
    const row = await this.businesses.find(tx, businessId);
    if (!row) return null;
    return {
      businessId: row.id,
      ownerUserId: row.ownerUserId,
      audienceRole: ROLE_FOR_KIND[row.kind],
      cityId: row.cityId,
      areaId: row.areaId,
      deleted: row.deletedAt !== null,
    };
  }

  async applicantRoles(
    tx: TxContext,
    userId: string,
  ): Promise<readonly ('vendor' | 'provider')[]> {
    const rows = await this.businesses.ownedBy(tx, { ownerUserId: userId });
    return [...new Set(rows.map((row) => ROLE_FOR_KIND[row.kind]))];
  }
}
