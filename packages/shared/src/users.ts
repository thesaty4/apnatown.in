import { z } from 'zod';
import {
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

export const UserRoleSchema = z.enum([
  'customer',
  'vendor',
  'provider',
  'rider',
  'admin',
  'super_admin',
]);
export const AccountStatusSchema = z.enum(['active', 'suspended', 'deleting']);
export const LocaleSchema = z.enum(['en', 'hi']);
export const ThemeSchema = z.enum(['light', 'dark', 'auto']);
export const PhoneInputSchema = z.string().regex(/^(?:\+91)?[6-9]\d{9}$/);
export function normalizePhone(phone: string): string {
  const parsed = PhoneInputSchema.parse(phone);
  return parsed.startsWith('+91') ? parsed : `+91${parsed}`;
}

const displayName = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine(
    (value) =>
      !/[<>]/u.test(value) &&
      [...value].every(
        (character) =>
          character.codePointAt(0)! >= 32 && character !== '\u007f',
      ),
  );
const email = z.email().max(254);
export const UpdateProfileSchema = z
  .strictObject({
    displayName: displayName.optional(),
    email: email.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export const PreferencesSchema = z.strictObject({
  locale: LocaleSchema,
  theme: ThemeSchema,
});
export const UpdatePreferencesSchema = PreferencesSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
);
export const ProfileSchema = z.strictObject({
  userId: IdSchema,
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  displayName: displayName.nullable(),
  email: email.nullable(),
  version: VersionSchema,
});
export type UserRole = z.infer<typeof UserRoleSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;

// Plain text only; bounded before encryption, SQL binding or receipt encoding.
const addressTextField = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value));
const addressFields = {
  label: addressTextField(60),
  addressText: addressTextField(1000),
  landmark: addressTextField(200).nullable(),
  pinCode: z.string().regex(/^[0-9]{6}$/),
  cityId: IdSchema,
  areaId: IdSchema.nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  isDefault: z.boolean(),
};
const pairedCoordinates = (value: {
  lat?: number | null | undefined;
  lng?: number | null | undefined;
}) =>
  (value.lat === undefined && value.lng === undefined) ||
  (value.lat === null && value.lng === null) ||
  (typeof value.lat === 'number' && typeof value.lng === 'number');

