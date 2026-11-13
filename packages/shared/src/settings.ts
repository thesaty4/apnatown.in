import { z } from 'zod';
import {
  IdSchema,
  PaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import { LocaleSchema } from './users.js';
import { ProductImportPolicySchema } from './product-import.js';

// Settings, feature flags, legal pages and support intake
// (settings spec: F-SA-005, F-AC-005, F-AC-006, F-X-009).

export const SETTING_KEYS = Object.freeze([
  'branding',
  'delivery',
  'rider_earning',
  'commission',
  'plans',
  'promotion_fees',
  'payments',
  'policies',
  'reviews',
  'uploads',
  'integrations',
  'seo',
  'tax',
  'product_import',
] as const);
export const SettingKeySchema = z.enum(SETTING_KEYS);
export type SettingKey = z.infer<typeof SettingKeySchema>;

/** Atomic section saves: every member is supplied once, saved together. */
export const SETTINGS_GROUPS = Object.freeze({
  delivery_rider_pay: Object.freeze(['delivery', 'rider_earning'] as const),
  commission_plans: Object.freeze([
    'commission',
    'plans',
    'promotion_fees',
  ] as const),
  policies_reviews: Object.freeze(['policies', 'reviews'] as const),
});
export const SettingsGroupSchema = z.enum([
  'delivery_rider_pay',
  'commission_plans',
  'policies_reviews',
]);
export type SettingsGroup = z.infer<typeof SettingsGroupSchema>;
/** Group owning a key, or null for single-key Save keys. */
export function settingsGroupOf(key: SettingKey): SettingsGroup | null {
  for (const group of SettingsGroupSchema.options)
    if ((SETTINGS_GROUPS[group] as readonly string[]).includes(key))
      return group;
  return null;
}

export const FEATURE_FLAG_KEYS = Object.freeze([
  'reviews',
  'guest_browse',
  'whatsapp',
  'booking',
  'donations',
  'payments_online',
  'payments_cod',
  'maintenance',
] as const);
export const FeatureFlagKeySchema = z.enum(FEATURE_FLAG_KEYS);
export type FeatureFlagKey = z.infer<typeof FeatureFlagKeySchema>;
/** Future products: stay false and cannot be enabled (settings rule 5). */
export const FUTURE_FEATURE_FLAGS: readonly FeatureFlagKey[] = Object.freeze([
  'booking',
  'donations',
]);

export const LEGAL_SLUGS = Object.freeze([
  'terms',
  'privacy',
  'refund',
  'about',
] as const);
export const LegalSlugSchema = z.enum(LEGAL_SLUGS);
export type LegalSlug = z.infer<typeof LegalSlugSchema>;

// ---------------------------------------------------------------------------
// Value primitives
// ---------------------------------------------------------------------------

/** Integer basis points 0..10,000. */
export const BpsSchema = z.number().int().min(0).max(10_000);
/** Plain localized text: trimmed, no markup brackets or control characters. */
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value));
/** E.164 phone number (configured business contacts only). */
export const E164Schema = z.string().regex(/^\+[1-9]\d{7,14}$/);
const code = z.string().regex(/^[a-z][a-z0-9_]{1,39}$/);
/** Approved adapter identifier (validated against configured adapters). */
export const ProviderIdSchema = z.string().regex(/^[a-z][a-z0-9-]{1,39}$/);
/** Opaque private reference (evidence/signatory/supplier records). */
export const PrivateRefSchema = z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/);
const unique = <T>(items: readonly T[], keyOf: (item: T) => string) =>
  new Set(items.map(keyOf)).size === items.length;

// ---------------------------------------------------------------------------
// Per-key value shapes (zod-validated before every save)
// ---------------------------------------------------------------------------

