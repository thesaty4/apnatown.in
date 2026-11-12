export interface paths {
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
        CreateDataRequestDto: {
            /** @enum {boolean} */
            confirmed?: true;
            /** @enum {string} */
            type: "export" | "delete";
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
                    /** @description Auth and own-account responses are private, no-store. */
                    "Cache-Control"?: string;
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
                    /** @description Auth and own-account responses are private, no-store. */
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
