import { Inject, Injectable } from '@nestjs/common';
import {
  FeatureFlagUpdatedPayloadSchema,
  LegalUpdatedPayloadSchema,
  SETTINGS_EVENT_TYPES,
  SettingsGroupUpdatedPayloadSchema,
  SettingsUpdatedPayloadSchema,
  SupportMessageSubmittedPayloadSchema,
  type FeatureFlagUpdatedPayload,
  type LegalUpdatedPayload,
  type SettingsGroupUpdatedPayload,
  type SettingsUpdatedPayload,
  type SupportMessageSubmittedPayload,
} from '@apnatown/shared/settings';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';

/** Outbox events, appended in the command transaction; published after commit. */
@Injectable()
export class SettingsEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  settingUpdated(
    tx: TxContext,
    payload: SettingsUpdatedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = SettingsUpdatedPayloadSchema.parse(payload);
    return this.append(
      tx,
      SETTINGS_EVENT_TYPES.settingsUpdated,
      { type: 'setting', id: data.changeSetId, version: data.version },
      data,
      correlationId,
    );
  }

  groupUpdated(
    tx: TxContext,
    payload: SettingsGroupUpdatedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = SettingsGroupUpdatedPayloadSchema.parse(payload);
    return this.append(
      tx,
      SETTINGS_EVENT_TYPES.settingsGroupUpdated,
      { type: 'settings_group', id: data.changeSetId, version: 1 },
      data,
      correlationId,
    );
  }

  flagUpdated(
    tx: TxContext,
    changeSetId: string,
    payload: FeatureFlagUpdatedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = FeatureFlagUpdatedPayloadSchema.parse(payload);
    return this.append(
      tx,
      SETTINGS_EVENT_TYPES.featureFlagUpdated,
      { type: 'feature_flag', id: changeSetId, version: data.version },
      data,
      correlationId,
    );
  }

  legalUpdated(
    tx: TxContext,
    changeSetId: string,
    payload: LegalUpdatedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = LegalUpdatedPayloadSchema.parse(payload);
    return this.append(
      tx,
      SETTINGS_EVENT_TYPES.legalUpdated,
      { type: 'legal_page', id: changeSetId, version: data.version },
      data,
      correlationId,
    );
  }

  supportSubmitted(
    tx: TxContext,
    payload: SupportMessageSubmittedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = SupportMessageSubmittedPayloadSchema.parse(payload);
    return this.append(
      tx,
      SETTINGS_EVENT_TYPES.supportMessageSubmitted,
      { type: 'support_message', id: data.messageId, version: 1 },
      data,
      correlationId,
    );
  }

  private append(
    tx: TxContext,
    type: string,
    aggregate: { type: string; id: string; version: number },
    payload: Parameters<EventFactory['create']>[2],
    correlationId: string,
  ): Promise<void> {
    return this.outbox.append(
      tx,
      this.events.create(type, aggregate, payload, correlationId),
    );
  }
}
