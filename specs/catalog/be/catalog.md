# BE: catalog

Features: F-HM-003, F-HM-004, F-SV-008, F-VD-006, F-AD-005, F-AD-006, F-AD-015, F-SA-008 | Rules: BR-07, BR-08, BR-12, BR-18 | State machines: ST-subcategory-suggestion | Depends on: none | Used by: businesses, products, services, search, admin

Frontend counterpart: [FE catalog](../fe/catalog.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own the shared category and subcategory taxonomy, vendor/provider subcategory suggestions, and search keyword mappings. Provide stable catalog read contracts to listing, discovery and search modules. Services own service records and enforce the single-subcategory relationship; catalog never writes listing or provider-expertise data.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `categories` | `id uuid PK`; `kind text NOT NULL CHECK product/service`; `slug text NOT NULL UNIQUE`; `name_en/name_hi text NOT NULL`; `icon text NULL`; `active boolean NOT NULL DEFAULT true`; `sort_order int NOT NULL DEFAULT 0`; `version int NOT NULL DEFAULT 1`; timestamps. Shops reuse the product-category taxonomy (`CATS` in the prototype), not a duplicate third kind. | Unique `slug` for the shared `/category/{slug}` route; `(kind,active,sort_order,id)` for ordered tiles/tree. |
| `category_relations` | `source_category_id uuid NOT NULL FK categories`; `related_category_id uuid NOT NULL FK categories`; `sort_order int NOT NULL CHECK >=0`; PK `(source_category_id,related_category_id)`; UNIQUE `(source_category_id,sort_order)`; source/target must have different kinds, validated by the use-case. | PK serves Home-to-Explore cross-kind category resolution; reverse index on `related_category_id`. |
| `subcategories` | `id uuid PK`; `category_id uuid NOT NULL FK categories`; `slug text NOT NULL`; `name_en/name_hi text NOT NULL`; `normalized_name text NOT NULL`; `service_types text[] NOT NULL DEFAULT '{}'`; `active boolean NOT NULL DEFAULT true`; `sort_order int NOT NULL DEFAULT 0`; `version int NOT NULL DEFAULT 1`; timestamps. `UNIQUE(category_id,slug)` and `UNIQUE(category_id,normalized_name)`. | `(category_id,active,sort_order,id)` for tree/selectors; `USING GIN(normalized_name gin_trgm_ops)` for duplicate candidates. |
| `subcategory_suggestions` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `submitter_user_id uuid NOT NULL FK users`; `city_id uuid NOT NULL FK cities`; `area_id uuid NOT NULL FK areas`; `category_id uuid NOT NULL FK categories`; `name_en text NOT NULL`; `name_hi text NULL`; `normalized_name text NOT NULL`; `reason text NULL`; `status text NOT NULL CHECK pending/approved/rejected/merged`; `reviewed_by uuid NULL FK users`; `reviewed_at timestamptz NULL`; `rejection_reason text NULL`; `subcategory_id uuid NULL FK subcategories` (approved); `merged_into_subcategory_id uuid NULL FK subcategories` (merged); `version int NOT NULL DEFAULT 1`; timestamps. CHECK state-specific review fields and target are consistent. | Partial unique `(category_id,normalized_name) WHERE status='pending'`; `(status,city_id,area_id,created_at,id)` for scoped queue; `(business_id,created_at DESC,id DESC)` for owner's history; `USING GIN(normalized_name gin_trgm_ops)`. |
| `keyword_mappings` | `id uuid PK`; `enabled boolean NOT NULL DEFAULT true`; `version int NOT NULL DEFAULT 1`; timestamps. | `(enabled,id)` for active search mappings. |
| `keyword_mapping_terms` | `id uuid PK`; `mapping_id uuid NOT NULL FK keyword_mappings`; `term text NOT NULL`; `normalized_term text NOT NULL UNIQUE`; `kind text NOT NULL CHECK primary/synonym`; `created_at timestamptz NOT NULL DEFAULT now()`. Contains one canonical term and its EN/HI/Hinglish variants; application transaction requires exactly one primary term per mapping. | Unique `normalized_term`; partial unique `(mapping_id) WHERE kind='primary'`; `USING GIN(normalized_term gin_trgm_ops)` for typo-tolerant lookup; `(mapping_id,kind,id)` for mapping editor. |
| `keyword_mapping_targets` | `id uuid PK`; `mapping_id uuid NOT NULL FK keyword_mappings`; `target_kind text NOT NULL CHECK category/subcategory/product_tag`; `category_id uuid NULL FK categories`; `subcategory_id uuid NULL FK subcategories`; `product_tag text NULL`; CHECK exactly the target column matching `target_kind` is set. | Partial unique indexes `(mapping_id,category_id)`, `(mapping_id,subcategory_id)`, `(mapping_id,product_tag)`; reverse indexes by each populated target for mapping preview. |

`business_id`, `submitter_user_id`, `city_id`, and `area_id` on suggestions are server-derived from the authenticated owner's business context, not accepted from the request body. Suggestion area is the authorization scope for its review queue.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/catalog/categories?kind=` | Public; `kind` allow-listed | → active category DTOs | `VALIDATION_ERROR` | Yes | F-HM-003/004, S-CUST-01/04 |
| GET | `/catalog/categories/{slug}` | Public | → category, active subcategories | `CATEGORY_NOT_FOUND` | Yes | S-CUST-05 |
| GET | `/catalog/admin/categories` | `admin` + `catalog:view` + active assigned city/area scope; `super_admin` platform-wide | → full tree with `version` | `FORBIDDEN` | Yes | F-AD-005, F-SA-008, S-ADMN-05 |
| POST | `/catalog/admin/categories` | `super_admin`; platform-wide; audit required | Allow-listed `{kind,slug,nameEn,nameHi,icon?,sortOrder?}` → category DTO | `VALIDATION_ERROR`, `CATEGORY_CONFLICT` | Via `Idempotency-Key` | F-SA-008 |
| PATCH | `/catalog/admin/categories/{categoryId}` | `super_admin`; platform-wide; audit required | Allow-listed `{nameEn?,nameHi?,icon?,active?,sortOrder?,expectedVersion}` → category DTO | `CATEGORY_NOT_FOUND`, `CATALOG_VERSION_CONFLICT` | Via version | F-SA-008 |
| POST | `/catalog/admin/categories/{categoryId}/subcategories` | `super_admin`; platform-wide; audit required | `{nameEn,nameHi,serviceTypes?,expectedVersion?}` → subcategory DTO | `CATEGORY_NOT_FOUND`, `SUBCATEGORY_DUPLICATE`, `VALIDATION_ERROR` | Via `Idempotency-Key` | F-AD-005, F-SA-008 |
| PATCH | `/catalog/admin/subcategories/{subcategoryId}` | `super_admin`; platform-wide; audit required | Allow-listed `{nameEn,nameHi,serviceTypes,active,sortOrder,expectedVersion}` → subcategory DTO | `SUBCATEGORY_NOT_FOUND`, `CATALOG_VERSION_CONFLICT` | Via version | F-AD-005, F-SA-008 |
| POST | `/catalog/subcategory-suggestions/duplicate-check` | Authenticated owner; `business.taxonomy-suggest` capability and resolved business area | `{categoryId,nameEn,nameHi?}` → exact-match flag and ranked fuzzy candidates | `CATEGORY_NOT_FOUND`, `VALIDATION_ERROR` | Yes | F-VD-006, J9 |
| POST | `/catalog/subcategory-suggestions` | Authenticated owner; `business.taxonomy-suggest` capability and resolved business area | `{categoryId,nameEn,nameHi?,reason?,allowSimilar?}` → pending suggestion | `CATEGORY_NOT_FOUND`, `SUGGESTION_DUPLICATE`, `SUGGESTION_SIMILARITY_WARNING`, `VALIDATION_ERROR` | Via `Idempotency-Key` | F-VD-006, J9 |
| GET | `/catalog/me/subcategory-suggestions` | Authenticated owner; same owned business capability | `?cursor=&limit=` → keyset page | `FORBIDDEN` | Yes | F-VD-006 |
| GET | `/catalog/admin/subcategory-suggestions?status=` | `admin` + `catalog:view` + assigned city/area scope; `super_admin` platform-wide | Allow-listed status + cursor → scoped queue with duplicate candidates | `FORBIDDEN`, `VALIDATION_ERROR` | Yes | F-AD-006, S-ADMN-06 |
| POST | `/catalog/admin/subcategory-suggestions/{id}/decision` | `admin` + `catalog:edit` + suggestion area in assigned scope; `super_admin` platform-wide; audit required | `{action:"approve"\|"reject"\|"merge",reason?,targetSubcategoryId?,approvalNameHi?,expectedVersion}` → updated suggestion | `SUGGESTION_NOT_FOUND`, `SUGGESTION_STATE_INVALID`, `SUGGESTION_SCOPE_DENIED`, `SUGGESTION_MERGE_TARGET_INVALID`, `CATALOG_VERSION_CONFLICT`, `VALIDATION_ERROR` | Via `Idempotency-Key` and version | F-AD-006, J9 |
| GET | `/catalog/admin/keyword-mappings` | `admin` + `catalog:view` + active assigned scope; `super_admin` platform-wide | `?cursor=&limit=` → mappings and typed targets | `FORBIDDEN` | Yes | F-AD-015, F-SA-008, S-ADMN-15 |
| POST | `/catalog/admin/keyword-mappings` | `super_admin` platform-wide until Q-39 is resolved; audit required | `{canonicalTerm,synonyms,targets}` → mapping DTO | `KEYWORD_MAPPING_CONFLICT`, `KEYWORD_TARGET_INVALID`, `VALIDATION_ERROR` | Via `Idempotency-Key` | F-AD-015, F-SA-008 |
| PATCH/DELETE | `/catalog/admin/keyword-mappings/{mappingId}` | `super_admin` platform-wide until Q-39 is resolved; audit required | PATCH allow-listed `{canonicalTerm?,synonyms?,targets?,expectedVersion}`; DELETE `{expectedVersion}` | `KEYWORD_MAPPING_NOT_FOUND`, `KEYWORD_MAPPING_CONFLICT`, `KEYWORD_TARGET_INVALID`, `CATALOG_VERSION_CONFLICT` | PATCH via version; DELETE via `Idempotency-Key` and version | F-AD-015, F-SA-008 |

Category filter and keyword-result previews use `POST /search/admin/preview` from [Search](../../search/be/search.md); this module exposes taxonomy/mappings but never queries listing repositories. Unsaved mapping preview does not persist or publish a mapping.

Internal `CatalogReadPort.taxonomy({categoryIds?,subcategoryIds?,kind?,activeOnly})` returns `{categories,subcategories,revision}` with IDs/slugs, bilingual names, kind/parent and active state. `CatalogReadPort.resolveKeywords({normalizedQuery})` returns enabled `{mappingId,matchedTerm,matchKind:"exact"|"fuzzy",targets}` and a revision. Search uses the shared normalization and these typed targets; disabled mappings never enter public results.

`CatalogReadPort.relatedCategories({categoryId})` returns ordered active related category IDs/slugs. Seed the directed `RELP` and `RELS` mappings from final prototype `js23.js:2-4`; do not infer reverse links (the two maps differ), translate names into guessed links or add a new admin editor. This supplies the previously missing Q-58 storage/ownership contract; future curation beyond those mappings still needs approval. Shop/provider profile categories use product/service kind respectively; product listings may use a matching pair from either kind for provider-sold products.

## Rules and use-cases

1. Main-category create/edit is `super_admin` only (BR-07). Direct subcategory create/edit is also `super_admin` only pending Q-39; admin screens use the suggestion queue for approved taxonomy changes. This is the safe scope assumption for G-14.
2. Submission uses trusted business ownership and resolved area, not a selling-approval prerequisite. Businesses' `business.taxonomy-suggest` capability admits editable draft/pending/rejected/changes-requested applicants without granting a vendor/provider role; approved owners use their matching role. Suspended/inactive/deleted or area-unresolved businesses cannot submit. Accept only category/name/reason fields; never client-supplied submitter, business, city or area authority.
3. Normalize names consistently (Unicode normalization, case/space folding and `unaccent`). Reject an exact normalized duplicate in the same category. Return ranked `pg_trgm` candidates before submit and again in the review queue; allow an explicit “Suggest anyway” only for a fuzzy match, never an exact duplicate.
4. Enforce only `pending -> approved|rejected|merged` (ST-subcategory-suggestion). Reject requires a reason; merge requires an active subcategory under the same category. Approval creates one active subcategory; if the optional suggestion Hindi name is missing, the reviewer must supply `approvalNameHi` before publishing. Never auto-translate, insert null into required taxonomy columns or silently copy English. Merge records `merged_into_subcategory_id`; terminal decisions cannot be repeated. Recheck duplicate targets inside the decision transaction.
5. Scope admin queue reads/actions by the suggestion's stored city/area and `catalog` permission. A `super_admin` has platform-wide scope. Audit every decision with before/after state and actor.
6. Store one primary term and its EN/HI/Hinglish variants per mapping, each as an indexed term row with typed targets on the mapping. Search resolves all variants through the same mapping; typo tolerance uses trigram similarity, not language-specific hard-coded branches. Validate category/subcategory targets against catalog; product tags are normalized text targets.
7. Each service must reference exactly one active service subcategory; `services` owns and enforces the `services.subcategory_id` constraint (BR-08). Provider expertise remains a separate many-to-many relationship owned by `services`.
8. Mutable taxonomy, mappings and suggestions use optimistic `version` checks. Emit outbox events in the same transaction as the write; never send notifications inline.

## Events and jobs

| Event | Consumer / action | Retry |
|---|---|---|
| `catalog.subcategory_suggestion.submitted` | `notifications` notifies scoped moderators | Outbox + pg-boss retry |
| `catalog.subcategory_suggestion.approved` / `.rejected` / `.merged` | `notifications` sends the decision and reason/target to the suggester | Outbox + pg-boss retry |
| `catalog.taxonomy.changed` / `catalog.keyword_mapping.changed` | `search` invalidates discovery/search cache tags | Outbox + pg-boss retry |

Suggestion events carry `{suggestionId,categoryId,businessId,submitterUserId,cityId,areaId,status,version,subcategoryId?,mergedIntoSubcategoryId?}`; missing targets are null/omitted, not guessed. `CatalogReadPort.suggestionNotice({suggestionId,version}) -> {suggestionId,businessId,submitterUserId,audienceRole,scope,status,nameEn,nameHi?,reason?,subcategoryId?,returnPath}` supplies the committed decision's reason/approved-or-merged target to Notifications; `returnPath` is the owning product/service manager, derived from trusted business/category kind. It exposes no documents or contacts. The use-case commits suggestion/taxonomy change, audit and outbox atomically.

## Error codes added

`CATEGORY_NOT_FOUND` 404 · `CATEGORY_CONFLICT` 409 · `SUBCATEGORY_NOT_FOUND` 404 · `SUBCATEGORY_DUPLICATE` 409 · `SUGGESTION_DUPLICATE` 409 · `SUGGESTION_SIMILARITY_WARNING` 409 · `SUGGESTION_NOT_FOUND` 404 · `SUGGESTION_STATE_INVALID` 409 · `SUGGESTION_SCOPE_DENIED` 403 · `SUGGESTION_MERGE_TARGET_INVALID` 422 · `KEYWORD_MAPPING_NOT_FOUND` 404 · `KEYWORD_MAPPING_CONFLICT` 409 · `KEYWORD_TARGET_INVALID` 422 · `CATALOG_VERSION_CONFLICT` 409. All use the shared error envelope and localized message keys.

## Acceptance criteria

- Given a non-super-admin, when they try to create or edit a main category, then the API denies the request even if the UI is bypassed.
- Given a vendor/provider who owns a business, when they submit a new subcategory, then the server derives ownership and area from trusted context and creates a pending suggestion.
- Given an exact normalized duplicate in the same category, when submitted, then the API rejects it; given only fuzzy candidates, then it returns warning candidates and permits an explicit “Suggest anyway”.
- Given an admin outside the suggestion's assigned city/area or without `catalog:edit`, when they decide it, then the API denies the action and leaves the suggestion unchanged.
- Given a pending suggestion, when an authorized admin rejects it without a reason or repeats a terminal decision, then validation/state-machine errors are returned.
- Given a pending suggestion and a valid same-category merge target, when an authorized admin merges it, then the suggestion records the target and the notification event is committed once.
- Given a service write with zero, multiple, inactive or non-service subcategory IDs, when `services` validates the request, then it rejects the write; exactly one active service subcategory is accepted.
- Given “एसी”, “AC”, “air conditioner” or a typo query, when search resolves it, then the same mapping returns its typed targets and the preview shows matching result groups.
- Given a suggestion has no Hindi name, when approval omits `approvalNameHi`, then validation fails without creating a partial subcategory; supplying a reviewed translation allows the atomic decision.
- Given an area-scoped moderator previews an unsaved mapping, when another area has matches, then those results/counts are excluded and no live mapping changes.
- Given an owned editable pending application with a resolved area but no approved seller role, when suggesting taxonomy, then its narrow capability permits the request without enabling selling; a non-owner or suspended application is denied.

## Tests

Unit: normalization, duplicate candidates, typed target validation, transition guards. Integration: unique constraints, cursor ordering, version races, outbox atomicity. Authorization negatives: owner spoofing, non-super-admin category write, missing `catalog` permission, out-of-area queue decision. Journey: J9 suggestion-to-decision and cache invalidation.
