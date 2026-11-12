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
        CreateSupportMessageDto: {
            message: string;
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
        DeleteAddressDto: {
            expectedVersion: number;
        };
        DeleteZoneDto: {
            expectedVersion: number;
        };
        EmptyBodyDto: Record<string, never>;
        EmptyDto: Record<string, never>;
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
}
