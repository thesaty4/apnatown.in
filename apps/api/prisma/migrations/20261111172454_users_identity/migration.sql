-- Additive Users identity and role membership storage; no users or roles are seeded.
-- Recovery: repair forward after preserving identities and memberships. Dropping
-- these tables would destroy data; there is no automatic production down migration.
BEGIN;

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone_ciphertext" TEXT,
    "phone_lookup_hash" BYTEA,
    "email_ciphertext" TEXT,
    "display_name" TEXT,
    "preferred_locale" TEXT NOT NULL DEFAULT 'en',
    "theme_preference" TEXT NOT NULL DEFAULT 'light',
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_preferred_locale_check"
        CHECK ("preferred_locale" IN ('en', 'hi')),
    CONSTRAINT "users_theme_preference_check"
        CHECK ("theme_preference" IN ('light', 'dark', 'auto')),
    CONSTRAINT "users_account_status_check"
        CHECK ("account_status" IN ('active', 'suspended', 'deleting')),
    CONSTRAINT "users_version_check" CHECK ("version" > 0),
    CONSTRAINT "users_display_name_check"
        CHECK ("display_name" IS NULL OR char_length("display_name") BETWEEN 2 AND 60),
    CONSTRAINT "users_phone_pair_check"
        CHECK (("phone_ciphertext" IS NULL) = ("phone_lookup_hash" IS NULL)),
    CONSTRAINT "users_live_phone_check"
        CHECK ("deleted_at" IS NOT NULL OR
            ("phone_ciphertext" IS NOT NULL AND "phone_lookup_hash" IS NOT NULL))
);

CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role"),
    CONSTRAINT "user_roles_role_check"
        CHECK ("role" IN ('customer', 'vendor', 'provider', 'rider', 'admin', 'super_admin'))
);

CREATE UNIQUE INDEX "users_phone_lookup_hash_key" ON "users"("phone_lookup_hash");

CREATE INDEX "users_active_deleted_at_idx"
    ON "users"("deleted_at") WHERE ("deleted_at" IS NULL);

CREATE INDEX "user_roles_role_user_id_idx" ON "user_roles"("role", "user_id");

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT;

GRANT SELECT, INSERT, UPDATE ON "users" TO apnatown_runtime;
GRANT SELECT, INSERT, DELETE ON "user_roles" TO apnatown_runtime;

COMMIT;
