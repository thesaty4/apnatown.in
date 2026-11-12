export interface paths {
    "/admin/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search the scoped audit trail
         * @description Requires an active admin with reports:view (super_admin sees everything). A row is visible only when its own scope and every related scope pass: an exact area grant admits only that area, a city-only row needs an explicit whole-city grant, and global/unscoped rows are super_admin only. Scope filtering runs before search, ordering and pagination; cityId/areaId only narrow within that scope. Filters are allow-listed and only narrow results: q is full-text over actor label, action and the redacted summary (plain words); action/entityType are exact keys; actorId is the exact actor user ID (labels never change identity filtering); from/to are inclusive IST calendar dates (YYYY-MM-DD) converted to UTC instants. Ordered occurredAt DESC, id DESC; the opaque cursor is bound to the filters, actor and scope revision. private, no-store.
         */
        get: operations["AdminAuditController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/audit/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read one scoped audit entry with its diff
         * @description Requires an active admin with reports:view (super_admin sees everything). A row is visible only when its own scope and every related scope pass: an exact area grant admits only that area, a city-only row needs an explicit whole-city grant, and global/unscoped rows are super_admin only. before/after contain only changed allow-listed fields, recursively redacted at write time. private, no-store.
         */
        get: operations["AdminAuditController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List video comments inside the current reviews scope
         * @description Each status count and page row is filtered by current assigned city/area scope before aggregation.
         */
        get: operations["engagementAdminVideoCommentsList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/comments/{id}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Publish or remove a video comment
         * @description Rechecks reviews:edit and exact video business scope in the command transaction; writes the versioned decision, audit and event atomically.
         */
        post: operations["engagementAdminVideoCommentDecision"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Current admin identity and grants
         * @description Server-resolved name, masked email, assigned areas, explicit whole-city grants, module permissions, communication scopes and scopeRevision. super_admin is platform-wide with all permissions. Grants are read per request; no-store.
         */
        get: operations["AdminMeController_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/media-reports/{id}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Dismiss a report or remove its video target
         * @description Rechecks reviews:edit and the stored video business scope in the command transaction. Resolving a report never approves its target.
         */
        post: operations["mediaAdminReportDecision"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/support/messages/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read one support message for the overview alert
         * @description Requires an active admin with users:view and the exact resolved scope of the message (area grant or whole-city grant); unscoped/global guest messages are super_admin only. Returns plain text to render inert, with an optional author display label; no reporter contact or export. Linked from /admin/overview?supportMessageId={id}. private, no-store.
         */
        get: operations["adminSupportMessage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/videos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List videos within the authenticated admin’s review scope
         * @description Video status queues, open video reports and counts are filtered by current assigned city/area scope.
         */
        get: operations["mediaAdminVideoList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/videos/{id}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Approve, reject or remove a video
         * @description Rechecks reviews:edit and the stored video business scope in the command transaction; writes a versioned decision and audit entry atomically.
         */
        post: operations["mediaAdminVideoDecision"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Same-origin bootstrap (Origin or Sec-Fetch-Site: same-origin). Persists anonymous state before returning its cookie/token. Never renews expired authenticated access. */
        get: operations["AuthController_csrf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/otp/challenges": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_challenge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/otp/challenges/{challengeId}/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_verify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AuthController_session"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/businesses/me/videos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List the authenticated business owner’s video links
         * @description Newest first; includes private moderation status and server-built playback descriptors. Response is private and no-store.
         */
        get: operations["mediaOwnerVideoList"];
        put?: never;
        /**
         * Submit a YouTube or Instagram video link for moderation
         * @description Accepts link-only sources. The API stores only the validated provider, kind and ID; each submission starts pending and public access requires moderation approval.
         */
        post: operations["mediaOwnerVideoCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/admin/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read the full category tree
         * @description Active and inactive categories with their subcategories, versions and audit timestamps, ordered by kind, sortOrder and name; the taxonomy is platform-wide shared data. Requires an active admin with catalog:view and an active assigned city/area scope; super_admin is platform-wide. private, no-store.
         */
        get: operations["adminCatalogCategories"];
        put?: never;
        /**
         * Create a category
         * @description Allow-listed {kind,slug,nameEn,nameHi,icon?,imageAssetId?,sortOrder?}. The slug is immutable after creation. Emits catalog.taxonomy.changed. Names are trimmed plain text; duplicate checks use the shared normalization (NFKC, lowercase, whitespace collapse, unaccent) on both EN and HI names. imageAssetId must be an owned, ready catalog_taxonomy Media asset; invalid, removed or foreign assets are rejected with CATALOG_IMAGE_INVALID (explicit null removes an image). super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminCatalogCategoryCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/admin/categories/{categoryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update a category
         * @description Allow-listed {nameEn?,nameHi?,icon?,imageAssetId?,active?,sortOrder?,expectedVersion}; kind and slug are immutable. Deactivation hides the category from public reads and Home without deleting listings. Emits catalog.taxonomy.changed. imageAssetId must be an owned, ready catalog_taxonomy Media asset; invalid, removed or foreign assets are rejected with CATALOG_IMAGE_INVALID (explicit null removes an image). super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        patch: operations["superAdminCatalogCategoryUpdate"];
        trace?: never;
    };
    "/catalog/admin/categories/{categoryId}/subcategories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a subcategory directly
         * @description {nameEn,nameHi,serviceTypes?,imageAssetId?,expectedVersion?}; the slug is derived from nameEn and immutable; expectedVersion optionally pins the parent category version. Emits catalog.taxonomy.changed. Names are trimmed plain text; duplicate checks use the shared normalization (NFKC, lowercase, whitespace collapse, unaccent) on both EN and HI names. imageAssetId must be an owned, ready catalog_taxonomy Media asset; invalid, removed or foreign assets are rejected with CATALOG_IMAGE_INVALID (explicit null removes an image). super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminCatalogSubcategoryCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/admin/home-sections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Home sections
         * @description Live (not removed) sections, active and inactive, ordered by position then id, with localized content, pills and versions. Kinds: dedicated_subcategories (one category's active subcategories as tiles, unique per live category) and curated_pills (ordered active categories of one kind with an initial category). Headings/supporting text are localized EN/HI; displayed text is never hardcoded. No scheduling windows. Platform-wide. private, no-store.
         */
        get: operations["superAdminCatalogHomeSections"];
        put?: never;
        /**
         * Create a Home section (inactive draft)
         * @description Kinds: dedicated_subcategories (one category's active subcategories as tiles, unique per live category) and curated_pills (ordered active categories of one kind with an initial category). Headings/supporting text are localized EN/HI; displayed text is never hardcoded. No scheduling windows. Created inactive; activation is a separate status command. Emits catalog.home_sections.changed. super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminCatalogHomeSectionCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/admin/home-sections/{sectionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove a Home section
         * @description Soft removal guarded by expectedVersion: the section leaves Home and the admin list while its row and audit history are preserved. Emits catalog.home_sections.changed. super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        delete: operations["superAdminCatalogHomeSectionRemove"];
        options?: never;
        head?: never;
        /**
         * Update Home section content
         * @description Versioned localized content, category, position and pill ordering update; kind and active state are not editable here (use the status command). An active section must remain publishable. Emits catalog.home_sections.changed. super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        patch: operations["superAdminCatalogHomeSectionUpdate"];
        trace?: never;
    };
    "/catalog/admin/home-sections/{sectionId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Activate or deactivate a Home section
         * @description {event:'activate'|'deactivate',expectedVersion}. Activation rechecks EN/HI content and that the category/subcategory set is active and non-empty. Emits catalog.home_sections.changed. super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminCatalogHomeSectionStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/admin/keyword-mappings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List search keyword mappings
         * @description Mappings with their primary term, EN/HI/Hinglish/typo synonyms and typed category/subcategory/product-tag targets, ordered by id with a caller-bound cursor. Mappings are platform-wide; writes are super_admin only until Q-39 is resolved. Requires an active admin with catalog:view and an active assigned city/area scope; super_admin is platform-wide. private, no-store.
         */
        get: operations["adminCatalogKeywordMappings"];
        put?: never;
        /**
         * Create a search keyword mapping
         * @description {canonicalTerm,synonyms,targets}: one primary term plus EN/HI/Hinglish/typo variants, each stored with its normalized form (NFKC, lowercase, whitespace collapse, unaccent); normalized terms must be unique within and across mappings. Targets are typed active category/subcategory ids or normalized product tags. Admin catalog:edit write access is pending Q-39. Emits catalog.keyword_mapping.changed. super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminCatalogKeywordMappingCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/admin/keyword-mappings/{mappingId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a search keyword mapping
         * @description {expectedVersion}. Deletes the mapping with its terms and targets; the audit entry keeps the before snapshot. Emits catalog.keyword_mapping.changed. super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        delete: operations["superAdminCatalogKeywordMappingDelete"];
        options?: never;
        head?: never;
        /**
         * Update a search keyword mapping
         * @description Allow-listed {canonicalTerm?,synonyms?,targets?,expectedVersion}; supplied lists replace the stored ones. Same normalization and target rules as create. Emits catalog.keyword_mapping.changed. super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        patch: operations["superAdminCatalogKeywordMappingUpdate"];
        trace?: never;
    };
    "/catalog/admin/subcategories/{subcategoryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update a subcategory
         * @description Allow-listed {nameEn?,nameHi?,serviceTypes?,imageAssetId?,active?,sortOrder?,expectedVersion}; slug and parent are immutable. Deactivation hides it from public reads, Home and new selections. Emits catalog.taxonomy.changed. Names are trimmed plain text; duplicate checks use the shared normalization (NFKC, lowercase, whitespace collapse, unaccent) on both EN and HI names. imageAssetId must be an owned, ready catalog_taxonomy Media asset; invalid, removed or foreign assets are rejected with CATALOG_IMAGE_INVALID (explicit null removes an image). super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        patch: operations["superAdminCatalogSubcategoryUpdate"];
        trace?: never;
    };
    "/catalog/admin/subcategory-suggestions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Scoped subcategory suggestion queue
         * @description Suggestions whose stored business area is inside the caller's assigned city/area scope (super_admin: all), filtered by the allow-listed status (default pending), oldest first with a caller-bound keyset cursor. Each item carries ranked existing-subcategory duplicate candidates from the same category. No owner contact or documents. Requires an active admin with catalog:view and an active assigned city/area scope; super_admin is platform-wide. private, no-store.
         */
        get: operations["adminCatalogSuggestions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/admin/subcategory-suggestions/{id}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Approve, reject or merge a pending suggestion
         * @description Requires an active admin with catalog:edit whose assigned scope contains the suggestion area (rechecked in the transaction); super_admin is platform-wide. approve creates the subcategory under the suggested category (approvalNameHi supplies a missing Hindi name); reject requires a reason; merge links to an active subcategory of the same category. Only pending suggestions transition, guarded by expectedVersion. The decision, any created subcategory, one audit entry and the outbox events (catalog.suggestion.*, catalog.taxonomy.changed) commit atomically. private, no-store.
         */
        post: operations["adminCatalogSuggestionDecision"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List active categories
         * @description Active categories ordered by sortOrder then English name, optionally filtered by the allow-listed kind (products|services). Localized EN/HI names, icon fallback and public Media image descriptors only (no admin/audit fields). Publicly cacheable; taxonomy changes invalidate via catalog.taxonomy.changed.
         */
        get: operations["catalogCategories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/categories/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read an active category with its active subcategories
         * @description Immutable slug lookup. Inactive or unknown categories are indistinguishable (CATEGORY_NOT_FOUND). Search owns paged listing results. Publicly cacheable.
         */
        get: operations["catalogCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/categories/{slug}/subcategories/{subcategorySlug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read an active subcategory under its exact active parent
         * @description Both rows must be active and the subcategory must belong to the named category. Returns the localized parent/child DTOs, image descriptors and canonical path; Search owns paged results. Publicly cacheable.
         */
        get: operations["catalogSubcategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/me/subcategory-suggestions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List the owner business's suggestions
         * @description Newest first with a caller-bound keyset cursor; includes status, rejection reason and the approved/merged subcategory id. Authenticated owner whose business holds the business.taxonomy-suggest capability (owned, not deleted/suspended/inactive, area resolved; an approved business also needs its live vendor/provider role); business, submitter, city and area are derived server-side, never from the body. X-Business-Kind selects which owned business is meant when the user owns both a shop and a provider profile. private, no-store.
         */
        get: operations["catalogMySuggestions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/subcategory-suggestions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Suggest a new subcategory
         * @description {categoryId,nameEn,nameHi?,reason?,allowSimilar?} creates a pending suggestion. An exact normalized match with an existing subcategory or pending suggestion is refused; fuzzy candidates are refused with SUGGESTION_SIMILARITY_WARNING unless allowSimilar is true. The suggestion, one audit entry and catalog.suggestion.submitted commit atomically. Limited to 10 per hour per user. Authenticated owner whose business holds the business.taxonomy-suggest capability (owned, not deleted/suspended/inactive, area resolved; an approved business also needs its live vendor/provider role); business, submitter, city and area are derived server-side, never from the body. X-Business-Kind selects which owned business is meant when the user owns both a shop and a provider profile. private, no-store.
         */
        post: operations["catalogSuggestionCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/subcategory-suggestions/duplicate-check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Check a proposed subcategory for duplicates
         * @description {categoryId,nameEn,nameHi?} against the active category: returns an exact normalized-name match flag (with the existing subcategory) and up to 5 ranked fuzzy candidates. Read-only; nothing is stored. Authenticated owner whose business holds the business.taxonomy-suggest capability (owned, not deleted/suspended/inactive, area resolved; an approved business also needs its live vendor/provider role); business, submitter, city and area are derived server-side, never from the body. X-Business-Kind selects which owned business is meant when the user owns both a shop and a provider profile. private, no-store.
         */
        post: operations["catalogSuggestionDuplicateCheck"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/consents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read anonymous consent choices (policy pending)
         * @description Always fails with COMMON_UNAVAILABLE (errors.common.unavailable): anonymous consent identity and cookie categories are pending policy approval (Q-31). Nothing is read or recorded.
         */
        get: operations["AnonymousConsentsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/consents/{purpose}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Record an anonymous consent choice (policy pending)
         * @description Requires the anonymous browser session, Origin and CSRF token; signed-in users use PUT /users/me/consents/{purpose}. Valid input still fails with COMMON_UNAVAILABLE (errors.common.unavailable): anonymous consent identity and cookie categories are pending policy approval (Q-31). Nothing is read or recorded.
         */
        put: operations["AnonymousConsentsController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/engagement/hearts/{targetType}/{targetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Heart a public video; repeated requests do not create duplicates */
        put: operations["engagementVideoHeart"];
        post?: never;
        /** Remove own video heart even when the video is no longer public */
        delete: operations["engagementVideoUnheart"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/engagement/likes/{videoId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Like a public video; repeated requests do not increment the count */
        put: operations["engagementVideoLike"];
        post?: never;
        /** Remove own like, including when the video is no longer public */
        delete: operations["engagementVideoUnlike"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/engagement/me/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read own video likes, hearts and public counts in one bounded batch
         * @description Guests receive empty relationship flags. Counts omit unavailable videos.
         */
        get: operations["engagementState"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/engagement/shares": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Record a share of a currently public video
         * @description Accepts a target ID rather than a URL. The server validates current visibility and commits its count and event atomically.
         */
        post: operations["engagementVideoShare"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geo/admin/cities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List cities with area, zone and waitlist counts
         * @description Platform-wide; no city/area grant or module permission applies. Ordered by status, English name and id; cursor is bound to the caller. Counts are real records (waitlist = notify-me requests for the city). Assigned-admin counts come from the admin module. private, no-store.
         */
        get: operations["superAdminGeoCities"];
        put?: never;
        /**
         * Create a city
         * @description Status may be enabled, disabled or coming_soon. stateCode must be a verified GST state/UT code (never inferred). The slug is derived from nameEn (lowercase ASCII words joined by hyphens). No areas, zones or fee defaults are created. No event is emitted. super_admin only (regular admins are denied even when assigned to the city); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminGeoCityCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geo/admin/cities/{cityId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read a city with its areas, zones and fee slabs
         * @description Platform-wide. Returns the city DTO (with totals in counts), up to 200 areas and up to 200 zones (polygon and fee slabs in paise). Admin assignments are read from the admin module. private, no-store.
         */
        get: operations["superAdminGeoCity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Correct a city's GST state code
         * @description Versioned correction of stateCode only, validated against the verified GST state/UT allow-list. Historical order tax snapshots are not rewritten. No event is emitted. super_admin only (regular admins are denied even when assigned to the city); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        patch: operations["superAdminGeoCityStateUpdate"];
        trace?: never;
    };
    "/geo/admin/cities/{cityId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Enable or disable a city
         * @description Prototype edges only: enable changes disabled or coming_soon to enabled; disable changes enabled to coming_soon. A disabled city serves no new discovery or checkout; in-flight orders are not cancelled. Emits geo.city.status_changed. super_admin only (regular admins are denied even when assigned to the city); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminGeoCityStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geo/admin/cities/{cityId}/zones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a delivery zone with fee slabs
         * @description name 1..80 characters; status active or paused. polygon: GeoJSON Polygon, [longitude,latitude] positions, closed rings (4..500 positions, <= 10 rings). PostGIS must find it valid, non-empty and non-self-intersecting; an active zone may not intersect (including touching) another active zone in the same city (pending Q-37). No city boundary is stored, so "within city" cannot be checked server-side. feeSlabs: 1..3 bands {upperDistanceKm (0..999.99, two decimals), feePaise (integer paise)} with strictly increasing upperDistanceKm; the first band whose bound includes the distance applies and beyond the last band the last fee applies. Zones price platform-rider delivery only and never grant admin authority. Emits geo.zone.changed. super_admin only (regular admins are denied even when assigned to the city); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        post: operations["superAdminGeoZoneCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geo/admin/zones/{zoneId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a delivery zone
         * @description Requires expectedVersion. Deletes the zone and its fee slabs; points formerly in it use the configured default delivery-fee schedule from settings for an enabled city. Emits geo.zone.changed (change deleted). super_admin only (regular admins are denied even when assigned to the city); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        delete: operations["superAdminGeoZoneDelete"];
        options?: never;
        head?: never;
        /**
         * Update a delivery zone
         * @description Allow-listed name, polygon, feeSlabs (replaces all bands) and status, at least one, with expectedVersion. polygon: GeoJSON Polygon, [longitude,latitude] positions, closed rings (4..500 positions, <= 10 rings). PostGIS must find it valid, non-empty and non-self-intersecting; an active zone may not intersect (including touching) another active zone in the same city (pending Q-37). No city boundary is stored, so "within city" cannot be checked server-side. feeSlabs: 1..3 bands {upperDistanceKm (0..999.99, two decimals), feePaise (integer paise)} with strictly increasing upperDistanceKm; the first band whose bound includes the distance applies and beyond the last band the last fee applies. Activating a paused zone re-checks overlap. Emits geo.zone.changed. super_admin only (regular admins are denied even when assigned to the city); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.
         */
        patch: operations["superAdminGeoZoneUpdate"];
        trace?: never;
    };
    "/geo/cities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List selectable cities */
        get: operations["geoCities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geo/cities/{cityId}/areas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Find areas within a city */
        get: operations["geoCityAreas"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geo/location/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resolve a GPS point, PIN code or area to a city
         * @description Guest (anonymous browser session) or signed-in user; location is optional and manual area/PIN selection always remains available. Exactly one selector: {lat,lng} (WGS84, finite, in bounds), {pinCode} (six digits) or {areaId}; optional cityId constrains the match to the chosen city. GPS resolves only against configured PostGIS delivery-zone polygons (no maps/geocoding provider): it returns the city and the covering active zone, never an area. A PIN shared by several cities or a point outside every configured zone is LOCATION_UNRESOLVED. serviceable reflects city status only (enabled); it is not a delivery promise: business delivery mode/radius is checked separately. Coordinates are used for this lookup only and are never stored or logged. Read-only and safe to retry. Limited per session and per network address. Blocked with MAINTENANCE while maintenance mode is on.
         */
        post: operations["geoLocationResolve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geo/waitlist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Ask to be notified when service reaches a city
         * @description Explicit phone submission from a guest or signed-in user. Accepts a 10-digit Indian mobile (optional +91) and the selected city, if any. Stores only the encrypted phone, a keyed lookup hash and the city; the phone is never logged or echoed. This is not marketing consent and no message or job is created (notification target/channel/retention pending Q-35). Limited to 5 per hour per session and per network address. Blocked with MAINTENANCE while maintenance mode is on.
         */
        post: operations["geoWaitlistJoin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Platform status
         * @description HTTP 200 with status ok or maintenance and checkedAt; always admitted, no-store, no dependency or secret details. Infrastructure probes use /health/live and /health/ready.
         */
        get: operations["healthStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Process liveness */
        get: operations["healthLive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Runtime prerequisites readiness */
        get: operations["healthReady"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/legal/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read a published legal page
         * @description Localized title and sanitised Markdown-subset body (headings, paragraphs, lists, https links); render without raw HTML. Web caches under the ISR tag legal:{slug}, revalidated by legal.updated. Admitted during maintenance.
         */
        get: operations["legalPage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/media/policies/catalog_taxonomy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read configured taxonomy image upload limits */
        get: operations["mediaTaxonomyImagePolicy"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/media/previews/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read an owned image preview */
        get: operations["mediaImagePreview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/media/public/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read a currently published image placement */
        get: operations["mediaPublicImage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head: operations["ImageController_head"];
        patch?: never;
        trace?: never;
    };
    "/media/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload a sanitized taxonomy image */
        post: operations["mediaUpload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read the safe public settings projection
         * @description Branding, current feature flags, checkout payment-method availability (flag on and prerequisites configured), approved refund policy, safe upload constraints, SEO defaults, enabled public plan/promotion prices, configured support Call/WhatsApp E.164 contacts (null when not configured) and version metadata. Unconfigured keys are null. Never returns credentials, sender secrets, supplier evidence or internal tax configuration. Not cached (current flags); admitted during maintenance.
         */
        get: operations["settingsPublic"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Platform activity monitor
         * @description super_admin only; platform-wide including global/unscoped rows. actorRole narrows by the recorded actor role; actorId is the exact Admin-card shortcut. Filters are allow-listed and only narrow results: q is full-text over actor label, action and the redacted summary (plain words); action/entityType are exact keys; actorId is the exact actor user ID (labels never change identity filtering); from/to are inclusive IST calendar dates (YYYY-MM-DD) converted to UTC instants. Ordered occurredAt DESC, id DESC; the opaque cursor is bound to the filters, actor and scope revision. private, no-store.
         */
        get: operations["SuperAdminActivityController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/activity/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read one activity entry with its diff
         * @description super_admin only; platform-wide including global/unscoped rows. actorRole narrows by the recorded actor role; actorId is the exact Admin-card shortcut. before/after contain only changed allow-listed fields, recursively redacted at write time. private, no-store.
         */
        get: operations["SuperAdminActivityController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/activity/export.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export platform activity as CSV
         * @description super_admin only; platform-wide including global/unscoped rows. actorRole narrows by the recorded actor role; actorId is the exact Admin-card shortcut. Same filters as the activity list (no cursor/limit), applied identically. Matching rows are counted first; more than 100000 is REPORT_TOO_LARGE. The export is itself audited (audit.exported, with the server-resolved filters and row count) before streaming. Columns: Time (IST), Actor, Role, Action, Entity, Summary, Before, After (redacted JSON). Cells starting with = + - @, tab or CR are prefixed with an apostrophe. Rows are limited to those recorded before the export started. private, no-store.
         */
        get: operations["SuperAdminActivityController_export"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/admins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List admin accounts
         * @description super_admin only. q matches display name or an exact verified phone (email is encrypted and not searchable). areaId matches an exact area grant or a whole-city grant of its city; zoneId is mutually exclusive with areaId and matches a whole-city grant of the zone city (Geo supplies no authoritative zone→area mapping, so area-only grants never match by same-city inference). Cards include full contact fields for the management purpose; zones lists the zones of whole-city grants, and `unavailable` includes zones when the admin has area grants whose zone coverage is unknown. Ordered newest first; total counts the filtered set. private, no-store.
         */
        get: operations["SuperAdminAdminsController_list"];
        put?: never;
        /**
         * Create an admin account
         * @description Resolves (or creates) the user by verified phone, stores the email encrypted, seeds module permissions from the role, grants the listed areas and assigns the admin role. Whole-city grants and communication scopes are never granted here. Audited and emits admin.scope_changed.
         */
        post: operations["SuperAdminAdminsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/admins/{id}/areas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Replace an admin’s area grants
         * @description Replaces exact area grants only; explicit whole-city grants are untouched. Audited and emits admin.scope_changed.
         */
        put: operations["SuperAdminAdminsController_setAreas"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/admins/{id}/impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Deactivation impact preview
         * @description Areas of this admin that would be left without another active admin. openCasesInScope is null and listed in `unavailable` until the owning case modules expose a count port.
         */
        get: operations["SuperAdminAdminsController_impact"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/admins/{id}/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Replace an admin’s module permissions
         * @description Normalized server-side: any action implies view; removing view clears the module. Audited and emits admin.scope_changed.
         */
        put: operations["SuperAdminAdminsController_setPermissions"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/admins/{id}/role": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Assign a role to an admin
         * @description reseedPermissions copies the role’s module permissions only; geography and communication scopes are never expanded. Audited and emits admin.scope_changed.
         */
        put: operations["SuperAdminAdminsController_setRole"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/admins/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Activate or deactivate an admin
         * @description expectedVersion is required. Deactivation revokes all of the admin’s sessions in the same transaction and takes effect immediately. A super_admin cannot change their own status. Audited and emits admin.account_status_changed.
         */
        post: operations["SuperAdminAdminsController_setStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/feature-flags/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Toggle a feature flag
         * @description Versioned toggle. booking and donations can never be enabled; payments_online and whatsapp cannot be enabled until their adapter is configured. Disabling is always allowed. Emits feature_flag.updated; consumers recheck the authoritative flag. super_admin only; admitted during maintenance for recovery. Rechecks super_admin in the transaction, writes one audit entry and its outbox events atomically.
         */
        put: operations["superAdminUpdateFeatureFlag"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/legal/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Publish a legal page
         * @description EN and HI title/body are sanitised to the allow-listed Markdown subset (headings, paragraphs, lists, https links); HTML, scripts, images and non-https links are removed before storage. expectedVersion 0 publishes the first version. Emits legal.updated (web revalidates legal:{slug}). super_admin only; admitted during maintenance for recovery. Rechecks super_admin in the transaction, writes one audit entry and its outbox events atomically.
         */
        put: operations["superAdminUpdateLegalPage"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List roles
         * @description super_admin only. Ordered by name; each role includes adminCount and isSystem. private, no-store.
         */
        get: operations["SuperAdminRolesController_list"];
        put?: never;
        /**
         * Create a role
         * @description Role names are unique case-insensitively. Permissions are normalized (any action implies view). Roles only seed new or reseeded admin permissions; they never grant geography or communication scopes. Audited and emits role.updated.
         */
        post: operations["SuperAdminRolesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/roles/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a role
         * @description System roles are locked. A role in use requires reassignTo naming a different existing role; usage is re-checked under lock and reassignment plus deletion are atomic. Each moved admin emits admin.scope_changed; the deletion is audited and emits role.updated.
         */
        delete: operations["SuperAdminRolesController_delete"];
        options?: never;
        head?: never;
        /**
         * Edit a role
         * @description Supply at least one of name, description, permissions plus expectedVersion. System roles are locked. Existing admins keep their own permissions. Returns the role with a before/after summary. Audited and emits role.updated.
         */
        patch: operations["SuperAdminRolesController_update"];
        trace?: never;
    };
    "/super-admin/roles/{id}/duplicate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Duplicate a role
         * @description Creates a non-system role named "Copy of <name>" (truncated to 40 characters) with the same description and permissions. Audited and emits role.updated.
         */
        post: operations["SuperAdminRolesController_duplicate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read all settings, flags, legal pages and readiness
         * @description Every setting key with value (null when never configured or invalid), version (0 when absent), group membership and updatedAt; feature flags with enablable; legal page status (version 0 = unpublished); integrationStatus {configured} from deployment configuration only (never secrets); readiness for plans, promotions, tax and images. private, no-store.
         */
        get: operations["superAdminSettings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/settings/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Save one ungrouped setting key
         * @description Ungrouped keys only (branding, payments, uploads, integrations, seo, tax); group members must use PUT /super-admin/settings/groups/{group}. value is validated against the key's schema (money integer paise, bps 0..10000, E.164 contacts, upload limits within hard ceilings, provider IDs only for configured adapters, complete tax references). expectedVersion 0 creates a never-configured key. Emits settings.updated. super_admin only; admitted during maintenance for recovery. Rechecks super_admin in the transaction, writes one audit entry and its outbox events atomically.
         */
        put: operations["superAdminUpdateSetting"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/super-admin/settings/groups/{group}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Atomically save a settings group
         * @description Groups: delivery_rider_pay = delivery + rider_earning; commission_plans = commission + plans + promotion_fees; policies_reviews = policies + reviews. Supply every member key exactly once with its expectedVersion (0 = never configured). All keys are validated, locked in stable order and committed together with one audit entry, settings.updated per key and settings.group_updated; any invalid or stale key rolls all back. Same key and payload replays the saved group. super_admin only; admitted during maintenance for recovery. Rechecks super_admin in the transaction, writes one audit entry and its outbox events atomically.
         */
        put: operations["superAdminUpdateSettingsGroup"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Send a message to support
         * @description Guest (anonymous browser session) or signed-in user; no phone or login required. Message-only plain text, trimmed 1..1000 characters; author and scope are derived server-side, never from the body. The message and the admin-notification outbox event commit together before 202; no ticket, reply channel or response time is promised. Limited to 5 per hour per user/anonymous session and per network address. Blocked with MAINTENANCE while maintenance mode is on.
         */
        post: operations["supportMessageCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/data-requests/{requestId}/completion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read deletion status with the completion capability
         * @description Returns only {status} for the deletion request bound to the capability. A missing, invalid, expired or mismatched capability is indistinguishable from a missing request. Response is no-store.
         */
        get: operations["DataRequestCompletionController_completion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UsersController_profile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["UsersController_updateProfile"];
        trace?: never;
    };
    "/users/me/addresses": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AddressesController_list"];
        put?: never;
        /** @description Coordinates are optional: supply both lat/lng or neither. Null clears a pair. City/area IDs are validated authoritatively; saving does not establish delivery serviceability. */
        post: operations["AddressesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/addresses/{addressId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["AddressesController_delete"];
        options?: never;
        head?: never;
        /** @description Supply at least one editable field plus expectedVersion. Send lat/lng together, or both null to clear. The merged city/area pair must remain valid. */
        patch: operations["AddressesController_update"];
        trace?: never;
    };
    "/users/me/consents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List own consent choices
         * @description Latest recorded choice for every registered purpose/channel pair with its evidence (consentId, recordedAt, noticeVersion). A pair without evidence is not granted. currentNoticeVersion is the notice a grant must acknowledge; null means grants are unavailable until an approved notice is configured.
         */
        get: operations["ConsentsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/consents/{purpose}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Record an own consent choice
         * @description Appends evidence for one registered pair: marketing with in_app|email|whatsapp; order_updates and enquiry_updates with whatsapp. channel is required. A grant must send the current noticeVersion; withdrawals are never blocked by notice copy. Repeating the current effective choice returns the latest record without new evidence or events.
         */
        put: operations["ConsentsController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/data-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Request an own data export or account deletion
         * @description type "delete" requires confirmed: true (else VALIDATION_ERROR). An open deletion request is returned instead of creating another; a blocked/failed one is re-queued and resumes from recorded owner receipts. A confirmed, unfinished deletion returns a short-lived completionToken (only in this response, never stored in plaintext) for GET /users/data-requests/{requestId}/completion; it is omitted while its lifetime awaits Q-32 approval. Without an approved Q-32 policy the request is stored and reported as status "blocked" with failureCode POLICY_PENDING; nothing is erased and no retention period is guessed.
         */
        post: operations["DataRequestsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/data-requests/{requestId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read an own data request
         * @description Owner-only status (queued, processing, blocked, completed, failed). downloadAvailable is true only for a completed, unexpired export. Without an approved Q-32 policy the request is stored and reported as status "blocked" with failureCode POLICY_PENDING; nothing is erased and no retention period is guessed.
         */
        get: operations["DataRequestsController_read"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/data-requests/{requestId}/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download an own completed data export
         * @description JSON attachment of the private generated export. Ownership, account status and expiry are rechecked on every download. Sections whose owner module is not implemented yet are explicitly "unavailable".
         */
        get: operations["DataRequestsController_download"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UsersController_preferences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["UsersController_updatePreferences"];
        trace?: never;
    };
    "/videos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get an approved video by ID
         * @description Returns only currently approved videos with Reels consent and an approved business; playback URLs are rebuilt from validated provider IDs.
         */
        get: operations["mediaPublicVideoGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/videos/{id}/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Report a currently public video
         * @description Accepts a reason and optional details from a guest or signed-in session. A report queues review and does not change video approval.
         */
        post: operations["mediaVideoReport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/videos/{videoId}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List published comments and the caller’s own pending comments
         * @description Available to anonymous and authenticated sessions. Comment text is plain JSON text; pending comments are visible only to their author.
         */
        get: operations["engagementVideoCommentsList"];
        put?: never;
        /**
         * Create a video comment
         * @description Clean comments publish immediately. Comments containing a URL or configured blocked word enter pending moderation.
         */
        post: operations["engagementVideoCommentCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/videos/{videoId}/comments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove the caller’s comment
         * @description Only the author may remove a comment. Repeating the request is safe even if the video is no longer public.
         */
        delete: operations["engagementVideoCommentDelete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AddressDeletedDto: {
            /** @enum {boolean} */
            deleted: true;
            /** Format: uuid */
            id: string;
            version: number;
        };
        AddressDto: {
            addressText: string;
            /** Format: uuid */
            areaId: string | null;
            /** Format: uuid */
            cityId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            isDefault: boolean;
            label: string;
            landmark: string | null;
            lat: number | null;
            lng: number | null;
            pinCode: string;
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        AddressPageDto: {
            items: {
                addressText: string;
                /** Format: uuid */
                areaId: string | null;
                /** Format: uuid */
                cityId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                isDefault: boolean;
                label: string;
                landmark: string | null;
                lat: number | null;
                lng: number | null;
                pinCode: string;
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
            nextCursor: string | null;
        };
        AdminCardDto: {
            areas: {
                /** Format: uuid */
                cityId: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
            }[];
            cities: {
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
            }[];
            cityWideIds: string[];
            communicationScopes: ("city" | "zone")[];
            /** Format: date-time */
            createdAt: string;
            /** Format: email */
            email: string;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            lastActiveAt: string | null;
            name: string;
            permissions: {
                approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                comms: ("view" | "create" | "edit" | "delete" | "export")[];
                orders: ("view" | "create" | "edit" | "delete" | "export")[];
                promos: ("view" | "create" | "edit" | "delete" | "export")[];
                reports: ("view" | "create" | "edit" | "delete" | "export")[];
                reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                users: ("view" | "create" | "edit" | "delete" | "export")[];
            };
            phoneE164: string | null;
            role: {
                /** Format: uuid */
                id: string;
                name: string;
            };
            /** @enum {string} */
            status: "active" | "inactive";
            unavailable: ("zones" | "openCasesInScope")[];
            version: number;
            zones: {
                /** Format: uuid */
                cityId: string;
                /** Format: uuid */
                id: string;
                name: string;
            }[];
        };
        AdminCategoryDto: {
            active: boolean;
            /** Format: date-time */
            createdAt: string;
            icon?: string;
            /** Format: uuid */
            id: string;
            image?: {
                /** Format: uuid */
                assetId: string;
                height: number;
                mimeType: string;
                /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                path: string;
                variants: {
                    bytes: number;
                    height: number;
                    /** @enum {string} */
                    mimeType: "image/webp";
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    width: number;
                }[];
                width: number;
            };
            /** Format: uuid */
            imageAssetId: string | null;
            /** @enum {string} */
            kind: "product" | "service";
            nameEn: string;
            nameHi: string;
            relatedCategoryIds: string[];
            slug: string;
            sortOrder: number;
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        AdminCategoryTreeDto: {
            items: {
                active: boolean;
                /** Format: date-time */
                createdAt: string;
                icon?: string;
                /** Format: uuid */
                id: string;
                image?: {
                    /** Format: uuid */
                    assetId: string;
                    height: number;
                    mimeType: string;
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    variants: {
                        bytes: number;
                        height: number;
                        /** @enum {string} */
                        mimeType: "image/webp";
                        /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                        path: string;
                        width: number;
                    }[];
                    width: number;
                };
                /** Format: uuid */
                imageAssetId: string | null;
                /** @enum {string} */
                kind: "product" | "service";
                nameEn: string;
                nameHi: string;
                relatedCategoryIds: string[];
                slug: string;
                sortOrder: number;
                subcategories: {
                    active: boolean;
                    /** Format: uuid */
                    categoryId: string;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: uuid */
                    id: string;
                    image?: {
                        /** Format: uuid */
                        assetId: string;
                        height: number;
                        mimeType: string;
                        /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                        path: string;
                        variants: {
                            bytes: number;
                            height: number;
                            /** @enum {string} */
                            mimeType: "image/webp";
                            /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                            path: string;
                            width: number;
                        }[];
                        width: number;
                    };
                    /** Format: uuid */
                    imageAssetId: string | null;
                    nameEn: string;
                    nameHi: string;
                    serviceTypes: string[];
                    slug: string;
                    sortOrder: number;
                    /** Format: date-time */
                    updatedAt: string;
                    version: number;
                }[];
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
        };
        AdminCityDetailDto: {
            areas: {
                /** Format: uuid */
                cityId: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
                pinCode: string | null;
                slug: string;
            }[];
            city: {
                counts: {
                    areas: number;
                    waitlist: number;
                    zones: number;
                };
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
                slug: string;
                /** @enum {string} */
                stateCode: "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "26" | "27" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09";
                /** @enum {string} */
                status: "enabled" | "disabled" | "coming_soon";
                /** Format: date-time */
                updatedAt: string;
                version: number;
            };
            zones: {
                /** Format: uuid */
                cityId: string;
                /** Format: date-time */
                createdAt: string;
                feeSlabs: {
                    feePaise: number;
                    upperDistanceKm: number;
                }[];
                /** Format: uuid */
                id: string;
                name: string;
                polygon: {
                    coordinates: [
                        number,
                        number
                    ][][];
                    /** @enum {string} */
                    type: "Polygon";
                };
                /** @enum {string} */
                status: "active" | "paused";
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
        };
        AdminCityDto: {
            counts: {
                areas: number;
                waitlist: number;
                zones: number;
            };
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            nameEn: string;
            nameHi: string;
            slug: string;
            /** @enum {string} */
            stateCode: "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "26" | "27" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09";
            /** @enum {string} */
            status: "enabled" | "disabled" | "coming_soon";
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        AdminCityPageDto: {
            items: {
                counts: {
                    areas: number;
                    waitlist: number;
                    zones: number;
                };
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
                slug: string;
                /** @enum {string} */
                stateCode: "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "26" | "27" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09";
                /** @enum {string} */
                status: "enabled" | "disabled" | "coming_soon";
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
            nextCursor: string | null;
        };
        AdminHomeSectionDto: {
            active: boolean;
            categories: {
                /** Format: uuid */
                categoryId: string;
                position: number;
            }[];
            /** Format: uuid */
            categoryId: string | null;
            /** @enum {string} */
            contentKind: "product" | "service";
            /** Format: date-time */
            createdAt: string;
            headingEn: string | null;
            headingHi: string | null;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            initialCategoryId: string | null;
            /** @enum {string} */
            kind: "single_category" | "curated_categories";
            position: number;
            supportingTextEn: string | null;
            supportingTextHi: string | null;
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        AdminHomeSectionListDto: {
            items: {
                active: boolean;
                categories: {
                    /** Format: uuid */
                    categoryId: string;
                    position: number;
                }[];
                /** Format: uuid */
                categoryId: string | null;
                /** @enum {string} */
                contentKind: "product" | "service";
                /** Format: date-time */
                createdAt: string;
                headingEn: string | null;
                headingHi: string | null;
                /** Format: uuid */
                id: string;
                /** Format: uuid */
                initialCategoryId: string | null;
                /** @enum {string} */
                kind: "single_category" | "curated_categories";
                position: number;
                supportingTextEn: string | null;
                supportingTextHi: string | null;
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
        };
        AdminImpactDto: {
            /** Format: uuid */
            adminId: string;
            areasLeftWithoutActiveAdmin: {
                /** Format: uuid */
                cityId: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
            }[];
            openCasesInScope: number | null;
            unavailable: ("zones" | "openCasesInScope")[];
        };
        AdminMeDto: {
            areas: {
                /** Format: uuid */
                cityId: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
            }[];
            cityWideIds: string[];
            communicationScopes: ("city" | "zone")[];
            emailMasked: string | null;
            /** Format: uuid */
            id: string;
            isSuper: boolean;
            name: string;
            permissions: {
                approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                comms: ("view" | "create" | "edit" | "delete" | "export")[];
                orders: ("view" | "create" | "edit" | "delete" | "export")[];
                promos: ("view" | "create" | "edit" | "delete" | "export")[];
                reports: ("view" | "create" | "edit" | "delete" | "export")[];
                reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                users: ("view" | "create" | "edit" | "delete" | "export")[];
            };
            scopeRevision: string;
        };
        AdminPageDto: {
            items: {
                areas: {
                    /** Format: uuid */
                    cityId: string;
                    /** Format: uuid */
                    id: string;
                    nameEn: string;
                    nameHi: string;
                }[];
                cities: {
                    /** Format: uuid */
                    id: string;
                    nameEn: string;
                    nameHi: string;
                }[];
                cityWideIds: string[];
                communicationScopes: ("city" | "zone")[];
                /** Format: date-time */
                createdAt: string;
                /** Format: email */
                email: string;
                /** Format: uuid */
                id: string;
                /** Format: date-time */
                lastActiveAt: string | null;
                name: string;
                permissions: {
                    approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                    catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                    comms: ("view" | "create" | "edit" | "delete" | "export")[];
                    orders: ("view" | "create" | "edit" | "delete" | "export")[];
                    promos: ("view" | "create" | "edit" | "delete" | "export")[];
                    reports: ("view" | "create" | "edit" | "delete" | "export")[];
                    reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                    users: ("view" | "create" | "edit" | "delete" | "export")[];
                };
                phoneE164: string | null;
                role: {
                    /** Format: uuid */
                    id: string;
                    name: string;
                };
                /** @enum {string} */
                status: "active" | "inactive";
                unavailable: ("zones" | "openCasesInScope")[];
                version: number;
                zones: {
                    /** Format: uuid */
                    cityId: string;
                    /** Format: uuid */
                    id: string;
                    name: string;
                }[];
            }[];
            nextCursor: string | null;
            total: number;
        };
        AdminSubcategoryDto: {
            active: boolean;
            /** Format: uuid */
            categoryId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            image?: {
                /** Format: uuid */
                assetId: string;
                height: number;
                mimeType: string;
                /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                path: string;
                variants: {
                    bytes: number;
                    height: number;
                    /** @enum {string} */
                    mimeType: "image/webp";
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    width: number;
                }[];
                width: number;
            };
            /** Format: uuid */
            imageAssetId: string | null;
            nameEn: string;
            nameHi: string;
            serviceTypes: string[];
            slug: string;
            sortOrder: number;
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        AdminSuggestionPageDto: {
            items: {
                /** Format: uuid */
                areaId: string;
                /** Format: uuid */
                businessId: string;
                candidates: {
                    nameEn: string;
                    nameHi: string;
                    similarity: number;
                    slug: string;
                    /** Format: uuid */
                    subcategoryId: string;
                }[];
                /** Format: uuid */
                categoryId: string;
                /** Format: uuid */
                cityId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                /** Format: uuid */
                mergedIntoSubcategoryId: string | null;
                nameEn: string;
                nameHi: string | null;
                reason: string | null;
                rejectionReason: string | null;
                /** Format: date-time */
                reviewedAt: string | null;
                /** @enum {string} */
                status: "pending" | "approved" | "rejected" | "merged";
                /** Format: uuid */
                subcategoryId: string | null;
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
            nextCursor: string | null;
        };
        AuditEntryDetailDto: {
            action: string;
            actorLabel: string;
            /** @enum {string} */
            actorRole: "customer" | "vendor" | "provider" | "rider" | "admin" | "super_admin" | "system";
            /** Format: uuid */
            actorUserId: string | null;
            after: {
                [key: string]: components["schemas"]["AuditEntryDetailDto__schema0"];
            } | null;
            /** Format: uuid */
            areaId: string | null;
            before: {
                [key: string]: components["schemas"]["AuditEntryDetailDto__schema0"];
            } | null;
            /** Format: uuid */
            cityId: string | null;
            /** Format: uuid */
            entityId: string | null;
            entityType: string;
            hasDiff: boolean;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            occurredAt: string;
            summary: string;
        };
        AuditEntryDetailDto__schema0: (string | number | boolean | components["schemas"]["AuditEntryDetailDto__schema0"][] | {
            [key: string]: components["schemas"]["AuditEntryDetailDto__schema0"];
        }) | null;
        AuditPageDto: {
            items: {
                action: string;
                actorLabel: string;
                /** @enum {string} */
                actorRole: "customer" | "vendor" | "provider" | "rider" | "admin" | "super_admin" | "system";
                /** Format: uuid */
                actorUserId: string | null;
                /** Format: uuid */
                entityId: string | null;
                entityType: string;
                hasDiff: boolean;
                /** Format: uuid */
                id: string;
                /** Format: date-time */
                occurredAt: string;
                summary: string;
            }[];
            nextCursor: string | null;
        };
        AuthErrorDto: {
            code: string;
            correlationId: string;
            details: {
                field?: string;
                fields?: string[];
            };
            message_key: string;
            status: number;
        };
        CategoryDetailDto: {
            category: {
                active: boolean;
                icon?: string;
                /** Format: uuid */
                id: string;
                image?: {
                    /** Format: uuid */
                    assetId: string;
                    height: number;
                    mimeType: string;
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    variants: {
                        bytes: number;
                        height: number;
                        /** @enum {string} */
                        mimeType: "image/webp";
                        /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                        path: string;
                        width: number;
                    }[];
                    width: number;
                };
                /** @enum {string} */
                kind: "product" | "service";
                nameEn: string;
                nameHi: string;
                slug: string;
                sortOrder: number;
            };
            subcategories: {
                active: boolean;
                /** Format: uuid */
                categoryId: string;
                /** Format: uuid */
                id: string;
                image?: {
                    /** Format: uuid */
                    assetId: string;
                    height: number;
                    mimeType: string;
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    variants: {
                        bytes: number;
                        height: number;
                        /** @enum {string} */
                        mimeType: "image/webp";
                        /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                        path: string;
                        width: number;
                    }[];
                    width: number;
                };
                nameEn: string;
                nameHi: string;
                serviceTypes: string[];
                slug: string;
                sortOrder: number;
            }[];
        };
        CategoryListDto: {
            items: {
                active: boolean;
                icon?: string;
                /** Format: uuid */
                id: string;
                image?: {
                    /** Format: uuid */
                    assetId: string;
                    height: number;
                    mimeType: string;
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    variants: {
                        bytes: number;
                        height: number;
                        /** @enum {string} */
                        mimeType: "image/webp";
                        /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                        path: string;
                        width: number;
                    }[];
                    width: number;
                };
                /** @enum {string} */
                kind: "product" | "service";
                nameEn: string;
                nameHi: string;
                slug: string;
                sortOrder: number;
            }[];
        };
        ChallengeDto: {
            /** Format: uuid */
            challengeId: string;
            /** Format: date-time */
            expiresAt: string;
            /** Format: date-time */
            resendAfter: string;
        };
        ChallengeInputDto: {
            phone: string;
        };
        ConsentListDto: {
            currentNoticeVersion: string | null;
            items: {
                /** @enum {string} */
                channel: "in_app" | "email" | "whatsapp";
                /** Format: uuid */
                consentId: string | null;
                granted: boolean;
                noticeVersion: string | null;
                /** @enum {string} */
                purpose: "marketing" | "order_updates" | "enquiry_updates";
                /** Format: date-time */
                recordedAt: string | null;
            }[];
        };
        ConsentRecordDto: {
            /** @enum {string} */
            channel: "in_app" | "email" | "whatsapp";
            /** Format: uuid */
            consentId: string;
            granted: boolean;
            noticeVersion: string | null;
            /** @enum {string} */
            purpose: "marketing" | "order_updates" | "enquiry_updates";
            /** Format: date-time */
            recordedAt: string;
        };
        CreateAddressDto: {
            addressText: string;
            /**
             * Format: uuid
             * @default null
             */
            areaId: string | null;
            /** Format: uuid */
            cityId: string;
            /** @default false */
            isDefault: boolean;
            label: string;
            /** @default null */
            landmark: string | null;
            /** @default null */
            lat: number | null;
            /** @default null */
            lng: number | null;
            pinCode: string;
        };
        CreateAdminDto: {
            areaIds: string[];
            displayName: string;
            /** Format: email */
            email: string;
            phone: string;
            /** Format: uuid */
            roleId: string;
        };
        CreateCategoryDto: {
            icon?: string;
            /** Format: uuid */
            imageAssetId?: string | null;
            /** @enum {string} */
            kind: "product" | "service";
            nameEn: string;
            nameHi: string;
            slug: string;
            sortOrder?: number;
        };
        CreateCityDto: {
            nameEn: string;
            nameHi: string;
            /** @enum {string} */
            stateCode: "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "26" | "27" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09";
            /** @enum {string} */
            status: "enabled" | "disabled" | "coming_soon";
        };
        CreateDataRequestDto: {
            /** @enum {boolean} */
            confirmed?: true;
            /** @enum {string} */
            type: "export" | "delete";
        };
        CreateHomeSectionDto: {
            /** Format: uuid */
            categoryId: string;
            /** @enum {string} */
            contentKind: "product" | "service";
            /** @enum {string} */
            kind: "single_category";
            position: number;
            supportingTextEn?: string;
            supportingTextHi?: string;
        } | {
            categories: {
                /** Format: uuid */
                categoryId: string;
                position: number;
            }[];
            /** @enum {string} */
            contentKind: "product" | "service";
            headingEn: string;
            headingHi: string;
            /** Format: uuid */
            initialCategoryId: string;
            /** @enum {string} */
            kind: "curated_categories";
            position: number;
            supportingTextEn?: string;
            supportingTextHi?: string;
        };
        CreateKeywordMappingDto: {
            canonicalTerm: string;
            synonyms: string[];
            targets: ({
                /** Format: uuid */
                categoryId: string;
                /** @enum {string} */
                kind: "category";
            } | {
                /** @enum {string} */
                kind: "subcategory";
                /** Format: uuid */
                subcategoryId: string;
            } | {
                /** @enum {string} */
                kind: "product_tag";
                productTag: string;
            })[];
        };
        CreateRoleDto: {
            /** @default null */
            description: string | null;
            name: string;
            permissions: {
                approvals?: ("view" | "create" | "edit" | "delete" | "export")[];
                catalog?: ("view" | "create" | "edit" | "delete" | "export")[];
                comms?: ("view" | "create" | "edit" | "delete" | "export")[];
                orders?: ("view" | "create" | "edit" | "delete" | "export")[];
                promos?: ("view" | "create" | "edit" | "delete" | "export")[];
                reports?: ("view" | "create" | "edit" | "delete" | "export")[];
                reviews?: ("view" | "create" | "edit" | "delete" | "export")[];
                users?: ("view" | "create" | "edit" | "delete" | "export")[];
            };
        };
        CreateSubcategoryDto: {
            expectedVersion?: number;
            /** Format: uuid */
            imageAssetId?: string | null;
            nameEn: string;
            nameHi: string;
            serviceTypes?: string[];
        };
        CreateSupportMessageDto: {
            message: string;
        };
        CreateVideoDto: {
            /** @default  */
            caption: string;
            /** @default [] */
            hashtags: string[];
            /** @default false */
            showInGallery: boolean;
            /** @default false */
            showInReels: boolean;
            source: {
                /** @enum {string} */
                kind: "youtube" | "instagram";
                url: string;
            };
        };
        CreateVideoReportDto: {
            details?: string;
            /** @enum {string} */
            reason: "inappropriate" | "misleading" | "spam" | "copyright" | "other";
        };
        CreateZoneDto: {
            feeSlabs: {
                feePaise: number;
                upperDistanceKm: number;
            }[];
            name: string;
            polygon: {
                coordinates: [
                    number,
                    number
                ][][];
                /** @enum {string} */
                type: "Polygon";
            };
            /** @enum {string} */
            status: "active" | "paused";
        };
        CsrfDto: {
            csrfToken: string;
        };
        DataExportDto: {
            /** Format: date-time */
            generatedAt: string;
            /** Format: uuid */
            requestId: string;
            sections: {
                addresses: {
                    items: {
                        addressText: string;
                        /** Format: uuid */
                        areaId: string | null;
                        /** Format: uuid */
                        cityId: string;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: uuid */
                        id: string;
                        isDefault: boolean;
                        label: string;
                        landmark: string | null;
                        lat: number | null;
                        lng: number | null;
                        pinCode: string;
                        /** Format: date-time */
                        updatedAt: string;
                        version: number;
                    }[];
                    /** @enum {string} */
                    status: "included";
                };
                bookmarks: {
                    /** @enum {string} */
                    reasonCode: "OWNER_NOT_IMPLEMENTED";
                    /** @enum {string} */
                    status: "unavailable";
                };
                consents: {
                    items: {
                        /** @enum {string} */
                        channel: "in_app" | "email" | "whatsapp";
                        /** Format: uuid */
                        consentId: string;
                        granted: boolean;
                        noticeVersion: string | null;
                        /** @enum {string} */
                        purpose: "marketing" | "order_updates" | "enquiry_updates";
                        /** Format: date-time */
                        recordedAt: string;
                    }[];
                    /** @enum {string} */
                    status: "included";
                };
                orders: {
                    /** @enum {string} */
                    reasonCode: "OWNER_NOT_IMPLEMENTED";
                    /** @enum {string} */
                    status: "unavailable";
                };
                profile: {
                    items: {
                        /** Format: date-time */
                        createdAt: string;
                        displayName: string | null;
                        /** Format: email */
                        email: string | null;
                        phone: string;
                        preferences: {
                            /** @enum {string} */
                            locale: "en" | "hi";
                            /** @enum {string} */
                            theme: "light" | "dark" | "auto";
                        };
                        /** Format: uuid */
                        userId: string;
                        version: number;
                    }[];
                    /** @enum {string} */
                    status: "included";
                };
                reviews: {
                    /** @enum {string} */
                    reasonCode: "OWNER_NOT_IMPLEMENTED";
                    /** @enum {string} */
                    status: "unavailable";
                };
                support_messages: {
                    items: {
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: uuid */
                        id: string;
                        message: string;
                    }[];
                    /** @enum {string} */
                    status: "included";
                };
            };
        };
        DataRequestAcceptedDto: {
            completionToken?: string;
            /** Format: date-time */
            completionTokenExpiresAt?: string;
            /** @enum {string} */
            failureCode?: "POLICY_PENDING" | "ACCOUNT_UNAVAILABLE" | "OWNER_BLOCKED" | "STORAGE_UNAVAILABLE" | "PROCESSING_FAILED";
            /** Format: date-time */
            requestedAt: string;
            /** Format: uuid */
            requestId: string;
            /** @enum {string} */
            status: "queued" | "processing" | "blocked" | "completed" | "failed";
            /** @enum {string} */
            type: "export" | "delete";
        };
        DataRequestCompletionDto: {
            /** @enum {string} */
            status: "queued" | "processing" | "blocked" | "completed" | "failed";
        };
        DataRequestDto: {
            /** Format: date-time */
            completedAt?: string;
            downloadAvailable: boolean;
            /** @enum {string} */
            failureCode?: "POLICY_PENDING" | "ACCOUNT_UNAVAILABLE" | "OWNER_BLOCKED" | "STORAGE_UNAVAILABLE" | "PROCESSING_FAILED";
            /** Format: date-time */
            requestedAt: string;
            /** Format: uuid */
            requestId: string;
            /** @enum {string} */
            status: "queued" | "processing" | "blocked" | "completed" | "failed";
            /** @enum {string} */
            type: "export" | "delete";
        };
        DecideSuggestionDto: {
            /** @enum {string} */
            action: "approve";
            approvalNameHi?: string;
            expectedVersion: number;
        } | {
            /** @enum {string} */
            action: "reject";
            expectedVersion: number;
            reason: string;
        } | {
            /** @enum {string} */
            action: "merge";
            expectedVersion: number;
            /** Format: uuid */
            targetSubcategoryId: string;
        };
        DeleteAddressDto: {
            expectedVersion: number;
        };
        DeleteZoneDto: {
            expectedVersion: number;
        };
        EmptyBodyDto: Record<string, never>;
        EmptyDto: Record<string, never>;
        EngagementStateDto: {
            /** @default [] */
            heartedTargets: {
                /** Format: uuid */
                targetId: string;
                /** @enum {string} */
                targetType: "photo" | "video";
            }[];
            likedVideoIds: string[];
            videoCounts: {
                likeCount: number;
                /** Format: uuid */
                videoId: string;
            }[];
        };
        ErrorDto: {
            code: string;
            correlationId: string;
            details: {
                field?: string;
                fields?: string[];
            };
            message_key: string;
            status: number;
        };
        ExpectedVersionBodyDto: {
            expectedVersion: number;
        };
        FeatureFlagDto: {
            enablable: boolean;
            enabled: boolean;
            /** @enum {string} */
            key: "reviews" | "guest_browse" | "whatsapp" | "booking" | "donations" | "payments_online" | "payments_cod" | "maintenance";
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        GeoAreaPageDto: {
            items: {
                /** Format: uuid */
                cityId: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
                pinCode: string | null;
                slug: string;
            }[];
            nextCursor: string | null;
        };
        GeoCityPageDto: {
            items: {
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
                slug: string;
                /** @enum {string} */
                status: "enabled" | "disabled" | "coming_soon";
            }[];
            nextCursor: string | null;
        };
        HealthDto: {
            /** @enum {string} */
            status: "ok";
        };
        HomeSectionRemovedDto: {
            /** Format: uuid */
            id: string;
            /** @enum {boolean} */
            removed: true;
            version: number;
        };
        HomeSectionStatusDto: {
            /** @enum {string} */
            event: "activate" | "deactivate";
            expectedVersion: number;
        };
        KeywordMappingDeletedDto: {
            /** @enum {boolean} */
            deleted: true;
            /** Format: uuid */
            id: string;
        };
        KeywordMappingDto: {
            canonicalTerm: string;
            /** Format: date-time */
            createdAt: string;
            enabled: boolean;
            /** Format: uuid */
            id: string;
            synonyms: string[];
            targets: ({
                /** Format: uuid */
                categoryId: string;
                /** @enum {string} */
                kind: "category";
            } | {
                /** @enum {string} */
                kind: "subcategory";
                /** Format: uuid */
                subcategoryId: string;
            } | {
                /** @enum {string} */
                kind: "product_tag";
                productTag: string;
            })[];
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        KeywordMappingPageDto: {
            items: {
                canonicalTerm: string;
                /** Format: date-time */
                createdAt: string;
                enabled: boolean;
                /** Format: uuid */
                id: string;
                synonyms: string[];
                targets: ({
                    /** Format: uuid */
                    categoryId: string;
                    /** @enum {string} */
                    kind: "category";
                } | {
                    /** @enum {string} */
                    kind: "subcategory";
                    /** Format: uuid */
                    subcategoryId: string;
                } | {
                    /** @enum {string} */
                    kind: "product_tag";
                    productTag: string;
                })[];
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
            nextCursor: string | null;
        };
        LegalPageAdminDto: {
            bodyEn: string;
            bodyHi: string;
            /** Format: date-time */
            publishedAt: string;
            /** @enum {string} */
            slug: "terms" | "privacy" | "refund" | "about";
            titleEn: string;
            titleHi: string;
            version: number;
        };
        LegalPageDto: {
            body: string;
            /** @enum {string} */
            locale: "en" | "hi";
            /** @enum {string} */
            slug: "terms" | "privacy" | "refund" | "about";
            title: string;
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        LocationResolutionDto: {
            area: {
                /** Format: uuid */
                cityId: string;
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
                pinCode: string | null;
                slug: string;
            } | null;
            city: {
                /** Format: uuid */
                id: string;
                nameEn: string;
                nameHi: string;
                slug: string;
                /** @enum {string} */
                status: "enabled" | "disabled" | "coming_soon";
            };
            serviceable: boolean;
            /** @enum {string} */
            source: "gps" | "pin" | "area";
            zone: {
                /** Format: uuid */
                id: string;
                name: string;
            } | null;
        };
        LocationResolveDto: {
            /** Format: uuid */
            areaId?: string;
            /** Format: uuid */
            cityId?: string;
            lat?: number;
            lng?: number;
            pinCode?: string;
        };
        LogoutDto: {
            /** @enum {boolean} */
            loggedOut: true;
        };
        MediaPolicyDto: {
            policy: {
                allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                enabled: boolean;
                maxBytes: number;
                maxHeight: number;
                maxPixels: number;
                maxWidth: number;
                minHeight: number;
                /** @enum {number} */
                minQuality: 60;
                minWidth: number;
                /** @enum {number} */
                quality: 80;
                variants: {
                    maxBytes: number;
                    width: number;
                }[];
                version: number;
            };
            /** @enum {string} */
            purpose: "catalog_taxonomy";
        };
        MediaReportDecisionDto: {
            /** @enum {string} */
            action: "dismiss" | "remove";
            expectedVersion: number;
            reason?: string;
            targetVersion: number;
        };
        MediaReportDecisionResultDto: {
            /** Format: uuid */
            reportId: string;
            reportVersion: number;
            /** @enum {string} */
            resolution: "dismissed" | "removed";
            /** @enum {string} */
            status: "resolved";
            /** @enum {string} */
            targetStatus: "pending" | "approved" | "rejected" | "removed";
            targetVersion: number;
        };
        MediaUploadDto: {
            /** Format: uuid */
            assetId: string;
            bytes: number;
            height: number;
            /** @enum {string} */
            mimeType: "image/webp";
            /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
            previewPath: string;
            /** @enum {string} */
            purpose: "catalog_taxonomy";
            /** @enum {string} */
            status: "ready";
            /** @enum {string} */
            visibility: "public";
            width: number;
        };
        PlatformHealthDto: {
            /** Format: date-time */
            checkedAt: string;
            /** @enum {string} */
            status: "ok" | "maintenance";
        };
        PreferencesDto: {
            /** @enum {string} */
            locale: "en" | "hi";
            /** @enum {string} */
            theme: "light" | "dark" | "auto";
        };
        ProfileDto: {
            displayName: string | null;
            /** Format: email */
            email: string | null;
            phone: string;
            /** Format: uuid */
            userId: string;
            version: number;
        };
        PublicSettingsDto: {
            branding: {
                nameEn: string;
                nameHi: string;
                taglineEn: string;
                taglineHi: string;
            } | null;
            flags: {
                booking: boolean;
                donations: boolean;
                guest_browse: boolean;
                maintenance: boolean;
                payments_cod: boolean;
                payments_online: boolean;
                reviews: boolean;
                whatsapp: boolean;
            };
            /** Format: date-time */
            generatedAt: string;
            paymentMethods: {
                cod: boolean;
                online: boolean;
            };
            plans: {
                /** @enum {number} */
                billingPeriodMonths: 1;
                code: string;
                nameEn: string;
                nameHi: string;
                premium: boolean;
                pricePaise: number;
            }[];
            promotions: {
                code: string;
                /** @enum {number} */
                durationDays: 7;
                /** @enum {string} */
                kind: "homepage_banner" | "featured_business";
                nameEn: string;
                nameHi: string;
                pricePaise: number;
            }[];
            refundPolicy: {
                refundWindowHours: number;
            } | null;
            seo: {
                descriptionEn: string;
                descriptionHi: string;
                titleEn: string;
                titleHi: string;
            } | null;
            support: {
                callPhoneE164: string | null;
                whatsappPhoneE164: string | null;
            };
            uploads: {
                purposes: {
                    [key: string]: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        minWidth: number;
                    };
                };
            } | null;
            versions: {
                flags: {
                    [key: string]: number;
                };
                settings: {
                    [key: string]: number;
                };
            };
        };
        RoleDeletedDto: {
            /** @enum {boolean} */
            deleted: true;
            /** Format: uuid */
            id: string;
            reassignedCount: number;
            /** Format: uuid */
            reassignedTo: string | null;
        };
        RoleDto: {
            adminCount: number;
            /** Format: date-time */
            createdAt: string;
            description: string | null;
            /** Format: uuid */
            id: string;
            isSystem: boolean;
            name: string;
            permissions: {
                approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                comms: ("view" | "create" | "edit" | "delete" | "export")[];
                orders: ("view" | "create" | "edit" | "delete" | "export")[];
                promos: ("view" | "create" | "edit" | "delete" | "export")[];
                reports: ("view" | "create" | "edit" | "delete" | "export")[];
                reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                users: ("view" | "create" | "edit" | "delete" | "export")[];
            };
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        RolePageDto: {
            items: {
                adminCount: number;
                /** Format: date-time */
                createdAt: string;
                description: string | null;
                /** Format: uuid */
                id: string;
                isSystem: boolean;
                name: string;
                permissions: {
                    approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                    catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                    comms: ("view" | "create" | "edit" | "delete" | "export")[];
                    orders: ("view" | "create" | "edit" | "delete" | "export")[];
                    promos: ("view" | "create" | "edit" | "delete" | "export")[];
                    reports: ("view" | "create" | "edit" | "delete" | "export")[];
                    reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                    users: ("view" | "create" | "edit" | "delete" | "export")[];
                };
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
            nextCursor: string | null;
        };
        RoleUpdateResultDto: {
            role: {
                adminCount: number;
                /** Format: date-time */
                createdAt: string;
                description: string | null;
                /** Format: uuid */
                id: string;
                isSystem: boolean;
                name: string;
                permissions: {
                    approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                    catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                    comms: ("view" | "create" | "edit" | "delete" | "export")[];
                    orders: ("view" | "create" | "edit" | "delete" | "export")[];
                    promos: ("view" | "create" | "edit" | "delete" | "export")[];
                    reports: ("view" | "create" | "edit" | "delete" | "export")[];
                    reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                    users: ("view" | "create" | "edit" | "delete" | "export")[];
                };
                /** Format: date-time */
                updatedAt: string;
                version: number;
            };
            summary: {
                after: {
                    description: string | null;
                    name: string;
                    permissions: {
                        approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                        catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                        comms: ("view" | "create" | "edit" | "delete" | "export")[];
                        orders: ("view" | "create" | "edit" | "delete" | "export")[];
                        promos: ("view" | "create" | "edit" | "delete" | "export")[];
                        reports: ("view" | "create" | "edit" | "delete" | "export")[];
                        reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                        users: ("view" | "create" | "edit" | "delete" | "export")[];
                    };
                };
                before: {
                    description: string | null;
                    name: string;
                    permissions: {
                        approvals: ("view" | "create" | "edit" | "delete" | "export")[];
                        catalog: ("view" | "create" | "edit" | "delete" | "export")[];
                        comms: ("view" | "create" | "edit" | "delete" | "export")[];
                        orders: ("view" | "create" | "edit" | "delete" | "export")[];
                        promos: ("view" | "create" | "edit" | "delete" | "export")[];
                        reports: ("view" | "create" | "edit" | "delete" | "export")[];
                        reviews: ("view" | "create" | "edit" | "delete" | "export")[];
                        users: ("view" | "create" | "edit" | "delete" | "export")[];
                    };
                };
                changed: boolean;
            };
        };
        SavedSettingDto: {
            /** Format: uuid */
            changeSetId: string;
            entry: {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "branding";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    nameEn: string;
                    nameHi: string;
                    taglineEn: string;
                    taglineHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "delivery";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    slabs: {
                        feePaise: number;
                        uptoKm: number;
                    }[];
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "rider_earning";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    basePaise: number;
                    perKmPaise: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "commission";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    defaultBps: number;
                    platformFeePaise: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "plans";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    /** @enum {number} */
                    billingPeriodMonths: 1;
                    code: string;
                    commissionBps: number;
                    enabled: boolean;
                    nameEn: string;
                    nameHi: string;
                    premium: boolean;
                    pricePaise: number;
                }[] | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "promotion_fees";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    code: string;
                    /** @enum {number} */
                    durationDays: 7;
                    enabled: boolean;
                    /** @enum {string} */
                    kind: "homepage_banner" | "featured_business";
                    nameEn: string;
                    nameHi: string;
                    pricePaise: number;
                }[] | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "payments";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    gatewayId: string | null;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "policies";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    refundWindowHours: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "reviews";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    blockedWords: string[];
                    ruleEn: string;
                    ruleHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "uploads";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    purposes: {
                        business_profile_cover: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        business_profile_logo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        catalog_taxonomy: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        gallery: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        offer_banner: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        product: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        review_photo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        service: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        video_thumbnail: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                    };
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "integrations";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    /** Format: email */
                    emailSender: string | null;
                    smsProviderId: string | null;
                    supportCallE164: string | null;
                    supportWhatsappE164: string | null;
                    whatsappNumber: string | null;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "seo";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    descriptionEn: string;
                    descriptionHi: string;
                    titleEn: string;
                    titleHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "tax";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    classifications: {
                        cessRateBps: number;
                        code: string;
                        gstRateBps: number;
                        hsnOrSac: string;
                        /** @enum {string} */
                        supplyType: "taxable" | "exempt" | "nil_rated";
                        unitCode: string;
                    }[];
                    feeTaxCodes: {
                        commission: string;
                        platformDelivery: string;
                        platformFee: string;
                        promotion: string;
                        subscription: string;
                    };
                    platformSupplier: {
                        address: string;
                        authorizedSignatoryRef: string;
                        gstin?: string;
                        legalName: string;
                        /** @enum {string} */
                        registrationMode: "regular" | "composition" | "exempt" | "unregistered";
                        requiresIrn: boolean;
                        stateCode: string;
                        supplierRef: string;
                        version: number;
                    };
                    versionEvidence: {
                        evidenceRef: string;
                        /** @enum {boolean} */
                        verified: true;
                        /** Format: date-time */
                        verifiedAt: string;
                    };
                } | null;
                version: number;
            };
        };
        SavedSettingsGroupDto: {
            /** Format: uuid */
            changeSetId: string;
            /** @enum {string} */
            group: "delivery_rider_pay" | "commission_plans" | "policies_reviews";
            values: ({
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "branding";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    nameEn: string;
                    nameHi: string;
                    taglineEn: string;
                    taglineHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "delivery";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    slabs: {
                        feePaise: number;
                        uptoKm: number;
                    }[];
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "rider_earning";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    basePaise: number;
                    perKmPaise: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "commission";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    defaultBps: number;
                    platformFeePaise: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "plans";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    /** @enum {number} */
                    billingPeriodMonths: 1;
                    code: string;
                    commissionBps: number;
                    enabled: boolean;
                    nameEn: string;
                    nameHi: string;
                    premium: boolean;
                    pricePaise: number;
                }[] | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "promotion_fees";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    code: string;
                    /** @enum {number} */
                    durationDays: 7;
                    enabled: boolean;
                    /** @enum {string} */
                    kind: "homepage_banner" | "featured_business";
                    nameEn: string;
                    nameHi: string;
                    pricePaise: number;
                }[] | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "payments";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    gatewayId: string | null;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "policies";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    refundWindowHours: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "reviews";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    blockedWords: string[];
                    ruleEn: string;
                    ruleHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "uploads";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    purposes: {
                        business_profile_cover: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        business_profile_logo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        catalog_taxonomy: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        gallery: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        offer_banner: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        product: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        review_photo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        service: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        video_thumbnail: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                    };
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "integrations";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    /** Format: email */
                    emailSender: string | null;
                    smsProviderId: string | null;
                    supportCallE164: string | null;
                    supportWhatsappE164: string | null;
                    whatsappNumber: string | null;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "seo";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    descriptionEn: string;
                    descriptionHi: string;
                    titleEn: string;
                    titleHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "tax";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    classifications: {
                        cessRateBps: number;
                        code: string;
                        gstRateBps: number;
                        hsnOrSac: string;
                        /** @enum {string} */
                        supplyType: "taxable" | "exempt" | "nil_rated";
                        unitCode: string;
                    }[];
                    feeTaxCodes: {
                        commission: string;
                        platformDelivery: string;
                        platformFee: string;
                        promotion: string;
                        subscription: string;
                    };
                    platformSupplier: {
                        address: string;
                        authorizedSignatoryRef: string;
                        gstin?: string;
                        legalName: string;
                        /** @enum {string} */
                        registrationMode: "regular" | "composition" | "exempt" | "unregistered";
                        requiresIrn: boolean;
                        stateCode: string;
                        supplierRef: string;
                        version: number;
                    };
                    versionEvidence: {
                        evidenceRef: string;
                        /** @enum {boolean} */
                        verified: true;
                        /** Format: date-time */
                        verifiedAt: string;
                    };
                } | null;
                version: number;
            })[];
        };
        SessionDto: {
            /** @enum {string} */
            accountStatus: "active" | "suspended" | "deleting";
            approvalStates: {
                /** @enum {string} */
                businesses: "unavailable";
                /** @enum {string} */
                rider: "unavailable";
            };
            /** Format: date-time */
            expiresAt: string;
            roles: ("customer" | "vendor" | "provider" | "rider" | "admin" | "super_admin")[];
            /** Format: uuid */
            userId: string;
        };
        SetAdminAreasDto: {
            areaIds: string[];
            expectedVersion: number;
        };
        SetAdminPermissionsDto: {
            expectedVersion: number;
            permissions: {
                approvals?: ("view" | "create" | "edit" | "delete" | "export")[];
                catalog?: ("view" | "create" | "edit" | "delete" | "export")[];
                comms?: ("view" | "create" | "edit" | "delete" | "export")[];
                orders?: ("view" | "create" | "edit" | "delete" | "export")[];
                promos?: ("view" | "create" | "edit" | "delete" | "export")[];
                reports?: ("view" | "create" | "edit" | "delete" | "export")[];
                reviews?: ("view" | "create" | "edit" | "delete" | "export")[];
                users?: ("view" | "create" | "edit" | "delete" | "export")[];
            };
        };
        SetAdminRoleDto: {
            expectedVersion: number;
            reseedPermissions: boolean;
            /** Format: uuid */
            roleId: string;
        };
        SetAdminStatusDto: {
            expectedVersion: number;
            /** @enum {string} */
            status: "active" | "inactive";
        };
        SetCityStatusDto: {
            /** @enum {string} */
            action: "enable" | "disable";
            expectedVersion: number;
        };
        SubcategoryDetailDto: {
            canonicalPath: string;
            category: {
                active: boolean;
                icon?: string;
                /** Format: uuid */
                id: string;
                image?: {
                    /** Format: uuid */
                    assetId: string;
                    height: number;
                    mimeType: string;
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    variants: {
                        bytes: number;
                        height: number;
                        /** @enum {string} */
                        mimeType: "image/webp";
                        /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                        path: string;
                        width: number;
                    }[];
                    width: number;
                };
                /** @enum {string} */
                kind: "product" | "service";
                nameEn: string;
                nameHi: string;
                slug: string;
                sortOrder: number;
            };
            subcategory: {
                active: boolean;
                /** Format: uuid */
                categoryId: string;
                /** Format: uuid */
                id: string;
                image?: {
                    /** Format: uuid */
                    assetId: string;
                    height: number;
                    mimeType: string;
                    /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                    path: string;
                    variants: {
                        bytes: number;
                        height: number;
                        /** @enum {string} */
                        mimeType: "image/webp";
                        /** @description Root-relative same-origin Media gateway path; provider URLs are invalid. */
                        path: string;
                        width: number;
                    }[];
                    width: number;
                };
                nameEn: string;
                nameHi: string;
                serviceTypes: string[];
                slug: string;
                sortOrder: number;
            };
        };
        SuggestionDto: {
            /** Format: uuid */
            areaId: string;
            /** Format: uuid */
            businessId: string;
            /** Format: uuid */
            categoryId: string;
            /** Format: uuid */
            cityId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            mergedIntoSubcategoryId: string | null;
            nameEn: string;
            nameHi: string | null;
            reason: string | null;
            rejectionReason: string | null;
            /** Format: date-time */
            reviewedAt: string | null;
            /** @enum {string} */
            status: "pending" | "approved" | "rejected" | "merged";
            /** Format: uuid */
            subcategoryId: string | null;
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
        SuggestionDuplicateCheckDto: {
            /** Format: uuid */
            categoryId: string;
            nameEn: string;
            nameHi?: string;
        };
        SuggestionDuplicateResultDto: {
            candidates: {
                nameEn: string;
                nameHi: string;
                similarity: number;
                slug: string;
                /** Format: uuid */
                subcategoryId: string;
            }[];
            exact: boolean;
            exactSubcategory: {
                nameEn: string;
                nameHi: string;
                similarity: number;
                slug: string;
                /** Format: uuid */
                subcategoryId: string;
            } | null;
        };
        SuggestionPageDto: {
            items: {
                /** Format: uuid */
                areaId: string;
                /** Format: uuid */
                businessId: string;
                /** Format: uuid */
                categoryId: string;
                /** Format: uuid */
                cityId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                /** Format: uuid */
                mergedIntoSubcategoryId: string | null;
                nameEn: string;
                nameHi: string | null;
                reason: string | null;
                rejectionReason: string | null;
                /** Format: date-time */
                reviewedAt: string | null;
                /** @enum {string} */
                status: "pending" | "approved" | "rejected" | "merged";
                /** Format: uuid */
                subcategoryId: string | null;
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
            nextCursor: string | null;
        };
        SuggestSubcategoryDto: {
            allowSimilar?: boolean;
            /** Format: uuid */
            categoryId: string;
            nameEn: string;
            nameHi?: string;
            reason?: string;
        };
        SuperAdminSettingsDto: {
            flags: {
                enablable: boolean;
                enabled: boolean;
                /** @enum {string} */
                key: "reviews" | "guest_browse" | "whatsapp" | "booking" | "donations" | "payments_online" | "payments_cod" | "maintenance";
                /** Format: date-time */
                updatedAt: string;
                version: number;
            }[];
            integrationStatus: {
                email: {
                    configured: boolean;
                };
                gateway: {
                    configured: boolean;
                };
                sms: {
                    configured: boolean;
                };
                whatsapp: {
                    configured: boolean;
                };
            };
            legal: {
                page: {
                    bodyEn: string;
                    bodyHi: string;
                    /** Format: date-time */
                    publishedAt: string;
                    /** @enum {string} */
                    slug: "terms" | "privacy" | "refund" | "about";
                    titleEn: string;
                    titleHi: string;
                    version: number;
                } | null;
                /** @enum {string} */
                slug: "terms" | "privacy" | "refund" | "about";
                version: number;
            }[];
            readiness: {
                images: {
                    missingFields: string[];
                    ready: boolean;
                };
                plans: {
                    missingFields: string[];
                    ready: boolean;
                };
                promotions: {
                    missingFields: string[];
                    ready: boolean;
                };
                tax: {
                    missingFields: string[];
                    ready: boolean;
                };
            };
            settings: ({
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "branding";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    nameEn: string;
                    nameHi: string;
                    taglineEn: string;
                    taglineHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "delivery";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    slabs: {
                        feePaise: number;
                        uptoKm: number;
                    }[];
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "rider_earning";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    basePaise: number;
                    perKmPaise: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "commission";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    defaultBps: number;
                    platformFeePaise: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "plans";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    /** @enum {number} */
                    billingPeriodMonths: 1;
                    code: string;
                    commissionBps: number;
                    enabled: boolean;
                    nameEn: string;
                    nameHi: string;
                    premium: boolean;
                    pricePaise: number;
                }[] | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "promotion_fees";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    code: string;
                    /** @enum {number} */
                    durationDays: 7;
                    enabled: boolean;
                    /** @enum {string} */
                    kind: "homepage_banner" | "featured_business";
                    nameEn: string;
                    nameHi: string;
                    pricePaise: number;
                }[] | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "payments";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    gatewayId: string | null;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "policies";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    refundWindowHours: number;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "reviews";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    blockedWords: string[];
                    ruleEn: string;
                    ruleHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "uploads";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    purposes: {
                        business_profile_cover: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        business_profile_logo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        catalog_taxonomy: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        gallery: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        offer_banner: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        product: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        review_photo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        service: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        video_thumbnail: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                    };
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "integrations";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    /** Format: email */
                    emailSender: string | null;
                    smsProviderId: string | null;
                    supportCallE164: string | null;
                    supportWhatsappE164: string | null;
                    whatsappNumber: string | null;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "seo";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    descriptionEn: string;
                    descriptionHi: string;
                    titleEn: string;
                    titleHi: string;
                } | null;
                version: number;
            } | {
                /** @enum {string|null} */
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews" | null;
                /** @enum {string} */
                key: "tax";
                /** Format: date-time */
                updatedAt: string | null;
                value: {
                    classifications: {
                        cessRateBps: number;
                        code: string;
                        gstRateBps: number;
                        hsnOrSac: string;
                        /** @enum {string} */
                        supplyType: "taxable" | "exempt" | "nil_rated";
                        unitCode: string;
                    }[];
                    feeTaxCodes: {
                        commission: string;
                        platformDelivery: string;
                        platformFee: string;
                        promotion: string;
                        subscription: string;
                    };
                    platformSupplier: {
                        address: string;
                        authorizedSignatoryRef: string;
                        gstin?: string;
                        legalName: string;
                        /** @enum {string} */
                        registrationMode: "regular" | "composition" | "exempt" | "unregistered";
                        requiresIrn: boolean;
                        stateCode: string;
                        supplierRef: string;
                        version: number;
                    };
                    versionEvidence: {
                        evidenceRef: string;
                        /** @enum {boolean} */
                        verified: true;
                        /** Format: date-time */
                        verifiedAt: string;
                    };
                } | null;
                version: number;
            })[];
        };
        SupportMessageAcceptedDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            status: "accepted";
        };
        SupportMessageDetailDto: {
            authorLabel?: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            message: string;
            scope: {
                /** Format: uuid */
                areaId: string | null;
                /** Format: uuid */
                cityId: string | null;
            };
        };
        UpdateAddressDto: {
            addressText?: string;
            /** Format: uuid */
            areaId?: string | null;
            /** Format: uuid */
            cityId?: string;
            expectedVersion: number;
            isDefault?: boolean;
            label?: string;
            landmark?: string | null;
            lat?: number | null;
            lng?: number | null;
            pinCode?: string;
        };
        UpdateCategoryDto: {
            active?: boolean;
            expectedVersion: number;
            icon?: string | null;
            /** Format: uuid */
            imageAssetId?: string | null;
            nameEn?: string;
            nameHi?: string;
            sortOrder?: number;
        };
        UpdateCityStateCodeDto: {
            expectedVersion: number;
            /** @enum {string} */
            stateCode: "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "26" | "27" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09";
        };
        UpdateConsentDto: {
            /** @enum {string} */
            channel?: "in_app" | "email" | "whatsapp";
            granted: boolean;
            noticeVersion?: string;
        };
        UpdateFeatureFlagDto: {
            enabled: boolean;
            expectedVersion: number;
        };
        UpdateHomeSectionDto: {
            categories?: {
                /** Format: uuid */
                categoryId: string;
                position: number;
            }[];
            /** Format: uuid */
            categoryId?: string;
            expectedVersion: number;
            headingEn?: string;
            headingHi?: string;
            /** Format: uuid */
            initialCategoryId?: string;
            position?: number;
            supportingTextEn?: string | null;
            supportingTextHi?: string | null;
        };
        UpdateKeywordMappingDto: {
            canonicalTerm?: string;
            expectedVersion: number;
            synonyms?: string[];
            targets?: ({
                /** Format: uuid */
                categoryId: string;
                /** @enum {string} */
                kind: "category";
            } | {
                /** @enum {string} */
                kind: "subcategory";
                /** Format: uuid */
                subcategoryId: string;
            } | {
                /** @enum {string} */
                kind: "product_tag";
                productTag: string;
            })[];
        };
        UpdateLegalPageDto: {
            bodyEn: string;
            bodyHi: string;
            expectedVersion: number;
            titleEn: string;
            titleHi: string;
        };
        UpdatePreferencesDto: {
            /** @enum {string} */
            locale?: "en" | "hi";
            /** @enum {string} */
            theme?: "light" | "dark" | "auto";
        };
        UpdateProfileDto: {
            displayName?: string;
            /** Format: email */
            email?: string | null;
        };
        UpdateRoleDto: {
            description?: string | null;
            expectedVersion: number;
            name?: string;
            permissions?: {
                approvals?: ("view" | "create" | "edit" | "delete" | "export")[];
                catalog?: ("view" | "create" | "edit" | "delete" | "export")[];
                comms?: ("view" | "create" | "edit" | "delete" | "export")[];
                orders?: ("view" | "create" | "edit" | "delete" | "export")[];
                promos?: ("view" | "create" | "edit" | "delete" | "export")[];
                reports?: ("view" | "create" | "edit" | "delete" | "export")[];
                reviews?: ("view" | "create" | "edit" | "delete" | "export")[];
                users?: ("view" | "create" | "edit" | "delete" | "export")[];
            };
        };
        UpdateSettingDto: {
            expectedVersion: number;
            value: {
                nameEn: string;
                nameHi: string;
                taglineEn: string;
                taglineHi: string;
            } | {
                slabs: {
                    feePaise: number;
                    uptoKm: number;
                }[];
            } | {
                basePaise: number;
                perKmPaise: number;
            } | {
                defaultBps: number;
                platformFeePaise: number;
            } | {
                /** @enum {number} */
                billingPeriodMonths: 1;
                code: string;
                commissionBps: number;
                enabled: boolean;
                nameEn: string;
                nameHi: string;
                premium: boolean;
                pricePaise: number;
            }[] | {
                code: string;
                /** @enum {number} */
                durationDays: 7;
                enabled: boolean;
                /** @enum {string} */
                kind: "homepage_banner" | "featured_business";
                nameEn: string;
                nameHi: string;
                pricePaise: number;
            }[] | {
                gatewayId: string | null;
            } | {
                refundWindowHours: number;
            } | {
                blockedWords: string[];
                ruleEn: string;
                ruleHi: string;
            } | {
                purposes: {
                    business_profile_cover: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    business_profile_logo: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    catalog_taxonomy: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    gallery: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    offer_banner: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    product: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    review_photo: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    service: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                    video_thumbnail: {
                        allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                        enabled: boolean;
                        maxBytes: number;
                        maxHeight: number;
                        maxPixels: number;
                        maxWidth: number;
                        minHeight: number;
                        /** @enum {number} */
                        minQuality: 60;
                        minWidth: number;
                        /** @enum {number} */
                        quality: 80;
                        variants: {
                            maxBytes: number;
                            width: number;
                        }[];
                        version: number;
                    };
                };
            } | {
                /** Format: email */
                emailSender: string | null;
                smsProviderId: string | null;
                supportCallE164: string | null;
                supportWhatsappE164: string | null;
                whatsappNumber: string | null;
            } | {
                descriptionEn: string;
                descriptionHi: string;
                titleEn: string;
                titleHi: string;
            } | {
                classifications: {
                    cessRateBps: number;
                    code: string;
                    gstRateBps: number;
                    hsnOrSac: string;
                    /** @enum {string} */
                    supplyType: "taxable" | "exempt" | "nil_rated";
                    unitCode: string;
                }[];
                feeTaxCodes: {
                    commission: string;
                    platformDelivery: string;
                    platformFee: string;
                    promotion: string;
                    subscription: string;
                };
                platformSupplier: {
                    address: string;
                    authorizedSignatoryRef: string;
                    gstin?: string;
                    legalName: string;
                    /** @enum {string} */
                    registrationMode: "regular" | "composition" | "exempt" | "unregistered";
                    requiresIrn: boolean;
                    stateCode: string;
                    supplierRef: string;
                    version: number;
                };
                versionEvidence: {
                    evidenceRef: string;
                    /** @enum {boolean} */
                    verified: true;
                    /** Format: date-time */
                    verifiedAt: string;
                };
            };
        };
        UpdateSettingsGroupDto: {
            updates: {
                expectedVersion: number;
                /** @enum {string} */
                key: "branding" | "delivery" | "rider_earning" | "commission" | "plans" | "promotion_fees" | "payments" | "policies" | "reviews" | "uploads" | "integrations" | "seo" | "tax";
                value: {
                    nameEn: string;
                    nameHi: string;
                    taglineEn: string;
                    taglineHi: string;
                } | {
                    slabs: {
                        feePaise: number;
                        uptoKm: number;
                    }[];
                } | {
                    basePaise: number;
                    perKmPaise: number;
                } | {
                    defaultBps: number;
                    platformFeePaise: number;
                } | {
                    /** @enum {number} */
                    billingPeriodMonths: 1;
                    code: string;
                    commissionBps: number;
                    enabled: boolean;
                    nameEn: string;
                    nameHi: string;
                    premium: boolean;
                    pricePaise: number;
                }[] | {
                    code: string;
                    /** @enum {number} */
                    durationDays: 7;
                    enabled: boolean;
                    /** @enum {string} */
                    kind: "homepage_banner" | "featured_business";
                    nameEn: string;
                    nameHi: string;
                    pricePaise: number;
                }[] | {
                    gatewayId: string | null;
                } | {
                    refundWindowHours: number;
                } | {
                    blockedWords: string[];
                    ruleEn: string;
                    ruleHi: string;
                } | {
                    purposes: {
                        business_profile_cover: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        business_profile_logo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        catalog_taxonomy: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        gallery: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        offer_banner: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        product: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        review_photo: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        service: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                        video_thumbnail: {
                            allowedMimeTypes: ("image/jpeg" | "image/png" | "image/webp")[];
                            enabled: boolean;
                            maxBytes: number;
                            maxHeight: number;
                            maxPixels: number;
                            maxWidth: number;
                            minHeight: number;
                            /** @enum {number} */
                            minQuality: 60;
                            minWidth: number;
                            /** @enum {number} */
                            quality: 80;
                            variants: {
                                maxBytes: number;
                                width: number;
                            }[];
                            version: number;
                        };
                    };
                } | {
                    /** Format: email */
                    emailSender: string | null;
                    smsProviderId: string | null;
                    supportCallE164: string | null;
                    supportWhatsappE164: string | null;
                    whatsappNumber: string | null;
                } | {
                    descriptionEn: string;
                    descriptionHi: string;
                    titleEn: string;
                    titleHi: string;
                } | {
                    classifications: {
                        cessRateBps: number;
                        code: string;
                        gstRateBps: number;
                        hsnOrSac: string;
                        /** @enum {string} */
                        supplyType: "taxable" | "exempt" | "nil_rated";
                        unitCode: string;
                    }[];
                    feeTaxCodes: {
                        commission: string;
                        platformDelivery: string;
                        platformFee: string;
                        promotion: string;
                        subscription: string;
                    };
                    platformSupplier: {
                        address: string;
                        authorizedSignatoryRef: string;
                        gstin?: string;
                        legalName: string;
                        /** @enum {string} */
                        registrationMode: "regular" | "composition" | "exempt" | "unregistered";
                        requiresIrn: boolean;
                        stateCode: string;
                        supplierRef: string;
                        version: number;
                    };
                    versionEvidence: {
                        evidenceRef: string;
                        /** @enum {boolean} */
                        verified: true;
                        /** Format: date-time */
                        verifiedAt: string;
                    };
                };
            }[];
        };
        UpdateSubcategoryDto: {
            active?: boolean;
            expectedVersion: number;
            /** Format: uuid */
            imageAssetId?: string | null;
            nameEn?: string;
            nameHi?: string;
            serviceTypes?: string[];
            sortOrder?: number;
        };
        UpdateZoneDto: {
            expectedVersion: number;
            feeSlabs?: {
                feePaise: number;
                upperDistanceKm: number;
            }[];
            name?: string;
            polygon?: {
                coordinates: [
                    number,
                    number
                ][][];
                /** @enum {string} */
                type: "Polygon";
            };
            /** @enum {string} */
            status?: "active" | "paused";
        };
        VerifyInputDto: {
            code: string;
        };
        VideoCommentAdminPageDto: {
            counts: {
                pending: number;
                published: number;
                removed: number;
            };
            items: {
                allowedActions: ("publish" | "remove")[];
                authorLabel: string;
                /** Format: uuid */
                businessId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                reason: string | null;
                /** @enum {string} */
                status: "pending" | "published" | "removed";
                text: string;
                /** Format: date-time */
                updatedAt: string;
                version: number;
                /** Format: uuid */
                videoId: string;
            }[];
            nextCursor: string | null;
        };
        VideoCommentCreateDto: {
            text: string;
        };
        VideoCommentDecisionDto: {
            /** @enum {string} */
            action: "publish" | "remove";
            expectedVersion: number;
            reason?: string;
        };
        VideoCommentDecisionResultDto: {
            comment: {
                allowedActions: ("publish" | "remove")[];
                authorLabel: string;
                /** Format: uuid */
                businessId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                reason: string | null;
                /** @enum {string} */
                status: "pending" | "published" | "removed";
                text: string;
                /** Format: date-time */
                updatedAt: string;
                version: number;
                /** Format: uuid */
                videoId: string;
            };
            publishedCommentCount: number;
        };
        VideoCommentDto: {
            authorLabel: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            reason: string | null;
            /** @enum {string} */
            status: "pending" | "published" | "removed";
            text: string;
            /** Format: date-time */
            updatedAt: string;
            version: number;
            /** Format: uuid */
            videoId: string;
        };
        VideoCommentPublicPageDto: {
            items: {
                authorLabel: string;
                canDelete: boolean;
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                reason: string | null;
                /** @enum {string} */
                status: "pending" | "published" | "removed";
                text: string;
                /** Format: date-time */
                updatedAt: string;
                version: number;
                /** Format: uuid */
                videoId: string;
            }[];
            nextCursor: string | null;
        };
        VideoDto: {
            caption: string;
            /** Format: date-time */
            createdAt: string;
            hashtags: string[];
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            kind: "watch" | "shorts" | "share" | "reel" | "p";
            playback: {
                embedUrl: string;
                openUrl: string;
                /** @enum {string} */
                provider: "youtube";
                /** @enum {string} */
                render: "iframe";
            } | {
                openUrl: string;
                permalink: string;
                /** @enum {string} */
                provider: "instagram";
                /** @enum {string} */
                render: "instagram";
            } | {
                /** Format: uri */
                openUrl: string;
                /** @enum {string} */
                provider: "youtube" | "instagram";
                /** @enum {string} */
                reason: "disabled" | "unavailable";
                /** @enum {string} */
                render: "fallback";
            };
            /** @enum {string} */
            provider: "youtube" | "instagram";
            providerId: string;
            showInGallery: boolean;
            showInReels: boolean;
            /** @enum {string} */
            status: "pending" | "approved" | "rejected" | "removed";
            version: number;
        };
        VideoHeartResultDto: {
            hearted: boolean;
        };
        VideoLikeResultDto: {
            likeCount: number;
            liked: boolean;
        };
        VideoModerationDecisionDto: {
            /** @enum {string} */
            action: "approve" | "reject" | "remove";
            expectedVersion: number;
            reason?: string;
        };
        VideoModerationItemDto: {
            businessNameEn: string | null;
            businessNameHi: string | null;
            caption: string;
            /** Format: date-time */
            createdAt: string;
            decisionReason: string | null;
            hashtags: string[];
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            kind: "watch" | "shorts" | "share" | "reel" | "p";
            playback: {
                embedUrl: string;
                openUrl: string;
                /** @enum {string} */
                provider: "youtube";
                /** @enum {string} */
                render: "iframe";
            } | {
                openUrl: string;
                permalink: string;
                /** @enum {string} */
                provider: "instagram";
                /** @enum {string} */
                render: "instagram";
            } | {
                /** Format: uri */
                openUrl: string;
                /** @enum {string} */
                provider: "youtube" | "instagram";
                /** @enum {string} */
                reason: "disabled" | "unavailable";
                /** @enum {string} */
                render: "fallback";
            };
            /** @enum {string} */
            provider: "youtube" | "instagram";
            providerId: string;
            showInGallery: boolean;
            showInReels: boolean;
            /** @enum {string} */
            status: "pending" | "approved" | "rejected" | "removed";
            version: number;
        };
        VideoModerationPageDto: {
            counts: {
                approved: number;
                pending: number;
                rejected: number;
                removed: number;
                reported: number;
            };
            items: ({
                businessNameEn: string | null;
                businessNameHi: string | null;
                caption: string;
                /** Format: date-time */
                createdAt: string;
                decisionReason: string | null;
                hashtags: string[];
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                kind: "watch" | "shorts" | "share" | "reel" | "p";
                playback: {
                    embedUrl: string;
                    openUrl: string;
                    /** @enum {string} */
                    provider: "youtube";
                    /** @enum {string} */
                    render: "iframe";
                } | {
                    openUrl: string;
                    permalink: string;
                    /** @enum {string} */
                    provider: "instagram";
                    /** @enum {string} */
                    render: "instagram";
                } | {
                    /** Format: uri */
                    openUrl: string;
                    /** @enum {string} */
                    provider: "youtube" | "instagram";
                    /** @enum {string} */
                    reason: "disabled" | "unavailable";
                    /** @enum {string} */
                    render: "fallback";
                };
                /** @enum {string} */
                provider: "youtube" | "instagram";
                providerId: string;
                /** @enum {string} */
                queueItemType: "video";
                showInGallery: boolean;
                showInReels: boolean;
                /** @enum {string} */
                status: "pending" | "approved" | "rejected" | "removed";
                version: number;
            } | {
                allowedActions: ("dismiss" | "remove")[];
                /** Format: date-time */
                createdAt: string;
                details: string | null;
                /** @enum {string} */
                queueItemType: "report";
                /** @enum {string} */
                reason: "inappropriate" | "misleading" | "spam" | "copyright" | "other";
                /** Format: uuid */
                reportId: string;
                reportVersion: number;
                /** @enum {string} */
                status: "open";
                /** @enum {string} */
                targetKind: "video";
                targetVersion: number;
                video: {
                    businessNameEn: string | null;
                    businessNameHi: string | null;
                    caption: string;
                    /** Format: date-time */
                    createdAt: string;
                    decisionReason: string | null;
                    hashtags: string[];
                    /** Format: uuid */
                    id: string;
                    /** @enum {string} */
                    kind: "watch" | "shorts" | "share" | "reel" | "p";
                    playback: {
                        embedUrl: string;
                        openUrl: string;
                        /** @enum {string} */
                        provider: "youtube";
                        /** @enum {string} */
                        render: "iframe";
                    } | {
                        openUrl: string;
                        permalink: string;
                        /** @enum {string} */
                        provider: "instagram";
                        /** @enum {string} */
                        render: "instagram";
                    } | {
                        /** Format: uri */
                        openUrl: string;
                        /** @enum {string} */
                        provider: "youtube" | "instagram";
                        /** @enum {string} */
                        reason: "disabled" | "unavailable";
                        /** @enum {string} */
                        render: "fallback";
                    };
                    /** @enum {string} */
                    provider: "youtube" | "instagram";
                    providerId: string;
                    showInGallery: boolean;
                    showInReels: boolean;
                    /** @enum {string} */
                    status: "pending" | "approved" | "rejected" | "removed";
                    version: number;
                };
                /** Format: uuid */
                videoId: string;
            })[];
            nextCursor: string | null;
        };
        VideoPageDto: {
            items: {
                caption: string;
                /** Format: date-time */
                createdAt: string;
                hashtags: string[];
                /** Format: uuid */
                id: string;
                /** @enum {string} */
                kind: "watch" | "shorts" | "share" | "reel" | "p";
                playback: {
                    embedUrl: string;
                    openUrl: string;
                    /** @enum {string} */
                    provider: "youtube";
                    /** @enum {string} */
                    render: "iframe";
                } | {
                    openUrl: string;
                    permalink: string;
                    /** @enum {string} */
                    provider: "instagram";
                    /** @enum {string} */
                    render: "instagram";
                } | {
                    /** Format: uri */
                    openUrl: string;
                    /** @enum {string} */
                    provider: "youtube" | "instagram";
                    /** @enum {string} */
                    reason: "disabled" | "unavailable";
                    /** @enum {string} */
                    render: "fallback";
                };
                /** @enum {string} */
                provider: "youtube" | "instagram";
                providerId: string;
                showInGallery: boolean;
                showInReels: boolean;
                /** @enum {string} */
                status: "pending" | "approved" | "rejected" | "removed";
                version: number;
            }[];
            nextCursor: string | null;
        };
        VideoReportAcceptedDto: {
            /** Format: uuid */
            reportId: string;
        };
        VideoShareCreateDto: {
            /** @enum {string} */
            channel: "whatsapp" | "copy" | "native";
            /** Format: uuid */
            targetId: string;
            /** @enum {string} */
            targetType: "video";
        };
        WaitlistAcceptedDto: {
            /** Format: uuid */
            requestId: string;
        };
        WaitlistRequestDto: {
            /** Format: uuid */
            cityId?: string;
            phone: string;
        };
        ZoneDeletedDto: {
            /** Format: uuid */
            cityId: string;
            /** @enum {boolean} */
            deleted: true;
            /** Format: uuid */
            id: string;
        };
        ZoneDto: {
            /** Format: uuid */
            cityId: string;
            /** Format: date-time */
            createdAt: string;
            feeSlabs: {
                feePaise: number;
                upperDistanceKm: number;
            }[];
            /** Format: uuid */
            id: string;
            name: string;
            polygon: {
                coordinates: [
                    number,
                    number
                ][][];
                /** @enum {string} */
                type: "Polygon";
            };
            /** @enum {string} */
            status: "active" | "paused";
            /** Format: date-time */
            updatedAt: string;
            version: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AdminAuditController_list: {
        parameters: {
            query?: {
                action?: string;
                actorId?: string;
                areaId?: string;
                cityId?: string;
                cursor?: string;
                entityType?: string;
                from?: string;
                limit?: number;
                q?: string;
                to?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditPageDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown/invalid filter, from after to, limit above 50, or a cursor issued for other filters, actor or grants. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without reports:view (even for the caller’s own actions); ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AdminAuditController_detail: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditEntryDetailDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without reports:view; ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description AUDIT_NOT_FOUND for a missing entry or one outside the caller’s scope (indistinguishable). */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementAdminVideoCommentsList: {
        parameters: {
            query: {
                cursor?: string;
                limit?: number;
                status: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoCommentAdminPageDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_SCOPE_FORBIDDEN when reviews:view is not granted. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementAdminVideoCommentDecision: {
        parameters: {
            query?: never;
            header: {
                /** @description Retry the identical moderation decision within 24 hours. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VideoCommentDecisionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoCommentDecisionResultDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_SCOPE_FORBIDDEN when the video business is outside assigned scope. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ENGAGEMENT_TARGET_NOT_FOUND when the comment no longer exists. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMENT_INVALID_TRANSITION or COMMENT_VERSION_CONFLICT. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AdminMeController_me: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminMeDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without an admin/super_admin role; ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaAdminReportDecision: {
        parameters: {
            query?: never;
            header: {
                /** @description Retry the same report decision with the same key for 24 hours. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MediaReportDecisionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaReportDecisionResultDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid fields or key. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_SCOPE_FORBIDDEN when the target business is outside assigned scope. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_NOT_FOUND when the report or target does not exist. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_VERSION_CONFLICT or VIDEO_INVALID_TRANSITION. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    adminSupportMessage: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportMessageDetailDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without users:view; ADMIN_SCOPE_FORBIDDEN outside the message scope; ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUPPORT_MESSAGE_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on (admins are not admitted). */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaAdminVideoList: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                tab?: ("pending" | "approved" | "rejected" | "removed") | "reported";
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoModerationPageDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_SCOPE_FORBIDDEN when the admin lacks reviews:view or assigned scope. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaAdminVideoDecision: {
        parameters: {
            query?: never;
            header: {
                /** @description Retry the same video decision with the same key for 24 hours. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VideoModerationDecisionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoModerationItemDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid fields or key. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_SCOPE_FORBIDDEN when the target business is outside assigned scope. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_NOT_FOUND when the video does not exist. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_VERSION_CONFLICT or VIDEO_INVALID_TRANSITION. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AuthController_csrf: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CsrfDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LogoutDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AuthController_challenge: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChallengeInputDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChallengeDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AuthController_verify: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                challengeId: unknown;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyInputDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AuthController_session: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaOwnerVideoList: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                /** @description Selects which of the authenticated owner’s businesses is used; grants no access. */
                "X-Business-Kind"?: "shop" | "provider";
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoPageDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description The caller does not own an approved vendor/provider business. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description BUSINESS_CONTEXT_REQUIRED when the owner has both business kinds but omitted X-Business-Kind. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaOwnerVideoCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Retry the identical submission with the same key for up to 24 hours. */
                "Idempotency-Key": string;
                Origin: string;
                /** @description Selects which of the authenticated owner’s businesses is used; grants no access. */
                "X-Business-Kind"?: "shop" | "provider";
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateVideoDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid fields or COMMON_VALIDATION_FAILED for an invalid Idempotency-Key. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description The caller does not own an approved vendor/provider business. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_CONFLICT when the idempotency key is reused with a different payload. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_VIDEO_SOURCE_INVALID for a source outside the exact YouTube/Instagram allow-list. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    adminCatalogCategories: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCategoryTreeDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without catalog:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogCategoryCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCategoryDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCategoryDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid fields or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATEGORY_CONFLICT when the slug already exists; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_IMAGE_INVALID. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogCategoryUpdate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                categoryId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCategoryDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCategoryDto"];
                };
            };
            /** @description VALIDATION_ERROR for no changes, invalid fields or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATEGORY_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_IMAGE_INVALID. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogSubcategoryCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                categoryId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSubcategoryDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSubcategoryDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid names/serviceTypes, a name that yields an empty slug or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATEGORY_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUBCATEGORY_DUPLICATE for a normalized EN/HI name or slug clash in the category; CATALOG_VERSION_CONFLICT for a stale parent version; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_IMAGE_INVALID. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogHomeSections: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminHomeSectionListDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogHomeSectionCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateHomeSectionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminHomeSectionDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown kind, invalid fields or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_CONFLICT when a live dedicated section already exists for the category; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_INVALID for a missing/other-kind category, an initial category outside the pills, duplicate pills or the section limit. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogHomeSectionRemove: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                sectionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExpectedVersionBodyDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HomeSectionRemovedDto"];
                };
            };
            /** @description VALIDATION_ERROR for a missing expectedVersion or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogHomeSectionUpdate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                sectionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateHomeSectionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminHomeSectionDto"];
                };
            };
            /** @description VALIDATION_ERROR for no changes, invalid fields or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_NOT_FOUND (also for a removed section). */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_VERSION_CONFLICT for a stale expectedVersion; CATALOG_HOME_SECTION_CONFLICT for a duplicate dedicated category; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_INVALID. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogHomeSectionStatus: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                sectionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HomeSectionStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminHomeSectionDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown event or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_STATE_INVALID when already in the target state or not publishable; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_HOME_SECTION_INVALID when stored content no longer validates. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    adminCatalogKeywordMappings: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeywordMappingPageDto"];
                };
            };
            /** @description VALIDATION_ERROR for an invalid limit or cursor. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without catalog:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogKeywordMappingCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateKeywordMappingDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeywordMappingDto"];
                };
            };
            /** @description VALIDATION_ERROR for empty/duplicate normalized terms or targets, oversized lists or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description KEYWORD_MAPPING_CONFLICT when a normalized term already belongs to another mapping; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description KEYWORD_TARGET_INVALID for a missing or inactive category/subcategory target. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogKeywordMappingDelete: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                mappingId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExpectedVersionBodyDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeywordMappingDeletedDto"];
                };
            };
            /** @description VALIDATION_ERROR for a missing expectedVersion or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description KEYWORD_MAPPING_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogKeywordMappingUpdate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                mappingId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateKeywordMappingDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeywordMappingDto"];
                };
            };
            /** @description VALIDATION_ERROR for no changes, empty/duplicate normalized terms or targets, or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description KEYWORD_MAPPING_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description KEYWORD_MAPPING_CONFLICT; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description KEYWORD_TARGET_INVALID. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminCatalogSubcategoryUpdate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                subcategoryId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSubcategoryDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSubcategoryDto"];
                };
            };
            /** @description VALIDATION_ERROR for no changes, invalid fields or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUBCATEGORY_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUBCATEGORY_DUPLICATE for a renamed clash; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATALOG_IMAGE_INVALID. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    adminCatalogSuggestions: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                status?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSuggestionPageDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown status, invalid limit or a cursor bound to another caller/filter. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without catalog:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    adminCatalogSuggestionDecision: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical decision within 24 hours to replay the stored result; replay rechecks current admin access. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DecideSuggestionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuggestionDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown action, a missing reason/target or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN without catalog:edit; ADMIN_SCOPE_FORBIDDEN (route guard) or SUGGESTION_SCOPE_DENIED (transaction recheck) when the suggestion area is outside the assigned scope; ADMIN_INACTIVE for a deactivated admin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUGGESTION_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUGGESTION_STATE_INVALID when no longer pending; SUGGESTION_DUPLICATE when approval would duplicate an existing subcategory; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUGGESTION_MERGE_TARGET_INVALID for a missing, inactive or other-category merge target. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    catalogCategories: {
        parameters: {
            query?: {
                kind?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryListDto"];
                };
            };
            /** @description VALIDATION_ERROR */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED: read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    catalogCategory: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryDetailDto"];
                };
            };
            /** @description VALIDATION_ERROR */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description CATEGORY_NOT_FOUND */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED: read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    catalogSubcategory: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                slug: string;
                subcategorySlug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubcategoryDetailDto"];
                };
            };
            /** @description VALIDATION_ERROR */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description SUBCATEGORY_NOT_FOUND */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED: read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    catalogMySuggestions: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                /** @description Owner route context (shop|provider) selecting which of the caller's own businesses is meant; required only when the caller owns both. Grants nothing. */
                "X-Business-Kind"?: "shop" | "provider";
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuggestionPageDto"];
                };
            };
            /** @description VALIDATION_ERROR for an invalid limit or cursor. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN when no owned, capable business with a resolved area exists for the caller (or for the named X-Business-Kind). */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and X-Business-Kind is omitted. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    catalogSuggestionCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive key; retry the identical suggestion within 24 hours to replay the stored result (replay rechecks the owner capability). */
                "Idempotency-Key": string;
                Origin: string;
                /** @description Owner route context (shop|provider) selecting which of the caller's own businesses is meant; required only when the caller owns both. Grants nothing. */
                "X-Business-Kind"?: "shop" | "provider";
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SuggestSubcategoryDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuggestionDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid names/reason or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN when no owned, capable business with a resolved area exists for the caller (or for the named X-Business-Kind). */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATEGORY_NOT_FOUND for a missing or inactive category. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SUGGESTION_DUPLICATE for an exact existing subcategory or pending suggestion; SUGGESTION_SIMILARITY_WARNING for fuzzy candidates without allowSimilar; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and X-Business-Kind is omitted. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    catalogSuggestionDuplicateCheck: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                /** @description Owner route context (shop|provider) selecting which of the caller's own businesses is meant; required only when the caller owns both. Grants nothing. */
                "X-Business-Kind"?: "shop" | "provider";
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SuggestionDuplicateCheckDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuggestionDuplicateResultDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid names or unexpected keys. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN when no owned, capable business with a resolved area exists for the caller (or for the named X-Business-Kind). */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CATEGORY_NOT_FOUND for a missing or inactive category. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and X-Business-Kind is omitted. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AnonymousConsentsController_list: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description VALIDATION_ERROR for unexpected query parameters. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Untrusted Origin. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Read limit exceeded. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Unexpected failure. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_UNAVAILABLE (errors.common.unavailable): anonymous consent identity and cookie categories are pending policy approval (Q-31). Nothing is read or recorded. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AnonymousConsentsController_update: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                purpose: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateConsentDto"];
            };
        };
        responses: {
            /** @description VALIDATION_ERROR for an invalid body or query. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CSRF_INVALID for a missing anonymous session, Origin or CSRF token; COMMON_FORBIDDEN for signed-in sessions. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CONSENT_PURPOSE_INVALID for a malformed purpose or channel. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Write limit exceeded. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Unexpected failure. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_UNAVAILABLE (errors.common.unavailable): anonymous consent identity and cookie categories are pending policy approval (Q-31). Nothing is read or recorded. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementVideoHeart: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                targetId: string;
                targetType: "video";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoHeartResultDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementVideoUnheart: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                targetId: string;
                targetType: "video";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoHeartResultDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementVideoLike: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                videoId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoLikeResultDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementVideoUnlike: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                videoId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoLikeResultDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementState: {
        parameters: {
            query?: {
                targets?: string;
                videoIds?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EngagementStateDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementVideoShare: {
        parameters: {
            query?: never;
            header: {
                /** @description Retry the same share action within 24 hours. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VideoShareCreateDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoCities: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCityPageDto"];
                };
            };
            /** @description VALIDATION_ERROR for an invalid limit or cursor. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoCityCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCityDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCityDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid names, stateCode or status, or a nameEn that yields an empty slug. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CITY_SLUG_CONFLICT when the derived slug already exists; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoCity: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCityDetailDto"];
                };
            };
            /** @description VALIDATION_ERROR for an invalid cityId. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CITY_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoCityStateUpdate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCityStateCodeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCityDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown stateCode or unexpected fields. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CITY_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description GEO_VERSION_CONFLICT when expectedVersion is stale; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoCityStatus: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetCityStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCityDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown action or unexpected fields. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CITY_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description GEO_VERSION_CONFLICT when expectedVersion is stale; CITY_TRANSITION_INVALID for any other transition; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoZoneCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateZoneDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ZoneDto"];
                };
            };
            /** @description VALIDATION_ERROR for an invalid name/status or unexpected fields. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CITY_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ZONE_INVALID for an invalid or overlapping polygon; FEE_SLAB_INVALID for missing, excess, negative, fractional-paise or non-increasing slabs. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoZoneDelete: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                zoneId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteZoneDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ZoneDeletedDto"];
                };
            };
            /** @description VALIDATION_ERROR for a missing expectedVersion or unexpected fields. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ZONE_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description GEO_VERSION_CONFLICT when expectedVersion is stale; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminGeoZoneUpdate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                zoneId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateZoneDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ZoneDto"];
                };
            };
            /** @description VALIDATION_ERROR for no changes, an invalid name/status or unexpected fields. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ZONE_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description GEO_VERSION_CONFLICT when expectedVersion is stale; idempotency conflicts. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ZONE_INVALID for an invalid or overlapping polygon; FEE_SLAB_INVALID for invalid slabs. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    geoCities: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeoCityPageDto"];
                };
            };
            /** @description Invalid query or cursor */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Read service unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    geoCityAreas: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                pinCode?: string;
                query?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeoAreaPageDto"];
                };
            };
            /** @description Invalid query or cursor */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description City not found */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Invalid PIN code */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Read service unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    geoLocationResolve: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LocationResolveDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationResolutionDto"];
                };
            };
            /** @description Invalid query or cursor */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description CSRF_INVALID for a missing session, Origin or CSRF token. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CITY_NOT_FOUND for an unknown cityId; AREA_NOT_FOUND for an unknown area or one outside cityId. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description LOCATION_INVALID for missing/multiple selectors or out-of-range coordinates; PIN_CODE_INVALID for a non six-digit PIN; LOCATION_UNRESOLVED when no single city matches. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Read service unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    geoWaitlistJoin: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive key; retry the identical request within 24 hours to replay the accepted result. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WaitlistRequestDto"];
            };
        };
        responses: {
            202: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WaitlistAcceptedDto"];
                };
            };
            /** @description Invalid query or cursor */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description CSRF_INVALID for a missing session, Origin or CSRF token. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CITY_NOT_FOUND for an unknown cityId. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Idempotency-Key reused with a different request, or the original request is still in progress. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Read service unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    healthStatus: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformHealthDto"];
                };
            };
            /** @description VALIDATION_ERROR */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED: read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_UNAVAILABLE: settings store unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    healthLive: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthDto"];
                };
            };
            /** @description Invalid probe input */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Probe request limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    healthReady: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthDto"];
                };
            };
            /** @description Invalid probe input */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Probe request limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Prerequisites unavailable or shutting down */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    legalPage: {
        parameters: {
            query?: {
                locale?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                slug: "terms" | "privacy" | "refund" | "about";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LegalPageDto"];
                };
            };
            /** @description VALIDATION_ERROR */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description LEGAL_PAGE_NOT_FOUND until the page is published (approved copy pending). */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED: read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_UNAVAILABLE: settings store unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    mediaTaxonomyImagePolicy: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaPolicyDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaImagePreview: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                assetId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "image/webp": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaPublicImage: {
        parameters: {
            query: {
                assetVersion: number;
                placementId: string;
                placementType: string;
                surface: string;
                variantWidth: number;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                assetId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description MAINTENANCE (errors.system.maintenance) while maintenance mode is on and this route is not admitted */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    ImageController_head: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description MAINTENANCE (errors.system.maintenance) while maintenance mode is on and this route is not admitted */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    mediaUpload: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                    /** @enum {string} */
                    purpose: "catalog_taxonomy";
                };
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaUploadDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_TOO_LARGE */
            413: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_TYPE_NOT_ALLOWED or MEDIA_IMAGE_PROCESSING_FAILED */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    settingsPublic: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicSettingsDto"];
                };
            };
            /** @description VALIDATION_ERROR */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Untrusted Origin */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED: read limit exceeded */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description Unexpected failure */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
            /** @description COMMON_UNAVAILABLE: settings store unavailable */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    SuperAdminActivityController_list: {
        parameters: {
            query?: {
                action?: string;
                actorId?: string;
                actorRole?: string;
                areaId?: string;
                cityId?: string;
                cursor?: string;
                entityType?: string;
                from?: string;
                limit?: number;
                q?: string;
                to?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditPageDto"];
                };
            };
            /** @description VALIDATION_ERROR for an unknown/invalid filter, from after to, limit above 50, or a cursor issued for other filters or actor. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN for any non-super_admin, including admins. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminActivityController_detail: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditEntryDetailDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN for any non-super_admin, including admins. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description AUDIT_NOT_FOUND for a missing entry. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminActivityController_export: {
        parameters: {
            query?: {
                action?: string;
                actorId?: string;
                actorRole?: string;
                areaId?: string;
                cityId?: string;
                entityType?: string;
                from?: string;
                q?: string;
                to?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description UTF-8 CSV attachment streamed in occurredAt DESC order. */
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description attachment; filename="apnatown-activity-<YYYY-MM-DD>.csv" */
                    "Content-Disposition"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": string;
                };
            };
            /** @description VALIDATION_ERROR for an unknown/invalid filter or from after to. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_FORBIDDEN for any non-super_admin, including admins. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description REPORT_TOO_LARGE when more than 100000 rows match; narrow the filters. */
            413: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminAdminsController_list: {
        parameters: {
            query?: {
                areaId?: string;
                cityId?: string;
                cursor?: string;
                limit?: number;
                q?: string;
                roleId?: string;
                status?: string;
                zoneId?: string;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminPageDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description AREA_NOT_FOUND for an unknown areaId; ZONE_NOT_FOUND for an unknown zoneId. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminAdminsController_create: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAdminDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCardDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_NOT_FOUND, AREA_NOT_FOUND, or USER_NOT_FOUND when the phone has no usable verified account. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_EXISTS when the user already has an admin account or is super_admin. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminAdminsController_setAreas: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetAdminAreasDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCardDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_NOT_FOUND for an unknown admin; AREA_NOT_FOUND for an unknown area. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_VERSION_CONFLICT when expectedVersion is stale. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminAdminsController_impact: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminImpactDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminAdminsController_setPermissions: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetAdminPermissionsDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCardDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_VERSION_CONFLICT when expectedVersion is stale. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminAdminsController_setRole: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetAdminRoleDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCardDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_NOT_FOUND for an unknown admin; ROLE_NOT_FOUND for an unknown role. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_VERSION_CONFLICT when expectedVersion is stale. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminAdminsController_setStatus: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetAdminStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCardDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_VERSION_CONFLICT when expectedVersion is stale. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ADMIN_SELF_ACTION when targeting the caller. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminUpdateFeatureFlag: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                key: "reviews" | "guest_browse" | "whatsapp" | "booking" | "donations" | "payments_online" | "payments_cod" | "maintenance";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateFeatureFlagDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FeatureFlagDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_VERSION_CONFLICT when expectedVersion is stale; FEATURE_NOT_AVAILABLE when enabling a future or unconfigured feature. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_INVALID for an unknown flag row. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminUpdateLegalPage: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                slug: "terms" | "privacy" | "refund" | "about";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateLegalPageDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LegalPageAdminDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_VERSION_CONFLICT when expectedVersion is stale. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_INVALID when a field is empty after sanitising. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminRolesController_list: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RolePageDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminRolesController_create: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRoleDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_NAME_TAKEN when the name is in use. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminRolesController_delete: {
        parameters: {
            query?: {
                reassignTo?: string;
            };
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleDeletedDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_NOT_FOUND for the role or reassignTo. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_SYSTEM_LOCKED, or ROLE_IN_USE when reassignTo is missing or equal to the role. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminRolesController_update: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRoleDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleUpdateResultDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_SYSTEM_LOCKED, ROLE_VERSION_CONFLICT or ROLE_NAME_TAKEN. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    SuperAdminRolesController_duplicate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyBodyDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_NOT_FOUND. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ROLE_NAME_TAKEN when the copy name is in use; rename the existing copy first. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminSettings: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuperAdminSettingsDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminUpdateSetting: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                key: "branding" | "delivery" | "rider_earning" | "commission" | "plans" | "promotion_fees" | "payments" | "policies" | "reviews" | "uploads" | "integrations" | "seo" | "tax";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSettingDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedSettingDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_VERSION_CONFLICT when expectedVersion is stale. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_INVALID for an invalid value (details.fields); SETTINGS_GROUP_REQUIRED for a grouped member key. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    superAdminUpdateSettingsGroup: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                group: "delivery_rider_pay" | "commission_plans" | "policies_reviews";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSettingsGroupDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedSettingsGroupDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_VERSION_CONFLICT when any expectedVersion is stale (nothing saved). */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description SETTINGS_INVALID for missing, duplicate or extra keys or any invalid value (details.fields lists offending paths). */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    supportMessageCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive key; retry the identical message within 24 hours to replay the accepted result. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSupportMessageDto"];
            };
        };
        responses: {
            202: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportMessageAcceptedDto"];
                };
            };
            /** @description VALIDATION_ERROR for an empty, oversized or control-character message or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CSRF_INVALID for a missing session, Origin or CSRF token. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Idempotency-Key reused with a different message, or the original request is still in progress. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Unexpected failure. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) with Retry-After while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    DataRequestCompletionController_completion: {
        parameters: {
            query?: never;
            header: {
                /** @description Bearer <completionToken> issued when the deletion was confirmed. Never send it in the URL. */
                Authorization: string;
                "X-Correlation-ID"?: string;
            };
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataRequestCompletionDto"];
                };
            };
            /** @description VALIDATION_ERROR for an invalid requestId or query. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description DATA_REQUEST_NOT_FOUND for any invalid capability. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Request limit exceeded. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Unexpected failure. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) while maintenance mode is on and this route is not admitted */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    UsersController_profile: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    UsersController_updateProfile: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AddressesController_list: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressPageDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AddressesController_create: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current access. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAddressDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AddressesController_delete: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current access. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                addressId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteAddressDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressDeletedDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    AddressesController_update: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current access. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                addressId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAddressDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    ConsentsController_list: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsentListDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    ConsentsController_update: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                purpose: "marketing" | "order_updates" | "enquiry_updates";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateConsentDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsentRecordDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CONSENT_PURPOSE_INVALID for an unregistered purpose/channel pair; CONSENT_NOTICE_INVALID when a grant does not acknowledge the configured current notice. */
            422: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    DataRequestsController_create: {
        parameters: {
            query?: never;
            header: {
                /** @description Case-sensitive request key. Retrying the identical command within 24 hours returns the same request (rechecking current access) and may rotate the deletion completion capability; it never creates another job. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDataRequestDto"];
            };
        };
        responses: {
            202: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataRequestAcceptedDto"];
                };
            };
            /** @description VALIDATION_ERROR for an invalid body/key, or deletion without confirmed: true. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description ACCOUNT_UNAVAILABLE for a suspended/deleting account, or CSRF/Origin failure. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description DATA_REQUEST_CONFLICT when the key was used for another type or an export is requested during a running deletion; COMMON_CONFLICT while the same key is in flight. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Request limit exceeded. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    DataRequestsController_read: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataRequestDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description DATA_REQUEST_NOT_FOUND for a missing or another user's request. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    DataRequestsController_download: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description attachment; filename="apnatown-data-<requestId>.json" */
                    "Content-Disposition"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataExportDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description DATA_REQUEST_NOT_FOUND for a missing, non-export or another user's request. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description DATA_REQUEST_NOT_READY until the export has completed. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description DATA_EXPORT_EXPIRED after the artifact expiry. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_UNAVAILABLE when private storage is unavailable. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    UsersController_preferences: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PreferencesDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    UsersController_updatePreferences: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePreferencesDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PreferencesDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    mediaPublicVideoGet: {
        parameters: {
            query?: never;
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoDto"];
                };
            };
            /** @description COMMON_VALIDATION_FAILED for an invalid id. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_VIDEO_NOT_PUBLISHED when the video is pending, removed, or not Reels-consented. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) while maintenance mode is on and this route is not admitted */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    mediaVideoReport: {
        parameters: {
            query?: never;
            header: {
                /** @description Retry the same report with the same key for 24 hours. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateVideoReportDto"];
            };
        };
        responses: {
            202: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoReportAcceptedDto"];
                };
            };
            /** @description VALIDATION_ERROR for invalid fields or idempotency key. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description CSRF_INVALID for a missing or untrusted browser session. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_CONFLICT when the key is reused with a different payload; MEDIA_VIDEO_NOT_PUBLISHED when the video is no longer public. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MAINTENANCE (errors.system.maintenance) while maintenance mode is on and this route is not admitted */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorDto"];
                };
            };
        };
    };
    engagementVideoCommentsList: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: {
                "X-Correlation-ID"?: string;
            };
            path: {
                videoId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoCommentPublicPageDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementVideoCommentCreate: {
        parameters: {
            query?: never;
            header: {
                /** @description Retry the identical comment command within 24 hours. */
                "Idempotency-Key": string;
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                videoId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VideoCommentCreateDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VideoCommentDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Only the authenticated customer may create a comment. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description MEDIA_VIDEO_NOT_PUBLISHED when the video is not currently public. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description COMMON_RATE_LIMITED with Retry-After (5 comments/minute/user). */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
    engagementVideoCommentDelete: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-Correlation-ID"?: string;
                "X-CSRF-Token": string;
            };
            path: {
                id: string;
                videoId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            400: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            401: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            403: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            404: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            409: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            410: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            429: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds until this rate-limit window resets */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            500: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
            /** @description Flat error envelope; no submitted values or credentials. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
                    /** @description Seconds before retrying; sent with MAINTENANCE */
                    "Retry-After"?: string;
                    /** @description Validated or generated request ID */
                    "X-Correlation-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthErrorDto"];
                };
            };
        };
    };
}
