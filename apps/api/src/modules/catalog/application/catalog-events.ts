import { Inject, Injectable } from '@nestjs/common';
import {
  CATALOG_EVENT_TYPES,
  CatalogHomeSectionsChangedPayloadSchema,
  CatalogKeywordMappingChangedPayloadSchema,
  CatalogSuggestionEventPayloadSchema,
  CatalogTaxonomyChangedPayloadSchema,
  type CatalogHomeSectionsChangedPayload,
  type CatalogKeywordMappingChangedPayload,
  type CatalogSuggestionEventPayload,
  type CatalogTaxonomyChangedPayload,
} from '@apnatown/shared';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';

const SUGGESTION_EVENT = {
  pending: CATALOG_EVENT_TYPES.suggestionSubmitted,
  approved: CATALOG_EVENT_TYPES.suggestionApproved,
  rejected: CATALOG_EVENT_TYPES.suggestionRejected,
  merged: CATALOG_EVENT_TYPES.suggestionMerged,
} as const;

/**
 * Catalog outbox events, appended in the write transaction and published
 * after commit: Notifications (suggestions) and Search cache invalidation
 * (taxonomy, keyword mappings, Home sections). Never sent inline.
 */
@Injectable()
export class CatalogEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  /** `submitted` for a new pending suggestion, otherwise the decision. */
  suggestion(
    tx: TxContext,
    payload: CatalogSuggestionEventPayload,
    correlationId: string,
  ): Promise<void> {
    const data = CatalogSuggestionEventPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        SUGGESTION_EVENT[data.status],
        {
          type: 'subcategory_suggestion',
          id: data.suggestionId,
          version: data.version,
        },
        data,
        correlationId,
      ),
    );
  }

  taxonomyChanged(
    tx: TxContext,
    payload: CatalogTaxonomyChangedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = CatalogTaxonomyChangedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        CATALOG_EVENT_TYPES.taxonomyChanged,
        { type: data.entity, id: data.entityId, version: data.version },
        data,
        correlationId,
      ),
    );
  }

  keywordMappingChanged(
    tx: TxContext,
    payload: CatalogKeywordMappingChangedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = CatalogKeywordMappingChangedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        CATALOG_EVENT_TYPES.keywordMappingChanged,
        { type: 'keyword_mapping', id: data.mappingId, version: data.version },
        data,
        correlationId,
      ),
    );
  }

  homeSectionsChanged(
    tx: TxContext,
    payload: CatalogHomeSectionsChangedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = CatalogHomeSectionsChangedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        CATALOG_EVENT_TYPES.homeSectionsChanged,
        {
          type: 'catalog_home_section',
          id: data.sectionId,
          version: data.version,
        },
        data,
        correlationId,
      ),
    );
  }
}
