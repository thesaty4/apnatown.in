import { z } from 'zod';
import {
  CursorSchema,
  IdSchema,
  LimitSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import { MediaGatewayPathSchema, PublicImageVariantSchema } from './media.js';

/**
 * Catalog wire contracts (F-HM-003/004, F-SV-008, F-VD-006, F-AD-005/006/015,
 * F-SA-008): taxonomy, Home sections, subcategory suggestions and keyword
 * mappings. Shared by the API, the generated client and the web app.
 */

export const CATEGORY_KINDS = ['product', 'service'] as const;
export const CategoryKindSchema = z.enum(CATEGORY_KINDS);
export type CategoryKind = z.infer<typeof CategoryKindSchema>;

export const SUGGESTION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'merged',
] as const;
export const SuggestionStatusSchema = z.enum(SUGGESTION_STATUSES);
export type SuggestionStatus = z.infer<typeof SuggestionStatusSchema>;

export const KEYWORD_TARGET_KINDS = [
  'category',
  'subcategory',
  'product_tag',
] as const;
export const KeywordTargetKindSchema = z.enum(KEYWORD_TARGET_KINDS);
export type KeywordTargetKind = z.infer<typeof KeywordTargetKindSchema>;

export const HOME_SECTION_KINDS = [
  'single_category',
  'curated_categories',
] as const;
export const HomeSectionKindSchema = z.enum(HOME_SECTION_KINDS);
export type HomeSectionKind = z.infer<typeof HomeSectionKindSchema>;

/** Upper bounds for the bounded admin reads and write lists. */
export const CATALOG_HOME_SECTION_LIMIT = 100;
export const CATALOG_SECTION_CATEGORY_LIMIT = 20;
export const KEYWORD_SYNONYM_LIMIT = 50;
export const KEYWORD_TARGET_LIMIT = 20;
export const SUGGESTION_CANDIDATE_LIMIT = 5;

/**
 * Shared catalog normalization for names, terms and search queries: Unicode
 * NFKC, lowercase, Latin combining marks removed (Devanagari marks are kept),
 * NFC and collapsed whitespace. The database additionally applies `unaccent`
 * on both the stored value and the lookup, so Search must use this function
 * before calling the Catalog keyword port.
 */
export function normalizeCatalogText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * Immutable subcategory slug derived from the English name (prototype rule:
 * `&` becomes a word break; non-alphanumeric runs become one hyphen).
 * TODO(verify): final slug policy for non-ASCII-only English names.
 */
export function catalogSlug(nameEn: string): string {
  return nameEn
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

const plain = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value), {
      message: 'Plain text without angle brackets or control characters',
    });
const name = plain(2, 60);
const expectedVersion = VersionSchema;
const sortOrder = z.number().int().min(0).max(10000);
export const CatalogSlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const icon = plain(1, 16);
/** TODO(verify): approved service-type vocabulary; tokens are opaque here. */
const serviceTypes = z
  .array(z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/))
  .max(10)
  .refine((items) => new Set(items).size === items.length, {
    message: 'Duplicate service type',
  });
const atLeastOneChange = (value: Record<string, unknown>) =>
  Object.keys(value).some((key) => key !== 'expectedVersion');

// ---------------------------------------------------------------------------
// Taxonomy DTOs
// ---------------------------------------------------------------------------

export const TaxonomyImageSchema = z.strictObject({
  assetId: IdSchema,
  path: MediaGatewayPathSchema,
  mimeType: z.string().min(1).max(100),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  variants: z.array(PublicImageVariantSchema).min(1).max(3),
});
export type TaxonomyImage = z.infer<typeof TaxonomyImageSchema>;

export const CategorySchema = z.strictObject({
  id: IdSchema,
  slug: CatalogSlugSchema,
  kind: CategoryKindSchema,
  nameEn: z.string().min(1),
  nameHi: z.string().min(1),
  icon: z.string().min(1).optional(),
  image: TaxonomyImageSchema.optional(),
  active: z.boolean(),
  sortOrder: z.number().int(),
});
export type Category = z.infer<typeof CategorySchema>;

export const SubcategorySchema = z.strictObject({
  id: IdSchema,
  categoryId: IdSchema,
  slug: CatalogSlugSchema,
  nameEn: z.string().min(1),
  nameHi: z.string().min(1),
  serviceTypes: z.array(z.string()),
  image: TaxonomyImageSchema.optional(),
  active: z.boolean(),
  sortOrder: z.number().int(),
});
export type Subcategory = z.infer<typeof SubcategorySchema>;