export const AddressSchema = z
  .strictObject({
    id: IdSchema,
    ...addressFields,
    version: VersionSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .refine(pairedCoordinates);
export const CreateAddressSchema = z
  .strictObject({
    ...addressFields,
    landmark: addressFields.landmark.default(null),
    areaId: addressFields.areaId.default(null),
    lat: addressFields.lat.default(null),
    lng: addressFields.lng.default(null),
    isDefault: addressFields.isDefault.default(false),
  })
  .refine(pairedCoordinates);
export const UpdateAddressSchema = z
  .strictObject({
    ...z.strictObject(addressFields).partial().shape,
    expectedVersion: VersionSchema,
  })
  .refine(pairedCoordinates)
  .refine((value) => Object.keys(value).length > 1);
export const DeleteAddressSchema = z.strictObject({
  expectedVersion: VersionSchema,
});
export const AddressDeletedSchema = z.strictObject({
  id: IdSchema,
  version: VersionSchema,
  deleted: z.literal(true),
});
export const AddressParamsSchema = z.strictObject({ addressId: IdSchema });
export const AddressListQuerySchema = PageQuerySchema;
export const AddressPageSchema = z.strictObject({
  items: z.array(AddressSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type Address = z.infer<typeof AddressSchema>;
export type CreateAddress = z.infer<typeof CreateAddressSchema>;
export type UpdateAddress = z.infer<typeof UpdateAddressSchema>;
export type DeleteAddress = z.infer<typeof DeleteAddressSchema>;
export type AddressDeleted = z.infer<typeof AddressDeletedSchema>;
export type AddressPage = z.infer<typeof AddressPageSchema>;

// Authenticated consent registry (BR-11). Unknown pairs are rejected; absence
// of a record means "not granted" and is never inferred from defaults.
export const ConsentPurposeSchema = z.enum([
  'marketing',
  'order_updates',
  'enquiry_updates',
]);
export const ConsentChannelSchema = z.enum(['in_app', 'email', 'whatsapp']);
export type ConsentPurpose = z.infer<typeof ConsentPurposeSchema>;
export type ConsentChannel = z.infer<typeof ConsentChannelSchema>;
export interface ConsentPair {
  readonly purpose: ConsentPurpose;
  readonly channel: ConsentChannel;
}
export const CONSENT_REGISTRY: Readonly<
  Record<ConsentPurpose, readonly ConsentChannel[]>
> = Object.freeze({
  marketing: Object.freeze(['in_app', 'email', 'whatsapp'] as const),
  order_updates: Object.freeze(['whatsapp'] as const),
  enquiry_updates: Object.freeze(['whatsapp'] as const),
});
export const CONSENT_PAIRS: readonly ConsentPair[] = Object.freeze(
  ConsentPurposeSchema.options.flatMap((purpose) =>
    CONSENT_REGISTRY[purpose].map((channel) =>
      Object.freeze({ purpose, channel }),
    ),
  ),
);
/** Registered pair or null; a missing channel is never inferred. */
export function registeredConsentPair(
  purpose: unknown,
  channel: unknown,
): ConsentPair | null {
  return (
    CONSENT_PAIRS.find(
      (pair) => pair.purpose === purpose && pair.channel === channel,
    ) ?? null
  );
}
// Which flow recorded the evidence; the owning module passes its own source.
export const ConsentSourceSchema = z.enum([
  'account',
  'notification_preferences',
  'marketing_unsubscribe',
  'whatsapp_stop',
]);
export type ConsentSource = z.infer<typeof ConsentSourceSchema>;
export const ConsentNoticeVersionSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/);
export const ConsentParamsSchema = z.strictObject({
  purpose: ConsentPurposeSchema,
});
// Q-31: anonymous cookie categories are unapproved; shape-only purpose key.
export const AnonymousConsentParamsSchema = z.strictObject({
  purpose: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
});
export const UpdateConsentSchema = z.strictObject({
  channel: ConsentChannelSchema.optional(),
  granted: z.boolean(),
  noticeVersion: ConsentNoticeVersionSchema.optional(),
});
export const ConsentRecordSchema = z.strictObject({
  consentId: IdSchema,
  purpose: ConsentPurposeSchema,
  channel: ConsentChannelSchema,
  granted: z.boolean(),
  noticeVersion: ConsentNoticeVersionSchema.nullable(),
  recordedAt: TimestampSchema,
});
export const ConsentChoiceSchema = ConsentRecordSchema.extend({
  consentId: IdSchema.nullable(),
  recordedAt: TimestampSchema.nullable(),
});
export const ConsentListSchema = z.strictObject({
  currentNoticeVersion: ConsentNoticeVersionSchema.nullable(),
  items: z.array(ConsentChoiceSchema).max(20),
});
export type ConsentParams = z.infer<typeof ConsentParamsSchema>;
export type UpdateConsent = z.infer<typeof UpdateConsentSchema>;
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;
export type ConsentChoice = z.infer<typeof ConsentChoiceSchema>;
export type ConsentList = z.infer<typeof ConsentListSchema>;

// Data requests (F-AU-008, F-AC-004, BR-14). Processing follows
// queued -> processing -> completed|failed|blocked; Q-32 gates policy.
export const DataRequestTypeSchema = z.enum(['export', 'delete']);
export const DataRequestStatusSchema = z.enum([
  'queued',
  'processing',
  'blocked',
  'completed',
  'failed',
]);
// Stored/returned failure reasons only; never free text or personal data.
export const DataRequestFailureCodeSchema = z.enum([
  'POLICY_PENDING',
  'ACCOUNT_UNAVAILABLE',
  'OWNER_BLOCKED',
  'STORAGE_UNAVAILABLE',
  'PROCESSING_FAILED',
]);
export const CreateDataRequestSchema = z
  .strictObject({
    type: DataRequestTypeSchema,
    confirmed: z.literal(true).optional(),
  })
  // Deletion requires the explicit confirmation from F-AU-008.
  .refine((value) => value.type !== 'delete' || value.confirmed === true, {
    path: ['confirmed'],
  });
export const DataRequestParamsSchema = z.strictObject({ requestId: IdSchema });
// Opaque-token helper shape: 32 random bytes, base64url without padding.
export const DataRequestCompletionTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/);
export const DataRequestAcceptedSchema = z.strictObject({
  requestId: IdSchema,
  type: DataRequestTypeSchema,
  status: DataRequestStatusSchema,
  failureCode: DataRequestFailureCodeSchema.optional(),
  requestedAt: TimestampSchema,
  completionToken: DataRequestCompletionTokenSchema.optional(),
  completionTokenExpiresAt: TimestampSchema.optional(),
});
export const DataRequestSchema = z.strictObject({
  requestId: IdSchema,
  type: DataRequestTypeSchema,
  status: DataRequestStatusSchema,
  failureCode: DataRequestFailureCodeSchema.optional(),
  requestedAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  downloadAvailable: z.boolean(),
});
export const DataRequestCompletionSchema = z.strictObject({
  status: DataRequestStatusSchema,
});
// Owner sections of the export; owners not implemented yet are explicit.
export const DATA_EXPORT_SECTIONS = Object.freeze([
  'profile',
  'addresses',
  'consents',
  'orders',
  'bookmarks',
  'reviews',
  'support_messages',
] as const);
export type DataExportSection = (typeof DATA_EXPORT_SECTIONS)[number];
/** Own support intake (Settings owner); plain text, no reporter/contact data. */
export const SupportMessageExportSchema = z.strictObject({
  id: IdSchema,
  message: z.string(),
  createdAt: TimestampSchema,
});
const UnavailableExportSectionSchema = z.strictObject({
  status: z.literal('unavailable'),
  reasonCode: z.literal('OWNER_NOT_IMPLEMENTED'),
});
const includedSection = <T extends z.ZodType>(item: T) =>
  z.strictObject({ status: z.literal('included'), items: z.array(item) });
export const DataExportProfileSchema = ProfileSchema.extend({
  preferences: PreferencesSchema,
  createdAt: TimestampSchema,
});
export const DataExportSchema = z.strictObject({
  requestId: IdSchema,
  generatedAt: TimestampSchema,
  sections: z.strictObject({
    profile: includedSection(DataExportProfileSchema),
    addresses: includedSection(AddressSchema),
    consents: includedSection(ConsentRecordSchema),
    orders: UnavailableExportSectionSchema,
    bookmarks: UnavailableExportSectionSchema,
    reviews: UnavailableExportSectionSchema,
    support_messages: includedSection(SupportMessageExportSchema),
  }),
});
export type DataRequestType = z.infer<typeof DataRequestTypeSchema>;
export type DataRequestStatus = z.infer<typeof DataRequestStatusSchema>;
export type DataRequestFailureCode = z.infer<
  typeof DataRequestFailureCodeSchema
>;
export type CreateDataRequest = z.infer<typeof CreateDataRequestSchema>;
export type DataRequestParams = z.infer<typeof DataRequestParamsSchema>;
export type DataRequestAccepted = z.infer<typeof DataRequestAcceptedSchema>;
export type DataRequest = z.infer<typeof DataRequestSchema>;
export type DataRequestCompletion = z.infer<typeof DataRequestCompletionSchema>;
export type DataExport = z.infer<typeof DataExportSchema>;