export const BrandingSchema = z.strictObject({
  nameEn: text(60),
  nameHi: text(60),
  taglineEn: text(160),
  taglineHi: text(160),
});
export const DeliverySlabsSchema = z.strictObject({
  slabs: z
    .array(
      z.strictObject({
        uptoKm: z.number().nonnegative(),
        feePaise: PaiseSchema,
      }),
    )
    .min(1)
    .max(3)
    // Strictly ascending distance bands; Geo owns zone overrides.
    .refine((slabs) =>
      slabs.every(
        (slab, index) => !index || slab.uptoKm > slabs[index - 1]!.uptoKm,
      ),
    ),
});
export const RiderEarningSchema = z.strictObject({
  basePaise: PaiseSchema,
  perKmPaise: PaiseSchema,
});
export const CommissionSchema = z.strictObject({
  defaultBps: BpsSchema,
  platformFeePaise: PaiseSchema,
});
const PlanBaseSchema = z.strictObject({
  code,
  nameEn: text(60),
  nameHi: text(60),
  pricePaise: PaiseSchema,
  commissionBps: BpsSchema,
  enabled: z.boolean(),
  premium: z.boolean(),
  billingPeriodMonths: z.literal(1),
});
// Paid (Premium) plans need an explicit price; a free plan is never Premium.
export const PlanSchema = PlanBaseSchema.refine(
  (plan) => plan.premium === plan.pricePaise > 0,
);
export const PlansSchema = z
  .array(PlanSchema)
  .max(20)
  .refine((plans) => unique(plans, (plan) => plan.code));
export const PromotionKindSchema = z.enum([
  'homepage_banner',
  'featured_business',
]);
const PromotionFeeBaseSchema = z.strictObject({
  code,
  nameEn: text(60),
  nameHi: text(60),
  pricePaise: PaiseSchema,
  enabled: z.boolean(),
  kind: PromotionKindSchema,
  durationDays: z.literal(7),
});
// An enabled paid promotion cannot be sold without an explicit price.
export const PromotionFeeSchema = PromotionFeeBaseSchema.refine(
  (fee) => !fee.enabled || fee.pricePaise > 0,
);
export const PromotionFeesSchema = z
  .array(PromotionFeeSchema)
  .max(20)
  .refine((fees) => unique(fees, (fee) => fee.code));
export const PaymentsSettingsSchema = z.strictObject({
  gatewayId: ProviderIdSchema.nullable(),
});
export const PoliciesSchema = z.strictObject({
  // Approved owner value only; no invented upper/lower refund window.
  refundWindowHours: z.number().int().nonnegative().max(2_147_483_647),
});
export const ReviewRulesSchema = z.strictObject({
  ruleEn: text(500),
  ruleHi: text(500),
  blockedWords: z
    .array(text(50))
    .max(500)
    .refine((words) => unique(words, (word) => word.toLowerCase())),
});