export const CategoryListQuerySchema = z.strictObject({
  kind: CategoryKindSchema.optional(),
});
export type CategoryListQuery = z.infer<typeof CategoryListQuerySchema>;
export const CategoryListSchema = z.strictObject({
  items: z.array(CategorySchema),
});
export type CategoryList = z.infer<typeof CategoryListSchema>;

export const CategorySlugParamsSchema = z.strictObject({
  slug: CatalogSlugSchema,
});
export type CategorySlugParams = z.infer<typeof CategorySlugParamsSchema>;
export const SubcategorySlugParamsSchema = z.strictObject({
  slug: CatalogSlugSchema,
  subcategorySlug: CatalogSlugSchema,
});
export type SubcategorySlugParams = z.infer<typeof SubcategorySlugParamsSchema>;

export const CategoryDetailSchema = z.strictObject({
  category: CategorySchema,
  subcategories: z.array(SubcategorySchema),
});
export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;

export const SubcategoryDetailSchema = z.strictObject({
  category: CategorySchema,
  subcategory: SubcategorySchema,
  /** `/category/{slug}/{subcategorySlug}`; slugs are immutable. */
  canonicalPath: z.string().regex(/^\/category\/[a-z0-9-]+\/[a-z0-9-]+$/),
});
export type SubcategoryDetail = z.infer<typeof SubcategoryDetailSchema>;

const adminAudit = {
  imageAssetId: IdSchema.nullable(),
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
};
export const AdminCategorySchema = CategorySchema.extend({
  ...adminAudit,
  /** Ordered directed related categories (seeded RELP/RELS). */
  relatedCategoryIds: z.array(IdSchema),
});
export type AdminCategory = z.infer<typeof AdminCategorySchema>;
export const AdminSubcategorySchema = SubcategorySchema.extend(adminAudit);
export type AdminSubcategory = z.infer<typeof AdminSubcategorySchema>;
export const AdminCategoryNodeSchema = AdminCategorySchema.extend({
  subcategories: z.array(AdminSubcategorySchema),
});
export const AdminCategoryTreeSchema = z.strictObject({
  items: z.array(AdminCategoryNodeSchema),
});
export type AdminCategoryTree = z.infer<typeof AdminCategoryTreeSchema>;

export const CreateCategorySchema = z.strictObject({
  kind: CategoryKindSchema,
  slug: CatalogSlugSchema,
  nameEn: name,
  nameHi: name,
  icon: icon.optional(),
  imageAssetId: IdSchema.nullable().optional(),
  sortOrder: sortOrder.optional(),
});
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export const UpdateCategorySchema = z
  .strictObject({
    nameEn: name.optional(),
    nameHi: name.optional(),
    icon: icon.nullable().optional(),
    imageAssetId: IdSchema.nullable().optional(),
    active: z.boolean().optional(),
    sortOrder: sortOrder.optional(),
    expectedVersion,
  })
  .refine(atLeastOneChange, { message: 'No changes' });
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export const CategoryParamsSchema = z.strictObject({ categoryId: IdSchema });
export type CategoryParams = z.infer<typeof CategoryParamsSchema>;

export const CreateSubcategorySchema = z.strictObject({
  nameEn: name,
  nameHi: name,
  serviceTypes: serviceTypes.optional(),
  imageAssetId: IdSchema.nullable().optional(),
  /** Optional guard on the parent category version the editor loaded. */
  expectedVersion: expectedVersion.optional(),
});
export type CreateSubcategory = z.infer<typeof CreateSubcategorySchema>;
export const UpdateSubcategorySchema = z
  .strictObject({
    nameEn: name.optional(),
    nameHi: name.optional(),
    serviceTypes: serviceTypes.optional(),
    imageAssetId: IdSchema.nullable().optional(),
    active: z.boolean().optional(),
    sortOrder: sortOrder.optional(),
    expectedVersion,
  })
  .refine(atLeastOneChange, { message: 'No changes' });
export type UpdateSubcategory = z.infer<typeof UpdateSubcategorySchema>;
export const SubcategoryParamsSchema = z.strictObject({
  subcategoryId: IdSchema,
});
export type SubcategoryParams = z.infer<typeof SubcategoryParamsSchema>;

