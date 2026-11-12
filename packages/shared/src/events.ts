import { z } from 'zod';
import {
  CorrelationIdSchema,
  IdSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import {
  AccountStatusSchema,
  ConsentChannelSchema,
  ConsentPurposeSchema,
  DataRequestFailureCodeSchema,
  DataRequestTypeSchema,
} from './users.js';
import { CityStatusSchema, ZoneStatusSchema } from './geo.js';
import { SuggestionStatusSchema } from './catalog.js';

export const EventEnvelopeSchema = z.strictObject({
  id: IdSchema,
  type: z
    .string()
    .max(128)
    .regex(/^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/),
  schemaVersion: VersionSchema,
  aggregateType: z
    .string()
    .max(64)
    .regex(/^[a-z][a-z0-9_-]*$/),
  aggregateId: IdSchema,
  aggregateVersion: VersionSchema,
  payload: z.json(),
  correlationId: CorrelationIdSchema,
  occurredAt: TimestampSchema,
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

// Users consent evidence (BR-11). Published only on an effective change.
export const CONSENT_EVENT_TYPES = Object.freeze({
  granted: 'consent.granted',
  withdrawn: 'consent.withdrawn',
} as const);
export const ConsentEventTypeSchema = z.enum([
  CONSENT_EVENT_TYPES.granted,
  CONSENT_EVENT_TYPES.withdrawn,
]);
export const ConsentEventPayloadSchema = z
  .strictObject({
    userId: IdSchema.optional(),
    anonymousSubjectId: IdSchema.optional(),
    purpose: ConsentPurposeSchema,
    channel: ConsentChannelSchema,
    consentId: IdSchema,
    recordedAt: TimestampSchema,
  })
  .refine(
    (value) =>
      (value.userId === undefined) !== (value.anonymousSubjectId === undefined),
  );
export type ConsentEventType = z.infer<typeof ConsentEventTypeSchema>;
export type ConsentEventPayload = z.infer<typeof ConsentEventPayloadSchema>;

// Users data requests (F-AU-008, F-AC-004). IDs only; never personal data.
export const DATA_REQUEST_EVENT_TYPES = Object.freeze({
  created: 'user.data_request.created',
  completed: 'user.data_request.completed',
  failed: 'user.data_request.failed',
} as const);
export const USER_ACCOUNT_EVENT_TYPES = Object.freeze({
  deleted: 'user.account.deleted',
} as const);
export const DataRequestEventPayloadSchema = z.strictObject({
  requestId: IdSchema,
  userId: IdSchema,
  type: DataRequestTypeSchema,
});
export const DataRequestFailedEventPayloadSchema =
  DataRequestEventPayloadSchema.extend({
    status: z.enum(['failed', 'blocked']),
    failureCode: DataRequestFailureCodeSchema,
  });
export const UserAccountEventPayloadSchema = z.strictObject({
  userId: IdSchema,
  status: AccountStatusSchema,
  version: VersionSchema,
});
export type DataRequestEventPayload = z.infer<
  typeof DataRequestEventPayloadSchema
>;
export type DataRequestFailedEventPayload = z.infer<
  typeof DataRequestFailedEventPayloadSchema
>;
export type UserAccountEventPayload = z.infer<
  typeof UserAccountEventPayloadSchema
>;

// Geo (F-SA-004). Consumers invalidate city/serviceability and checkout quote
// caches and deduplicate by event ID; checkout still rechecks current state.
export const GEO_EVENT_TYPES = Object.freeze({
  cityStatusChanged: 'geo.city.status_changed',
  zoneChanged: 'geo.zone.changed',
} as const);
export const GeoCityStatusChangedPayloadSchema = z.strictObject({
  cityId: IdSchema,
  previousStatus: CityStatusSchema,
  status: CityStatusSchema,
  version: VersionSchema,
});
export const GeoZoneChangedPayloadSchema = z.strictObject({
  zoneId: IdSchema,
  cityId: IdSchema,
  change: z.enum(['created', 'updated', 'deleted']),
  /** null after deletion. */
  status: ZoneStatusSchema.nullable(),
  version: VersionSchema,
});
export type GeoCityStatusChangedPayload = z.infer<
  typeof GeoCityStatusChangedPayloadSchema
>;
export type GeoZoneChangedPayload = z.infer<typeof GeoZoneChangedPayloadSchema>;

/** Catalog taxonomy, Home section, suggestion and keyword-mapping events. */
export const CATALOG_EVENT_TYPES = Object.freeze({
  suggestionSubmitted: 'catalog.subcategory_suggestion.submitted',
  suggestionApproved: 'catalog.subcategory_suggestion.approved',
  suggestionRejected: 'catalog.subcategory_suggestion.rejected',
  suggestionMerged: 'catalog.subcategory_suggestion.merged',
  taxonomyChanged: 'catalog.taxonomy.changed',
  keywordMappingChanged: 'catalog.keyword_mapping.changed',
  homeSectionsChanged: 'catalog.home_sections.changed',
} as const);

export const CatalogSuggestionEventPayloadSchema = z.strictObject({
  suggestionId: IdSchema,
  categoryId: IdSchema,
  businessId: IdSchema,
  submitterUserId: IdSchema,
  cityId: IdSchema,
  areaId: IdSchema,
  status: SuggestionStatusSchema,
  version: VersionSchema,
  subcategoryId: IdSchema.nullable(),
  mergedIntoSubcategoryId: IdSchema.nullable(),
});
export type CatalogSuggestionEventPayload = z.infer<
  typeof CatalogSuggestionEventPayloadSchema
>;
export const CatalogTaxonomyChangedPayloadSchema = z.strictObject({
  entity: z.enum(['category', 'subcategory']),
  entityId: IdSchema,
  categoryId: IdSchema,
  change: z.enum(['created', 'updated']),
  version: VersionSchema,
});
export type CatalogTaxonomyChangedPayload = z.infer<
  typeof CatalogTaxonomyChangedPayloadSchema
>;
export const CatalogKeywordMappingChangedPayloadSchema = z.strictObject({
  mappingId: IdSchema,
  change: z.enum(['created', 'updated', 'deleted']),
  version: VersionSchema,
});
export type CatalogKeywordMappingChangedPayload = z.infer<
  typeof CatalogKeywordMappingChangedPayloadSchema
>;
export const CatalogHomeSectionsChangedPayloadSchema = z.strictObject({
  sectionId: IdSchema,
  change: z.enum(['created', 'updated', 'activated', 'deactivated', 'removed']),
  version: VersionSchema,
});
export type CatalogHomeSectionsChangedPayload = z.infer<
  typeof CatalogHomeSectionsChangedPayloadSchema
>;
