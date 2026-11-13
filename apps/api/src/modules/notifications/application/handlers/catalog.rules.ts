import { Inject, Injectable } from '@nestjs/common';
import {
  CATALOG_EVENT_TYPES,
  CatalogSuggestionEventPayloadSchema,
  type EventEnvelope,
} from '@apnatown/shared';
import { DomainError } from '../../../../shared/errors/errors';
import type { TxContext } from '../../../../shared/persistence/ports';
import {
  CATALOG_READ,
  type CatalogReadPort,
  type SuggestionNotice,
} from '../../../catalog/application/catalog-ports';
import type { NotifyCommand } from '../notification-publisher';
import { NotificationRecipients } from '../notification-recipients';
import { payload, type NotificationRule } from '../notification-rule';
import { alertScope } from './alert-scope';

/** `catalog.subcategory_suggestion.submitted` -> A(catalog, suggester scope). */
@Injectable()
export class SuggestionSubmittedRule implements NotificationRule {
  readonly name = 'suggestion-submitted';
  readonly eventTypes = [CATALOG_EVENT_TYPES.suggestionSubmitted];
  constructor(private readonly recipients: NotificationRecipients) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand> {
    const input = payload(CatalogSuggestionEventPayloadSchema, event);
    const scope = alertScope('catalog', input.cityId, input.areaId);
    return {
      templateKey: 'admin.alert',
      params: { subject: 'subcategory_suggestion' },
      link: `/admin/subcategory-suggestions?tab=pending&suggestionId=${input.suggestionId}`,
      resourceScope: scope,
      recipients: await this.recipients.admins(tx, scope),
    };
  }
}

/**
 * approved/rejected/merged -> original submitter with the business's
 * vendor/provider audience. Name and return path come from Catalog's
 * version-bound `suggestionNotice`, never guessed from IDs.
 */
@Injectable()
export class SuggestionDecidedRule implements NotificationRule {
  readonly name = 'suggestion-decided';
  readonly eventTypes = [
    CATALOG_EVENT_TYPES.suggestionApproved,
    CATALOG_EVENT_TYPES.suggestionRejected,
    CATALOG_EVENT_TYPES.suggestionMerged,
  ];
  constructor(
    private readonly recipients: NotificationRecipients,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
  ) {}

  async command(
    tx: TxContext,
    event: EventEnvelope,
  ): Promise<NotifyCommand | null> {
    const input = payload(CatalogSuggestionEventPayloadSchema, event);
    const notice = await this.notice(input.suggestionId, input.version);
    if (!notice || notice.submitterUserId !== input.submitterUserId) return null;
    const business = await this.recipients.business(tx, notice.businessId);
    if (!business) return null;
    const owner = business.ownerUserId === notice.submitterUserId;
    const recipient = owner
      ? await this.recipients.owner(tx, business, false)
      : {
          userId: notice.submitterUserId,
          audienceRole: notice.audienceRole,
          suppressed: 'target_unavailable' as const,
        };
    return {
      templateKey: 'subcategory.decided',
      params: {
        status: input.status,
        name: notice.nameEn,
        ...(notice.nameHi ? { name_hi: notice.nameHi } : {}),
      },
      link: notice.returnPath,
      recipients: [recipient],
    };
  }

  /** A superseded/removed suggestion yields no notice instead of a retry loop. */
  private async notice(
    suggestionId: string,
    version: number,
  ): Promise<SuggestionNotice | null> {
    try {
      return await this.catalog.suggestionNotice({ suggestionId, version });
    } catch (error) {
      if (
        error instanceof DomainError &&
        (error.code === 'SUGGESTION_NOT_FOUND' ||
          error.code === 'CATALOG_VERSION_CONFLICT' ||
          error.code === 'BUSINESS_NOT_FOUND')
      )
        return null;
      throw error;
    }
  }
}