// Public image policy (Media spec "Public image policy"): hard ceilings are
// deployment seeds; Super Admin overrides may only tighten them.
export const IMAGE_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
] as const);
export const ImageMimeTypeSchema = z.enum(IMAGE_MIME_TYPES);
export const IMAGE_PURPOSES = Object.freeze([
  'catalog_taxonomy',
  'offer_banner',
  'product',
  'service',
  'business_profile_logo',
  'business_profile_cover',
  'gallery',
  'video_thumbnail',
  'review_photo',
] as const);
export const ImagePurposeSchema = z.enum(IMAGE_PURPOSES);
export type ImagePurpose = z.infer<typeof ImagePurposeSchema>;
const pixels = z.number().int().min(1).max(6000);
export const ImagePolicySchema = z.strictObject({
  version: VersionSchema,
  enabled: z.boolean(),
  allowedMimeTypes: z.array(ImageMimeTypeSchema).min(1).max(3),
  maxBytes: z.number().int().min(1).max(5_242_880),
  minWidth: pixels,
  minHeight: pixels,
  maxWidth: pixels,
  maxHeight: pixels,
  maxPixels: z.number().int().min(1).max(24_000_000),
  variants: z
    .array(
      z.strictObject({
        width: pixels,
        maxBytes: z.number().int().min(1).max(5_242_880),
      }),
    )
    .min(1)
    .max(8),
  quality: z.literal(80),
  minQuality: z.literal(60),
});
export type ImagePolicy = z.infer<typeof ImagePolicySchema>;
type Ceiling = Pick<ImagePolicy, 'minWidth' | 'minHeight'> & {
  widths: readonly number[];
  variantMaxBytes: number;
};
const ceiling = (
  minWidth: number,
  minHeight: number,
  widths: readonly number[],
  kib: number,
): Ceiling => ({ minWidth, minHeight, widths, variantMaxBytes: kib * 1024 });
/** Hard ceilings per purpose (Media spec table); never raised by settings. */
export const IMAGE_POLICY_CEILINGS: Readonly<Record<ImagePurpose, Ceiling>> =
  Object.freeze({
    catalog_taxonomy: ceiling(256, 256, [160, 320, 640], 120),
    offer_banner: ceiling(640, 320, [480, 960, 1600, 1920], 350),
    product: ceiling(320, 320, [320, 640, 1280, 1920], 300),
    service: ceiling(320, 320, [320, 640, 1280, 1920], 300),
    business_profile_logo: ceiling(256, 256, [160, 320, 640], 120),
    business_profile_cover: ceiling(640, 320, [480, 960, 1600, 1920], 350),
    gallery: ceiling(320, 320, [320, 640, 1280, 1920], 300),
    video_thumbnail: ceiling(320, 320, [320, 640, 1280, 1920], 300),
    review_photo: ceiling(320, 320, [320, 640, 1280, 1920], 300),
  });
/** True when `policy` is within the purpose's hard ceilings. */
export function imagePolicyWithinCeiling(
  purpose: ImagePurpose,
  policy: ImagePolicy,
): boolean {
  const limit = IMAGE_POLICY_CEILINGS[purpose];
  const widths = policy.variants.map((variant) => variant.width);
  return (
    unique(policy.allowedMimeTypes, (type) => type) &&
    policy.minWidth >= limit.minWidth &&
    policy.minHeight >= limit.minHeight &&
    policy.maxWidth >= policy.minWidth &&
    policy.maxHeight >= policy.minHeight &&
    policy.maxPixels >= policy.minWidth * policy.minHeight &&
    unique(widths, String) &&
    widths.every(
      (width, index) =>
        limit.widths.includes(width) && (!index || width > widths[index - 1]!),
    ) &&
    policy.variants.every(
      (variant) => variant.maxBytes <= limit.variantMaxBytes,
    )
  );
}
export const UploadsSchema = z.strictObject({
  purposes: z
    .strictObject(
      Object.fromEntries(
        IMAGE_PURPOSES.map((purpose) => [purpose, ImagePolicySchema]),
      ) as Record<ImagePurpose, typeof ImagePolicySchema>,
    )
    .refine((purposes) =>
      IMAGE_PURPOSES.every((purpose) =>
        imagePolicyWithinCeiling(purpose, purposes[purpose]),
      ),
    ),
});

export const IntegrationsSchema = z.strictObject({
  smsProviderId: ProviderIdSchema.nullable(),
  whatsappNumber: E164Schema.nullable(),
  emailSender: z.email().max(254).nullable(),
  supportCallE164: E164Schema.nullable(),
  supportWhatsappE164: E164Schema.nullable(),
});
export const SeoSchema = z.strictObject({
  titleEn: text(120),
  titleHi: text(120),
  descriptionEn: text(300),
  descriptionHi: text(300),
});

// Tax configuration (Orders "Invoice and tax policy"); effective for new
// quotes only, never a guessed or zero fallback.
export const GstinSchema = z
  .string()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/);
