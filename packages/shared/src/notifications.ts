import { z } from 'zod';
import {
  ConsentChannelSchema,
  ConsentNoticeVersionSchema,
  ConsentPurposeSchema,
  UserRoleSchema,
} from './users.js';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

// ---------------------------------------------------------------------------
// Notifications (F-NT-001, F-NT-002, F-X-012). In-app feed, own preferences
// and the trusted matrix vocabulary. Params/bodies never carry codes, phones,
// addresses or private evidence.
// ---------------------------------------------------------------------------

export const NotificationCategorySchema = z.enum([
  'order',
  'offer',
  'review',
  'approval',
  'enquiry',
  'job',
  'admin',
  'system',
  'follow',
]);
export type NotificationCategory = z.infer<typeof NotificationCategorySchema>;
export const NotificationTopicSchema = z.enum([
  'orders',
  'offers',
  'enquiries',
  'system',
  'follower_updates',
]);
export type NotificationTopic = z.infer<typeof NotificationTopicSchema>;
export const NotificationIntentSchema = z.enum(['transactional', 'marketing']);
export type NotificationIntent = z.infer<typeof NotificationIntentSchema>;
export const NotificationChannelSchema = z.enum(['in_app', 'email', 'whatsapp']);
export type NotificationChannelKind = z.infer<typeof NotificationChannelSchema>;
export const NotificationDeliveryStatusSchema = z.enum([
  'queued',
  'sending',
  'sent',
  'delivered',
  'failed',
  'suppressed',
]);
export type NotificationDeliveryStatus = z.infer<
  typeof NotificationDeliveryStatusSchema
>;
export const NotificationSuppressionReasonSchema = z.enum([
  'preference_off',
  'consent_withdrawn',
  'channel_disabled',
  'subject_inactive',
  'scope_revoked',
  'target_unavailable',
  'policy_unresolved',
]);
export type NotificationSuppressionReason = z.infer<
  typeof NotificationSuppressionReasonSchema
>;
/** Seeded (EN/HI) templates whose producer events exist today. */
export const NotificationTemplateKeySchema = z.enum([
  'admin.alert',
  'approval.decided',
  'enquiry.new',
  'subcategory.decided',
  'comment.decided',
  'support.received',
  'order.new',
  'order.status',
  'order.cancelled',
]);
export type NotificationTemplateKey = z.infer<
  typeof NotificationTemplateKeySchema
>;

// Feed ----------------------------------------------------------------------

export const NotificationRoleSchema = UserRoleSchema;
export const NotificationRoleQuerySchema = z.strictObject({
  role: NotificationRoleSchema,
});
export type NotificationRoleQuery = z.infer<typeof NotificationRoleQuerySchema>;
export const NotificationFeedQuerySchema = PageQuerySchema.extend({
  role: NotificationRoleSchema,
});
export type NotificationFeedQuery = z.infer<typeof NotificationFeedQuerySchema>;
export const NotificationParamsSchema = z.strictObject({ id: IdSchema });
export type NotificationParams = z.infer<typeof NotificationParamsSchema>;
/**
 * Allow-listed internal path: no scheme/host, no traversal, and no `%`, `#`
 * or backslash so encoded separators (%2F, %5C) cannot smuggle a path. Mirrors
 * the `notifications_link_internal` DB CHECK.
 */
export const NotificationLinkSchema = z
  .string()
  .max(300)
  .regex(/^\/(?!\/)[A-Za-z0-9\-._~/?=&]*$/)
  .refine((path) => !path.includes('..'));
