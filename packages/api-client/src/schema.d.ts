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
        CsrfDto: {
            csrfToken: string;
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