/** Internal `CatalogReadPort.taxonomy` result (also used by Search). */
export const TaxonomyReadSchema = z.strictObject({
  categories: z.array(CategorySchema),
  subcategories: z.array(SubcategorySchema),
  revision: z.string().min(1),
});
export type TaxonomyRead = z.infer<typeof TaxonomyReadSchema>;

// ---------------------------------------------------------------------------
// Home sections
// ---------------------------------------------------------------------------

const sectionPosition = z.number().int().min(0).max(10000);
const heading = plain(1, 80);
const supportingText = plain(1, 160);
const bothOrNeither = (value: {
  supportingTextEn?: string | null | undefined;
  supportingTextHi?: string | null | undefined;
}) => (value.supportingTextEn == null) === (value.supportingTextHi == null);
const sectionCategories = z
  .array(z.strictObject({ categoryId: IdSchema, position: sectionPosition }))
  .min(1)
  .max(CATALOG_SECTION_CATEGORY_LIMIT)
  .refine(
    (items) =>
      new Set(items.map((item) => item.categoryId)).size === items.length &&
      new Set(items.map((item) => item.position)).size === items.length,
    { message: 'Categories and positions must be distinct' },
  );

export const CreateHomeSectionSchema = z
  .discriminatedUnion('kind', [
    z.strictObject({
      kind: z.literal('single_category'),
      contentKind: CategoryKindSchema,
      categoryId: IdSchema,
      supportingTextEn: supportingText.optional(),
      supportingTextHi: supportingText.optional(),
      position: sectionPosition,
    }),
    z.strictObject({
      kind: z.literal('curated_categories'),
      contentKind: CategoryKindSchema,
      headingEn: heading,
      headingHi: heading,
      supportingTextEn: supportingText.optional(),
      supportingTextHi: supportingText.optional(),
      categories: sectionCategories,
      initialCategoryId: IdSchema,
      position: sectionPosition,
    }),
  ])
  .refine(bothOrNeither, {
    message: 'Supporting text is required in both locales or neither',
    path: ['supportingTextHi'],
  });
export type CreateHomeSection = z.infer<typeof CreateHomeSectionSchema>;

/** `kind`/`contentKind` are immutable; fields must fit the stored kind. */
export const UpdateHomeSectionSchema = z
  .strictObject({
    categoryId: IdSchema.optional(),
    headingEn: heading.optional(),
    headingHi: heading.optional(),
    supportingTextEn: supportingText.nullable().optional(),
    supportingTextHi: supportingText.nullable().optional(),
    categories: sectionCategories.optional(),
    initialCategoryId: IdSchema.optional(),
    position: sectionPosition.optional(),
    expectedVersion,
  })
  .refine(atLeastOneChange, { message: 'No changes' })
  .refine(
    (value) =>
      (value.supportingTextEn === undefined) ===
      (value.supportingTextHi === undefined),
    {
      message: 'Supporting text is changed in both locales together',
      path: ['supportingTextHi'],
    },
  )
  .refine(bothOrNeither, {
    message: 'Supporting text is required in both locales or neither',
    path: ['supportingTextHi'],
  });
export type UpdateHomeSection = z.infer<typeof UpdateHomeSectionSchema>;

export const HomeSectionStatusSchema = z.strictObject({
  event: z.enum(['activate', 'deactivate']),
  expectedVersion,
});
export type HomeSectionStatus = z.infer<typeof HomeSectionStatusSchema>;
export const ExpectedVersionBodySchema = z.strictObject({ expectedVersion });
export type ExpectedVersionBody = z.infer<typeof ExpectedVersionBodySchema>;
export const HomeSectionParamsSchema = z.strictObject({ sectionId: IdSchema });
export type HomeSectionParams = z.infer<typeof HomeSectionParamsSchema>;

