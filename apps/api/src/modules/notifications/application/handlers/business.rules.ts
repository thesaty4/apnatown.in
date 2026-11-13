import { Injectable } from '@nestjs/common';
import {
  BUSINESS_EVENT_TYPES,
  BusinessEventPayloadSchema,
  SERVICES_EVENT_TYPES,
  ServiceEnquiryCreatedPayloadSchema,
  type EventEnvelope,
} from '@apnatown/shared';
import type { BusinessStatus } from '@apnatown/shared/businesses';
import type { TxContext } from '../../../../shared/persistence/ports';
import type { NotifyCommand } from '../notification-publisher';
import { NotificationRecipients } from '../notification-recipients';
import { payload, type NotificationRule } from '../notification-rule';
import { alertScope } from './alert-scope';

const APPROVAL_SEGMENT = { vendor: 'business', provider: 'provider' } as const;
const DECISIONS: ReadonlySet<BusinessStatus> = new Set([
  'approved',
  'rejected',
  'changes_requested',
  'suspended',
  'inactive',
]);

/** `business.application.submitted` -> A(approvals, business scope). */
@Injectable()
export class BusinessSubmittedRule implements NotificationRule {
  readonly name = 'business-submitted';
  readonly eventTypes = [BUSINESS_EVENT_TYPES.applicationSubmitted];
  constructor(private readonly recipients: NotificationRecipients) {}

  async command(
    tx: TxContext,
    event: EventEnvelope,
  ): Promise<NotifyCommand | null> {
    const input = payload(BusinessEventPayloadSchema, event);
    const business = await this.recipients.business(tx, input.businessId);
    if (!business) return null;
    const scope = alertScope('approvals', input.cityId, input.areaId);
    return {
      templateKey: 'admin.alert',
      params: {
        subject:
          business.audienceRole === 'vendor'
            ? 'business_application'
            : 'provider_application',
      },
      link: `/admin/approvals/${APPROVAL_SEGMENT[business.audienceRole]}/${input.businessId}`,
      resourceScope: scope,
      recipients: await this.recipients.admins(tx, scope),
    };
  }
}

/** `business.application.decision_changed` -> applicant/owner (vendor|provider). */
@Injectable()
export class BusinessDecisionRule implements NotificationRule {
  readonly name = 'business-decision';
  readonly eventTypes = [BUSINESS_EVENT_TYPES.decisionChanged];
  constructor(private readonly recipients: NotificationRecipients) {}

  async command(
    tx: TxContext,
    event: EventEnvelope,
  ): Promise<NotifyCommand | null> {
    const input = payload(BusinessEventPayloadSchema, event);
    if (!DECISIONS.has(input.status)) return null;
    const business = await this.recipients.business(tx, input.businessId);
    if (!business) return null;
    const role = business.audienceRole;
    // The exact decided owner from the event; a mismatch is never redirected.
    const recipient =
      business.ownerUserId === input.ownerUserId
        ? await this.recipients.owner(tx, business, false)
        : {
            userId: input.ownerUserId,
            audienceRole: role,
            suppressed: 'target_unavailable' as const,
          };
    return {
      templateKey: 'approval.decided',
      params: { status: input.status },
      link:
        input.status === 'approved' ? `/${role}/overview` : `/${role}/onboarding`,
      recipients: [recipient],
    };
  }
}

/** `service.enquiry.created` -> B (owner holding the live seller role). */
@Injectable()
export class EnquiryCreatedRule implements NotificationRule {
  readonly name = 'enquiry-created';
  readonly eventTypes = [SERVICES_EVENT_TYPES.enquiryCreated];
  constructor(private readonly recipients: NotificationRecipients) {}

  async command(
    tx: TxContext,
    event: EventEnvelope,
  ): Promise<NotifyCommand | null> {
    const input = payload(ServiceEnquiryCreatedPayloadSchema, event);
    const business = await this.recipients.business(tx, input.businessId);
    if (!business) return null;
    return {
      // No enquirer name/phone/message: the owner opens the inbox detail.
      templateKey: 'enquiry.new',
      params: {},
      link: `/${business.audienceRole}/enquiries/${input.enquiryId}`,
      recipients: [await this.recipients.owner(tx, business, true)],
    };
  }
}