export const NotificationItemSchema = z.strictObject({
  id: IdSchema,
  category: NotificationCategorySchema,
  /** Rendered server-side as plain text in the viewer's locale. */
  title: z.string().max(200).nullable(),
  body: z.string().max(1000),
  link: NotificationLinkSchema.nullable(),
  read: z.boolean(),
  createdAt: TimestampSchema,
});
export type NotificationItem = z.infer<typeof NotificationItemSchema>;
export const NotificationPageSchema = z.strictObject({
  items: z.array(NotificationItemSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type NotificationPage = z.infer<typeof NotificationPageSchema>;
export const NotificationUnreadCountSchema = z.strictObject({
  count: CountSchema,
});
export type NotificationUnreadCount = z.infer<
  typeof NotificationUnreadCountSchema
>;

// Preferences ---------------------------------------------------------------

export const NOTIFICATION_PREFERENCE_KEYS = Object.freeze([
  'inapp',
  'email',
  'wa_orders',
  'wa_offers',
  'wa_enq',
] as const);
export const NotificationPreferenceKeySchema = z.enum(
  NOTIFICATION_PREFERENCE_KEYS,
);
export type NotificationPreferenceKey = z.infer<
  typeof NotificationPreferenceKeySchema
>;
/** Prototype display defaults; these are NOT recorded consent. */
export const NOTIFICATION_PREFERENCE_DEFAULTS = Object.freeze({
  inapp: true,
  email: true,
  wa_orders: false,
  wa_offers: false,
  wa_enq: false,
} as const satisfies Record<NotificationPreferenceKey, boolean>);
export const NotificationPreferenceConsentSchema = z.strictObject({
  key: NotificationPreferenceKeySchema,
  purpose: ConsentPurposeSchema,
  channel: ConsentChannelSchema,
  /** True for WhatsApp keys: enabling requires a current grant. */
  required: z.boolean(),
  granted: z.boolean(),
  consentId: IdSchema.nullable(),
  recordedAt: TimestampSchema.nullable(),
});
export const NotificationPreferencesSchema = z.strictObject({
  inapp: z.boolean(),
  email: z.boolean(),
  wa_orders: z.boolean(),
  wa_offers: z.boolean(),
  wa_enq: z.boolean(),
  version: VersionSchema,
  /** Notice a grant must acknowledge; null means grants are unavailable. */
  currentNoticeVersion: ConsentNoticeVersionSchema.nullable(),
  consents: z.array(NotificationPreferenceConsentSchema).max(5),
});
export type NotificationPreferences = z.infer<
  typeof NotificationPreferencesSchema
>;
export const NotificationConsentAcknowledgementSchema = z.strictObject({
  purpose: ConsentPurposeSchema,
  channel: ConsentChannelSchema,
  noticeVersion: ConsentNoticeVersionSchema,
});
export const NotificationPreferencesUpdateSchema = z
  .strictObject({
    inapp: z.boolean().optional(),
    email: z.boolean().optional(),
    wa_orders: z.boolean().optional(),
    wa_offers: z.boolean().optional(),
    wa_enq: z.boolean().optional(),
    expectedVersion: VersionSchema,
    consentAcknowledgements: z
      .array(NotificationConsentAcknowledgementSchema)
      .max(5)
      .optional(),
  })
  .refine((input) =>
    NOTIFICATION_PREFERENCE_KEYS.some((key) => input[key] !== undefined),
  );
export type NotificationPreferencesUpdate = z.infer<
  typeof NotificationPreferencesUpdateSchema
>;
export const NotificationUnsubscribeMarketingSchema = z.strictObject({
  expectedVersion: VersionSchema,
});
export type NotificationUnsubscribeMarketing = z.infer<
  typeof NotificationUnsubscribeMarketingSchema
>;
export const NotificationConsentWithdrawalSchema = z.strictObject({
  purpose: ConsentPurposeSchema,
  channel: ConsentChannelSchema,
  consentId: IdSchema,
  recordedAt: TimestampSchema,
});
export const NotificationUnsubscribeMarketingResultSchema = z.strictObject({
  preferences: NotificationPreferencesSchema,
  withdrawn: z.array(NotificationConsentWithdrawalSchema).max(3),
});
export type NotificationUnsubscribeMarketingResult = z.infer<
  typeof NotificationUnsubscribeMarketingResultSchema
>;