export const AdminHomeSectionSchema = z.strictObject({
  id: IdSchema,
  kind: HomeSectionKindSchema,
  contentKind: CategoryKindSchema,
  categoryId: IdSchema.nullable(),
  headingEn: z.string().nullable(),
  headingHi: z.string().nullable(),
  supportingTextEn: z.string().nullable(),
  supportingTextHi: z.string().nullable(),
  categories: z.array(
    z.strictObject({ categoryId: IdSchema, position: z.number().int() }),
  ),
  initialCategoryId: IdSchema.nullable(),
  position: z.number().int(),
  active: z.boolean(),
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type AdminHomeSection = z.infer<typeof AdminHomeSectionSchema>;
export const AdminHomeSectionListSchema = z.strictObject({
  items: z.array(AdminHomeSectionSchema),
});
export type AdminHomeSectionList = z.infer<typeof AdminHomeSectionListSchema>;
export const HomeSectionRemovedSchema = z.strictObject({
  id: IdSchema,
  removed: z.literal(true),
  version: VersionSchema,
});
export type HomeSectionRemoved = z.infer<typeof HomeSectionRemovedSchema>;

/** Internal `CatalogHomeReadPort.list` projection (localized per request). */
export const CatalogHomeSectionSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    id: IdSchema,
    kind: z.literal('single_category'),
    contentKind: CategoryKindSchema,
    category: CategorySchema,
    /** Derived from the category's localized name. */
    heading: z.string().min(1),
    supportingText: z.string().nullable(),
    subcategories: z.array(SubcategorySchema).min(1),
    position: z.number().int(),
  }),
  z.strictObject({
    id: IdSchema,
    kind: z.literal('curated_categories'),
    contentKind: CategoryKindSchema,
    heading: z.string().min(1),
    supportingText: z.string().nullable(),
    categories: z
      .array(
        z.strictObject({
          category: CategorySchema,
          position: z.number().int(),
          /** May be empty: the shared localized empty state applies. */
          subcategories: z.array(SubcategorySchema),
        }),
      )
      .min(1),
    initialCategoryId: IdSchema,
    position: z.number().int(),
  }),
]);
export type CatalogHomeSection = z.infer<typeof CatalogHomeSectionSchema>;

// ---------------------------------------------------------------------------
// Subcategory suggestions
// ---------------------------------------------------------------------------

const reason = plain(1, 500);
export const SuggestionDuplicateCheckSchema = z.strictObject({
  categoryId: IdSchema,
  nameEn: name,
  nameHi: name.optional(),
});
export type SuggestionDuplicateCheck = z.infer<
  typeof SuggestionDuplicateCheckSchema
>;
export const SuggestSubcategorySchema = z.strictObject({
  categoryId: IdSchema,
  nameEn: name,
  nameHi: name.optional(),
  reason: reason.optional(),
  /** Explicit "Suggest anyway" for fuzzy matches only, never exact. */
  allowSimilar: z.boolean().optional(),
});
export type SuggestSubcategory = z.infer<typeof SuggestSubcategorySchema>;

export const SuggestionCandidateSchema = z.strictObject({
  subcategoryId: IdSchema,
  slug: CatalogSlugSchema,
  nameEn: z.string(),
  nameHi: z.string(),
  similarity: z.number().min(0).max(1),
});
export type SuggestionCandidate = z.infer<typeof SuggestionCandidateSchema>;
export const SuggestionDuplicateResultSchema = z.strictObject({
  exact: z.boolean(),
  /** The existing subcategory for an exact match; null for a pending suggestion match. */
  exactSubcategory: SuggestionCandidateSchema.nullable(),
  candidates: z.array(SuggestionCandidateSchema),
});
export type SuggestionDuplicateResult = z.infer<
  typeof SuggestionDuplicateResultSchema
>;