export const StateCodeSchema = z.string().regex(/^\d{2}$/);
export const SupplierTaxProfileSchema = z
  .strictObject({
    supplierRef: PrivateRefSchema,
    legalName: text(200),
    address: text(500),
    stateCode: StateCodeSchema,
    registrationMode: z.enum([
      'regular',
      'composition',
      'exempt',
      'unregistered',
    ]),
    gstin: GstinSchema.optional(),
    requiresIrn: z.boolean(),
    authorizedSignatoryRef: PrivateRefSchema,
    version: VersionSchema,
  })
  // Registered modes require a GSTIN issued in the declared state.
  .refine(
    (profile) =>
      !['regular', 'composition'].includes(profile.registrationMode) ||
      profile.gstin?.slice(0, 2) === profile.stateCode,
  );
export type SupplierTaxProfile = z.infer<typeof SupplierTaxProfileSchema>;
export const TaxClassificationSchema = z
  .strictObject({
    code,
    hsnOrSac: z.string().regex(/^\d{4,8}$/),
    unitCode: z.string().regex(/^[A-Z]{3}$/),
    supplyType: z.enum(['taxable', 'exempt', 'nil_rated']),
    gstRateBps: BpsSchema,
    cessRateBps: BpsSchema,
  })
  // Exempt/nil-rated supplies carry zero configured tax.
  .refine(
    (item) =>
      item.supplyType === 'taxable' ||
      (item.gstRateBps === 0 && item.cessRateBps === 0),
  );
export type TaxClassification = z.infer<typeof TaxClassificationSchema>;
export const FEE_TAX_CODE_KEYS = Object.freeze([
  'platformFee',
  'platformDelivery',
  'subscription',
  'promotion',
  'commission',
] as const);
export const TaxSettingsSchema = z
  .strictObject({
    platformSupplier: SupplierTaxProfileSchema,
    classifications: z
      .array(TaxClassificationSchema)
      .min(1)
      .max(5000)
      .refine((items) => unique(items, (item) => item.code)),
    feeTaxCodes: z.strictObject({
      platformFee: code,
      platformDelivery: code,
      subscription: code,
      promotion: code,
      commission: code,
    }),
    // Super Admin confirms external fiscal verification (private evidence).
    versionEvidence: z.strictObject({
      verified: z.literal(true),
      verifiedAt: TimestampSchema,
      evidenceRef: PrivateRefSchema,
    }),
  })
  .refine((tax) =>
    FEE_TAX_CODE_KEYS.every((key) =>
      tax.classifications.some((item) => item.code === tax.feeTaxCodes[key]),
    ),
  );
export type TaxSettings = z.infer<typeof TaxSettingsSchema>;

export const SETTING_VALUE_SCHEMAS = Object.freeze({
  branding: BrandingSchema,
  delivery: DeliverySlabsSchema,
  rider_earning: RiderEarningSchema,
  commission: CommissionSchema,
  plans: PlansSchema,
  promotion_fees: PromotionFeesSchema,
  payments: PaymentsSettingsSchema,
  policies: PoliciesSchema,
  reviews: ReviewRulesSchema,
  uploads: UploadsSchema,
  integrations: IntegrationsSchema,
  seo: SeoSchema,
  tax: TaxSettingsSchema,
  /** Owner product import caps (Q-47); absent = import disabled. */
  product_import: ProductImportPolicySchema,
} as const);
export type SettingValue<K extends SettingKey> = z.infer<
  (typeof SETTING_VALUE_SCHEMAS)[K]
>;
export type SettingValues = { [K in SettingKey]: SettingValue<K> };

// ---------------------------------------------------------------------------
// Super-admin wire contracts
// ---------------------------------------------------------------------------

/** Absent (never configured) keys report value null and version 0. */
export const SettingVersionSchema = z.number().int().min(0).max(2147483647);
const settingEntry = <K extends SettingKey>(key: K) =>
  z.strictObject({
    key: z.literal(key),
    value: SETTING_VALUE_SCHEMAS[key].nullable(),
    version: SettingVersionSchema,
    group: SettingsGroupSchema.nullable(),
    updatedAt: TimestampSchema.nullable(),
  });
