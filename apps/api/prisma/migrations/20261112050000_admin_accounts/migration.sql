-- Additive admin RBAC storage (BR-13); no roles, admin accounts or grants are seeded.
-- The first super_admin is a users role granted by the local operator command.
-- Recovery: transaction rollback on failure; inspect actual schema/migration state
-- before retrying. Once populated, repair forward; dropping these tables removes
-- every admin authorization and role assignment.
BEGIN;

CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roles_name_check"
        CHECK (char_length("name") BETWEEN 2 AND 40 AND "name" !~ '[[:cntrl:]<>]'),
    CONSTRAINT "roles_description_check"
        CHECK ("description" IS NULL OR
            (char_length("description") <= 200 AND "description" !~ '[[:cntrl:]<>]')),
    CONSTRAINT "roles_version_check" CHECK ("version" > 0)
);

CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "module", "action"),
    CONSTRAINT "role_permissions_module_check" CHECK ("module" IN
        ('approvals', 'orders', 'users', 'reviews', 'comms', 'reports', 'catalog', 'promos')),
    CONSTRAINT "role_permissions_action_check"
        CHECK ("action" IN ('view', 'create', 'edit', 'delete', 'export'))
);

CREATE TABLE "admin_accounts" (
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "email_ciphertext" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "communication_scopes" TEXT[] NOT NULL DEFAULT '{}',
    "last_active_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_accounts_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "admin_accounts_display_name_check"
        CHECK (char_length("display_name") BETWEEN 2 AND 60 AND "display_name" !~ '[[:cntrl:]<>]'),
    -- Application AEAD authenticates the admin/field context; this only checks the envelope.
    CONSTRAINT "admin_accounts_email_encrypted_check"
        CHECK ("email_ciphertext" ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$'),
    CONSTRAINT "admin_accounts_status_check" CHECK ("status" IN ('active', 'inactive')),
    CONSTRAINT "admin_accounts_communication_scopes_check"
        CHECK ("communication_scopes" <@ ARRAY['city', 'zone']::TEXT[]
            AND array_position("communication_scopes", NULL) IS NULL),
    CONSTRAINT "admin_accounts_version_check" CHECK ("version" > 0)
);

CREATE TABLE "admin_permissions" (
    "user_id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("user_id", "module", "action"),
    CONSTRAINT "admin_permissions_module_check" CHECK ("module" IN
        ('approvals', 'orders', 'users', 'reviews', 'comms', 'reports', 'catalog', 'promos')),
    CONSTRAINT "admin_permissions_action_check"
        CHECK ("action" IN ('view', 'create', 'edit', 'delete', 'export'))
);

CREATE TABLE "admin_scopes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "authority" TEXT NOT NULL,
    "area_id" UUID,
    "city_id" UUID NOT NULL,

    CONSTRAINT "admin_scopes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_scopes_authority_check" CHECK ("authority" IN ('area', 'city')),
    -- An area grant names exactly one area (city matched by the composite FK);
    -- a whole-city grant names no area and is never inferred from area grants.
    CONSTRAINT "admin_scopes_authority_area_check" CHECK (
        ("authority" = 'area' AND "area_id" IS NOT NULL) OR
        ("authority" = 'city' AND "area_id" IS NULL))
);

CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE INDEX "admin_accounts_role_id_idx" ON "admin_accounts"("role_id");
CREATE INDEX "admin_accounts_status_idx" ON "admin_accounts"("status");
CREATE INDEX "admin_accounts_created_page_idx"
    ON "admin_accounts"("created_at" DESC, "user_id" DESC);
CREATE UNIQUE INDEX "admin_scopes_area_grant_key"
    ON "admin_scopes"("user_id", "area_id") WHERE "authority" = 'area';
CREATE UNIQUE INDEX "admin_scopes_city_grant_key"
    ON "admin_scopes"("user_id", "city_id") WHERE "authority" = 'city';
CREATE INDEX "admin_scopes_guard_idx"
    ON "admin_scopes"("user_id", "authority", "city_id", "area_id");
CREATE INDEX "admin_scopes_city_id_idx" ON "admin_scopes"("city_id");
CREATE INDEX "admin_scopes_area_city_idx" ON "admin_scopes"("area_id", "city_id");

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "admin_accounts" ADD CONSTRAINT "admin_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- Deleting an in-use role requires an explicit reassignment first.
ALTER TABLE "admin_accounts" ADD CONSTRAINT "admin_accounts_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "admin_accounts" ADD CONSTRAINT "admin_accounts_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "admin_accounts"("user_id")
    ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "admin_accounts"("user_id")
    ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- The composite key prevents an area grant being paired with a different city.
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_area_city_fkey"
    FOREIGN KEY ("area_id", "city_id") REFERENCES "areas"("id", "city_id")
    ON DELETE RESTRICT ON UPDATE RESTRICT;

GRANT SELECT, INSERT, DELETE ON "roles", "role_permissions" TO apnatown_runtime;
-- Identity, system flag and creation time cannot be rewritten by the runtime.
GRANT UPDATE ("name", "description", "version", "updated_at")
    ON "roles" TO apnatown_runtime;
-- Admin accounts are deactivated, never deleted, by the runtime.
GRANT SELECT, INSERT ON "admin_accounts" TO apnatown_runtime;
GRANT UPDATE ("role_id", "status", "last_active_at", "version", "updated_at")
    ON "admin_accounts" TO apnatown_runtime;
GRANT SELECT, INSERT, DELETE ON "admin_permissions", "admin_scopes" TO apnatown_runtime;

COMMIT;
