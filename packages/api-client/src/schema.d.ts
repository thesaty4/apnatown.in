export interface paths {
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
    "/super-admin/admins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List admin accounts
         * @description super_admin only. q matches display name or an exact verified phone (email is encrypted and not searchable). areaId matches an exact area grant or a whole-city grant of its city; zoneId is mutually exclusive with areaId and is COMMON_UNAVAILABLE until Geo exposes a zone→area mapping. Cards include full contact fields for the management purpose; zones are reported in `unavailable`. Ordered newest first; total counts the filtered set. private, no-store.
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
        LogoutDto: {
            /** @enum {boolean} */
            loggedOut: true;
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
        UpdateConsentDto: {
            /** @enum {string} */
            channel?: "in_app" | "email" | "whatsapp";
            granted: boolean;
            noticeVersion?: string;
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
        VerifyInputDto: {
            code: string;
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
            /** @description AREA_NOT_FOUND for an unknown areaId. */
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
            /** @description COMMON_UNAVAILABLE for zoneId until Geo exposes a zone→area mapping. */
            503: {
                headers: {
                    /** @description Auth, own-account and admin responses are private, no-store. */
                    "Cache-Control"?: string;
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
            /** @description ACCOUNT_UNAVAILABLE when the phone belongs to an unavailable account. */
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
            /** @description ROLE_NOT_FOUND or AREA_NOT_FOUND. */
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