export const SettingEntrySchema = z.discriminatedUnion(
  'key',
  SETTING_KEYS.map(settingEntry) as unknown as [
    ReturnType<typeof settingEntry<'branding'>>,
    ...ReturnType<typeof settingEntry<SettingKey>>[],
  ],
);
export type SettingEntry = z.infer<typeof SettingEntrySchema>;
export const FeatureFlagSchema = z.strictObject({
  key: FeatureFlagKeySchema,
  enabled: z.boolean(),
  version: VersionSchema,
  /** False for future products or flags whose required integration is unconfigured. */
  enablable: z.boolean(),
  updatedAt: TimestampSchema,
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export const IntegrationStatusSchema = z.strictObject({
  gateway: z.strictObject({ configured: z.boolean() }),
  whatsapp: z.strictObject({ configured: z.boolean() }),
  sms: z.strictObject({ configured: z.boolean() }),
  email: z.strictObject({ configured: z.boolean() }),
});
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;
const readiness = z.strictObject({
  ready: z.boolean(),
  missingFields: z.array(z.string().max(100)).max(50),
});
export const SettingsReadinessSchema = z.strictObject({
  plans: readiness,
  promotions: readiness,
  tax: readiness,
  images: readiness,
});
export type SettingsReadiness = z.infer<typeof SettingsReadinessSchema>;
export const LegalTitleSchema = text(120);
/** Sanitised Markdown subset; executable markup is removed before storage. */
export const LegalBodySchema = z.string().trim().min(1).max(12_000);
export const LegalPageAdminSchema = z.strictObject({
  slug: LegalSlugSchema,
  titleEn: z.string(),
  titleHi: z.string(),
  bodyEn: z.string(),
  bodyHi: z.string(),
  version: VersionSchema,
  publishedAt: TimestampSchema,
});
export type LegalPageAdmin = z.infer<typeof LegalPageAdminSchema>;
export const LegalPageStatusSchema = z.strictObject({
  slug: LegalSlugSchema,
  /** 0 when the page was never published (Q-12 copy pending). */
  version: SettingVersionSchema,
  page: LegalPageAdminSchema.nullable(),
});
export const SuperAdminSettingsSchema = z.strictObject({
  settings: z.array(SettingEntrySchema),
  flags: z.array(FeatureFlagSchema),
  legal: z.array(LegalPageStatusSchema),
  integrationStatus: IntegrationStatusSchema,
  readiness: SettingsReadinessSchema,
});
export type SuperAdminSettings = z.infer<typeof SuperAdminSettingsSchema>;

export const SettingKeyParamsSchema = z.strictObject({ key: SettingKeySchema });
export const SettingsGroupParamsSchema = z.strictObject({
  group: SettingsGroupSchema,
});
export const FeatureFlagParamsSchema = z.strictObject({
  key: FeatureFlagKeySchema,
});
export const LegalSlugParamsSchema = z.strictObject({ slug: LegalSlugSchema });
export type SettingKeyParams = z.infer<typeof SettingKeyParamsSchema>;
export type SettingsGroupParams = z.infer<typeof SettingsGroupParamsSchema>;
export type FeatureFlagParams = z.infer<typeof FeatureFlagParamsSchema>;
export type LegalSlugParams = z.infer<typeof LegalSlugParamsSchema>;

/**
 * Transport shape: `value` is validated per key by the server (failures are
 * SETTINGS_INVALID, not a generic validation error). See SettingValueDocSchema
 * for the documented per-key union.
 */
export const UpdateSettingSchema = z.strictObject({
  value: z.json(),
  expectedVersion: SettingVersionSchema,
});
export type UpdateSetting = z.infer<typeof UpdateSettingSchema>;
export const SettingValueDocSchema = z.union(
  SETTING_KEYS.map((key) => SETTING_VALUE_SCHEMAS[key]) as unknown as [
    typeof BrandingSchema,
    ...(typeof BrandingSchema)[],
  ],
);
export const UpdateSettingDocSchema = z.strictObject({
  value: SettingValueDocSchema,
  expectedVersion: SettingVersionSchema,
});
export const SavedSettingSchema = z.strictObject({
  entry: SettingEntrySchema,
  changeSetId: IdSchema,
});
export type SavedSetting = z.infer<typeof SavedSettingSchema>;
export const UpdateSettingsGroupSchema = z.strictObject({
  updates: z
    .array(
      z.strictObject({
        key: SettingKeySchema,
        value: z.json(),
        expectedVersion: SettingVersionSchema,
      }),
    )
    .min(1)
    .max(3),
});
export type UpdateSettingsGroup = z.infer<typeof UpdateSettingsGroupSchema>;
export const UpdateSettingsGroupDocSchema = z.strictObject({
  updates: z
    .array(
      z.strictObject({
        key: SettingKeySchema,
        value: SettingValueDocSchema,
        expectedVersion: SettingVersionSchema,
      }),
    )
    .min(1)
    .max(3),
});
export const SavedSettingsGroupSchema = z.strictObject({
  group: SettingsGroupSchema,
  values: z.array(SettingEntrySchema),
  changeSetId: IdSchema,
});
export type SavedSettingsGroup = z.infer<typeof SavedSettingsGroupSchema>;
export const UpdateFeatureFlagSchema = z.strictObject({
  enabled: z.boolean(),
  expectedVersion: VersionSchema,
});
export type UpdateFeatureFlag = z.infer<typeof UpdateFeatureFlagSchema>;
export const UpdateLegalPageSchema = z.strictObject({
  titleEn: LegalTitleSchema,
  titleHi: LegalTitleSchema,
  bodyEn: LegalBodySchema,
  bodyHi: LegalBodySchema,
  /** 0 publishes a page for the first time. */
  expectedVersion: SettingVersionSchema,
});
export type UpdateLegalPage = z.infer<typeof UpdateLegalPageSchema>;

// ---------------------------------------------------------------------------
// Public wire contracts
// ---------------------------------------------------------------------------

export const PublicImagePolicySchema = ImagePolicySchema.pick({
  enabled: true,
  allowedMimeTypes: true,
  maxBytes: true,
  minWidth: true,
  minHeight: true,
  maxWidth: true,
  maxHeight: true,
  maxPixels: true,
});
export const PublicSettingsSchema = z.strictObject({
  branding: BrandingSchema.nullable(),
  flags: z.strictObject(
    Object.fromEntries(
      FEATURE_FLAG_KEYS.map((key) => [key, z.boolean()]),
    ) as Record<FeatureFlagKey, z.ZodBoolean>,
  ),
  /** Checkout availability: method flag on and its prerequisites configured. */
  paymentMethods: z.strictObject({ online: z.boolean(), cod: z.boolean() }),
  refundPolicy: PoliciesSchema.nullable(),
  uploads: z
    .strictObject({
      purposes: z.record(ImagePurposeSchema, PublicImagePolicySchema),
    })
    .nullable(),
  seo: SeoSchema.nullable(),
  plans: z.array(
    PlanBaseSchema.pick({
      code: true,
      nameEn: true,
      nameHi: true,
      pricePaise: true,
      premium: true,
      billingPeriodMonths: true,
    }),
  ),
  promotions: z.array(
    PromotionFeeBaseSchema.pick({
      code: true,
      nameEn: true,
      nameHi: true,
      pricePaise: true,
      kind: true,
      durationDays: true,
    }),
  ),
  /** Configured contacts only; null when not configured. */
  support: z.strictObject({
    callPhoneE164: E164Schema.nullable(),
    whatsappPhoneE164: E164Schema.nullable(),
  }),
  versions: z.strictObject({
    settings: z.record(SettingKeySchema, SettingVersionSchema),
    flags: z.record(FeatureFlagKeySchema, VersionSchema),
  }),
  generatedAt: TimestampSchema,
});
export type PublicSettings = z.infer<typeof PublicSettingsSchema>;

export const LegalQuerySchema = z.strictObject({
  locale: LocaleSchema.default('en'),
});
export type LegalQuery = z.infer<typeof LegalQuerySchema>;
export const LegalPageSchema = z.strictObject({
  slug: LegalSlugSchema,
  locale: LocaleSchema,
  title: z.string(),
  /** Sanitised Markdown subset (headings, paragraphs, lists, https links). */
  body: z.string(),
  version: VersionSchema,
  updatedAt: TimestampSchema,
});
export type LegalPage = z.infer<typeof LegalPageSchema>;

export const PlatformHealthSchema = z.strictObject({
  status: z.enum(['ok', 'maintenance']),
  checkedAt: TimestampSchema,
});
export type PlatformHealth = z.infer<typeof PlatformHealthSchema>;

// Support intake (message-only; no contact, ticket or reply fields).
export const SupportMessageTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  // Control characters other than newline/tab are rejected.
  // eslint-disable-next-line no-control-regex
  .refine((value) => !/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/.test(value));
export const CreateSupportMessageSchema = z.strictObject({
  message: SupportMessageTextSchema,
});
export type CreateSupportMessage = z.infer<typeof CreateSupportMessageSchema>;
export const SupportMessageAcceptedSchema = z.strictObject({
  id: IdSchema,
  status: z.literal('accepted'),
});
export type SupportMessageAccepted = z.infer<
  typeof SupportMessageAcceptedSchema
>;
export const SupportScopeSchema = z.strictObject({
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
});
export const SupportMessageParamsSchema = z.strictObject({ id: IdSchema });
export type SupportMessageParams = z.infer<typeof SupportMessageParamsSchema>;
export const SupportMessageDetailSchema = z.strictObject({
  id: IdSchema,
  /** Plain text; clients render it inert (never as HTML/Markdown). */
  message: z.string(),
  createdAt: TimestampSchema,
  authorLabel: z.string().max(80).optional(),
  scope: SupportScopeSchema,
});
export type SupportMessageDetail = z.infer<typeof SupportMessageDetailSchema>;

// ---------------------------------------------------------------------------
// Outbox events (published after commit by the relay)
// ---------------------------------------------------------------------------

export const SETTINGS_EVENT_TYPES = Object.freeze({
  settingsUpdated: 'settings.updated',
  settingsGroupUpdated: 'settings.group_updated',
  featureFlagUpdated: 'feature_flag.updated',
  legalUpdated: 'legal.updated',
  supportMessageSubmitted: 'support.message_submitted',
} as const);
export const SettingsUpdatedPayloadSchema = z.strictObject({
  key: SettingKeySchema,
  version: VersionSchema,
  changeSetId: IdSchema,
});
export const SettingsGroupUpdatedPayloadSchema = z.strictObject({
  group: SettingsGroupSchema,
  keys: z.array(
    z.strictObject({ key: SettingKeySchema, version: VersionSchema }),
  ),
  changeSetId: IdSchema,
});
export const FeatureFlagUpdatedPayloadSchema = z.strictObject({
  key: FeatureFlagKeySchema,
  enabled: z.boolean(),
  version: VersionSchema,
});
export const LegalUpdatedPayloadSchema = z.strictObject({
  slug: LegalSlugSchema,
  version: VersionSchema,
  publishedAt: TimestampSchema,
});
export const SupportMessageSubmittedPayloadSchema = z.strictObject({
  messageId: IdSchema,
  scope: SupportScopeSchema,
});
export type SettingsUpdatedPayload = z.infer<
  typeof SettingsUpdatedPayloadSchema
>;
export type SettingsGroupUpdatedPayload = z.infer<
  typeof SettingsGroupUpdatedPayloadSchema
>;
export type FeatureFlagUpdatedPayload = z.infer<
  typeof FeatureFlagUpdatedPayloadSchema
>;
export type LegalUpdatedPayload = z.infer<typeof LegalUpdatedPayloadSchema>;
export type SupportMessageSubmittedPayload = z.infer<
  typeof SupportMessageSubmittedPayloadSchema
>;