export const SuggestionSchema = z.strictObject({
  id: IdSchema,
  businessId: IdSchema,
  cityId: IdSchema,
  areaId: IdSchema,
  categoryId: IdSchema,
  nameEn: z.string(),
  nameHi: z.string().nullable(),
  reason: z.string().nullable(),
  status: SuggestionStatusSchema,
  rejectionReason: z.string().nullable(),
  subcategoryId: IdSchema.nullable(),
  mergedIntoSubcategoryId: IdSchema.nullable(),
  reviewedAt: TimestampSchema.nullable(),
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Suggestion = z.infer<typeof SuggestionSchema>;
export const SuggestionPageSchema = z.strictObject({
  items: z.array(SuggestionSchema),
  nextCursor: CursorSchema.nullable(),
});
export type SuggestionPage = z.infer<typeof SuggestionPageSchema>;
export const AdminSuggestionSchema = SuggestionSchema.extend({
  /** Ranked active-or-inactive subcategories in the same category. */
  candidates: z.array(SuggestionCandidateSchema),
});
export const AdminSuggestionPageSchema = z.strictObject({
  items: z.array(AdminSuggestionSchema),
  nextCursor: CursorSchema.nullable(),
});
export type AdminSuggestionPage = z.infer<typeof AdminSuggestionPageSchema>;

const pageLimit = z.preprocess(
  (value) =>
    typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
      ? Number(value)
      : value,
  LimitSchema,
);
export const AdminSuggestionQuerySchema = z.strictObject({
  status: SuggestionStatusSchema.default('pending'),
  cursor: CursorSchema.optional(),
  limit: pageLimit,
});
export type AdminSuggestionQuery = z.infer<typeof AdminSuggestionQuerySchema>;

export const DecideSuggestionSchema = z.discriminatedUnion('action', [
  z.strictObject({
    action: z.literal('approve'),
    expectedVersion,
    /** Reviewed Hindi name; required when the suggestion has none. */
    approvalNameHi: name.optional(),
  }),
  z.strictObject({
    action: z.literal('reject'),
    expectedVersion,
    reason,
  }),
  z.strictObject({
    action: z.literal('merge'),
    expectedVersion,
    targetSubcategoryId: IdSchema,
  }),
]);
export type DecideSuggestion = z.infer<typeof DecideSuggestionSchema>;
export const SuggestionParamsSchema = z.strictObject({ id: IdSchema });
export type SuggestionParams = z.infer<typeof SuggestionParamsSchema>;

// ---------------------------------------------------------------------------
// Keyword mappings
// ---------------------------------------------------------------------------

const term = plain(1, 60);
export const KeywordTargetInputSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('category'), categoryId: IdSchema }),
  z.strictObject({ kind: z.literal('subcategory'), subcategoryId: IdSchema }),
  z.strictObject({ kind: z.literal('product_tag'), productTag: term }),
]);
export type KeywordTargetInput = z.infer<typeof KeywordTargetInputSchema>;
const targets = z
  .array(KeywordTargetInputSchema)
  .min(1)
  .max(KEYWORD_TARGET_LIMIT);
const synonyms = z.array(term).max(KEYWORD_SYNONYM_LIMIT);

export const CreateKeywordMappingSchema = z.strictObject({
  canonicalTerm: term,
  /** EN/HI/Hinglish/typo variants resolved through the same mapping. */
  synonyms,
  targets,
});
export type CreateKeywordMapping = z.infer<typeof CreateKeywordMappingSchema>;
export const UpdateKeywordMappingSchema = z
  .strictObject({
    canonicalTerm: term.optional(),
    synonyms: synonyms.optional(),
    targets: targets.optional(),
    expectedVersion,
  })
  .refine(atLeastOneChange, { message: 'No changes' });
export type UpdateKeywordMapping = z.infer<typeof UpdateKeywordMappingSchema>;
export const KeywordMappingParamsSchema = z.strictObject({
  mappingId: IdSchema,
});
export type KeywordMappingParams = z.infer<typeof KeywordMappingParamsSchema>;

export const KeywordTargetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('category'), categoryId: IdSchema }),
  z.strictObject({ kind: z.literal('subcategory'), subcategoryId: IdSchema }),
  z.strictObject({ kind: z.literal('product_tag'), productTag: z.string() }),
]);
export type KeywordTarget = z.infer<typeof KeywordTargetSchema>;
export const KeywordMappingSchema = z.strictObject({
  id: IdSchema,
  canonicalTerm: z.string(),
  synonyms: z.array(z.string()),
  targets: z.array(KeywordTargetSchema),
  enabled: z.boolean(),
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type KeywordMapping = z.infer<typeof KeywordMappingSchema>;
export const KeywordMappingPageSchema = z.strictObject({
  items: z.array(KeywordMappingSchema),
  nextCursor: CursorSchema.nullable(),
});
export type KeywordMappingPage = z.infer<typeof KeywordMappingPageSchema>;
export const KeywordMappingDeletedSchema = z.strictObject({
  id: IdSchema,
  deleted: z.literal(true),
});
export type KeywordMappingDeleted = z.infer<typeof KeywordMappingDeletedSchema>;

/** Internal `CatalogReadPort.resolveKeywords` result for Search. */
export const KeywordResolutionSchema = z.strictObject({
  matches: z.array(
    z.strictObject({
      mappingId: IdSchema,
      matchedTerm: z.string(),
      canonicalTerm: z.string(),
      matchKind: z.enum(['exact', 'fuzzy']),
      targets: z.array(KeywordTargetSchema),
    }),
  ),
  revision: z.string().min(1),
});
export type KeywordResolution = z.infer<typeof KeywordResolutionSchema>;
