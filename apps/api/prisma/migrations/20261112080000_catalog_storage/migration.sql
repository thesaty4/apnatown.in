-- Additive Catalog storage (F-HM-003/004, F-SV-008, F-VD-006, F-AD-005/006/015,
-- F-SA-008): categories, directed category relations, subcategories, Home
-- sections, subcategory suggestions and keyword mappings. No rows are seeded
-- here (reference taxonomy is a separate migration).
-- `image_asset_id` (-> media_assets) and `subcategory_suggestions.business_id`
-- (-> businesses) are plain uuid columns for now: the Media and Businesses
-- migrations add those foreign keys when their tables exist.
-- pg_trgm/unaccent are enabled by 20261111145600_enable_required_extensions.
-- Recovery: transaction rollback on failure; inspect actual schema/migration
-- state before retrying. Once populated, repair forward; dropping these tables
-- removes the shared taxonomy, moderation history and search mappings.
BEGIN;

CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_hi" TEXT NOT NULL,
    "icon" TEXT,
    "image_asset_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_kind_check" CHECK ("kind" IN ('product', 'service')),
    CONSTRAINT "categories_slug_check"
        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("slug") <= 80),
    CONSTRAINT "categories_names_check" CHECK (
        char_length(btrim("name_en")) BETWEEN 1 AND 60 AND "name_en" !~ '[[:cntrl:]<>]'
        AND char_length(btrim("name_hi")) BETWEEN 1 AND 60 AND "name_hi" !~ '[[:cntrl:]<>]'),
    CONSTRAINT "categories_icon_check"
        CHECK ("icon" IS NULL OR (char_length("icon") BETWEEN 1 AND 16 AND "icon" !~ '[[:cntrl:]<>]')),
    CONSTRAINT "categories_sort_order_check" CHECK ("sort_order" >= 0),
    CONSTRAINT "categories_version_check" CHECK ("version" > 0)
);
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_kind_active_sort_idx" ON "categories"("kind", "active", "sort_order", "id");

CREATE TABLE "category_relations" (
    "source_category_id" UUID NOT NULL,
    "related_category_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "category_relations_pkey" PRIMARY KEY ("source_category_id", "related_category_id"),
    -- Source/target kinds must differ; validated by the use-case/seed.
    CONSTRAINT "category_relations_distinct_check" CHECK ("source_category_id" <> "related_category_id"),
    CONSTRAINT "category_relations_sort_order_check" CHECK ("sort_order" >= 0),
    CONSTRAINT "category_relations_source_fkey" FOREIGN KEY ("source_category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "category_relations_related_fkey" FOREIGN KEY ("related_category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "category_relations_source_sort_key" ON "category_relations"("source_category_id", "sort_order");
CREATE INDEX "category_relations_related_idx" ON "category_relations"("related_category_id");

CREATE TABLE "subcategories" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_hi" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "service_types" TEXT[] NOT NULL DEFAULT '{}',
    "image_asset_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subcategories_slug_check"
        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("slug") <= 80),
    CONSTRAINT "subcategories_names_check" CHECK (
        char_length(btrim("name_en")) BETWEEN 1 AND 60 AND "name_en" !~ '[[:cntrl:]<>]'
        AND char_length(btrim("name_hi")) BETWEEN 1 AND 60 AND "name_hi" !~ '[[:cntrl:]<>]'),
    CONSTRAINT "subcategories_normalized_name_check" CHECK (char_length("normalized_name") BETWEEN 1 AND 120),
    CONSTRAINT "subcategories_service_types_check" CHECK (cardinality("service_types") <= 10),
    CONSTRAINT "subcategories_sort_order_check" CHECK ("sort_order" >= 0),
    CONSTRAINT "subcategories_version_check" CHECK ("version" > 0),
    CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "subcategories_category_slug_key" ON "subcategories"("category_id", "slug");
CREATE UNIQUE INDEX "subcategories_category_normalized_name_key" ON "subcategories"("category_id", "normalized_name");
CREATE INDEX "subcategories_category_active_sort_idx" ON "subcategories"("category_id", "active", "sort_order", "id");
CREATE INDEX "subcategories_normalized_name_trgm_idx" ON "subcategories" USING GIN ("normalized_name" gin_trgm_ops);

CREATE TABLE "catalog_home_sections" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "content_kind" TEXT NOT NULL,
    "category_id" UUID,
    "heading_en" TEXT,
    "heading_hi" TEXT,
    "supporting_text_en" TEXT,
    "supporting_text_hi" TEXT,
    "initial_category_id" UUID,
    "position" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    -- Soft removal keeps the row for audit; removed sections never render.
    "removed_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "catalog_home_sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "catalog_home_sections_kind_check"
        CHECK ("kind" IN ('single_category', 'curated_categories')),
    CONSTRAINT "catalog_home_sections_content_kind_check"
        CHECK ("content_kind" IN ('product', 'service')),
    CONSTRAINT "catalog_home_sections_shape_check" CHECK (
        ("kind" = 'single_category' AND "category_id" IS NOT NULL
            AND "heading_en" IS NULL AND "heading_hi" IS NULL
            AND "initial_category_id" IS NULL)
        OR ("kind" = 'curated_categories' AND "category_id" IS NULL
            AND "heading_en" IS NOT NULL AND "heading_hi" IS NOT NULL
            AND "initial_category_id" IS NOT NULL)),
    CONSTRAINT "catalog_home_sections_supporting_text_check"
        CHECK (("supporting_text_en" IS NULL) = ("supporting_text_hi" IS NULL)),
    CONSTRAINT "catalog_home_sections_text_check" CHECK (
        ("heading_en" IS NULL OR (char_length(btrim("heading_en")) BETWEEN 1 AND 80 AND "heading_en" !~ '[[:cntrl:]<>]'))
        AND ("heading_hi" IS NULL OR (char_length(btrim("heading_hi")) BETWEEN 1 AND 80 AND "heading_hi" !~ '[[:cntrl:]<>]'))
        AND ("supporting_text_en" IS NULL OR (char_length(btrim("supporting_text_en")) BETWEEN 1 AND 160 AND "supporting_text_en" !~ '[[:cntrl:]<>]'))
        AND ("supporting_text_hi" IS NULL OR (char_length(btrim("supporting_text_hi")) BETWEEN 1 AND 160 AND "supporting_text_hi" !~ '[[:cntrl:]<>]'))),
    CONSTRAINT "catalog_home_sections_position_check" CHECK ("position" >= 0),
    CONSTRAINT "catalog_home_sections_removed_check" CHECK ("removed_at" IS NULL OR NOT "active"),
    CONSTRAINT "catalog_home_sections_version_check" CHECK ("version" > 0),
    CONSTRAINT "catalog_home_sections_category_id_fkey" FOREIGN KEY ("category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "catalog_home_sections_initial_category_id_fkey" FOREIGN KEY ("initial_category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "catalog_home_sections_created_by_fkey" FOREIGN KEY ("created_by")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "catalog_home_sections_updated_by_fkey" FOREIGN KEY ("updated_by")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX "catalog_home_sections_active_position_idx"
    ON "catalog_home_sections"("position", "id") WHERE "active";
-- One live dedicated section per category; removed rows keep their history.
CREATE UNIQUE INDEX "catalog_home_sections_single_category_key"
    ON "catalog_home_sections"("category_id")
    WHERE "kind" = 'single_category' AND "removed_at" IS NULL;

CREATE TABLE "catalog_home_section_categories" (
    "section_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "catalog_home_section_categories_pkey" PRIMARY KEY ("section_id", "category_id"),
    CONSTRAINT "catalog_home_section_categories_position_check" CHECK ("position" >= 0),
    CONSTRAINT "catalog_home_section_categories_section_id_fkey" FOREIGN KEY ("section_id")
        REFERENCES "catalog_home_sections"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "catalog_home_section_categories_category_id_fkey" FOREIGN KEY ("category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "catalog_home_section_categories_section_position_key"
    ON "catalog_home_section_categories"("section_id", "position");
CREATE INDEX "catalog_home_section_categories_pills_idx"
    ON "catalog_home_section_categories"("section_id", "position", "category_id");
CREATE INDEX "catalog_home_section_categories_category_idx"
    ON "catalog_home_section_categories"("category_id", "section_id");

CREATE TABLE "subcategory_suggestions" (
    "id" UUID NOT NULL,
    -- FK to businesses is added by the Businesses migration.
    "business_id" UUID NOT NULL,
    "submitter_user_id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_hi" TEXT,
    "normalized_name" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "subcategory_id" UUID,
    "merged_into_subcategory_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "subcategory_suggestions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subcategory_suggestions_status_check"
        CHECK ("status" IN ('pending', 'approved', 'rejected', 'merged')),
    CONSTRAINT "subcategory_suggestions_text_check" CHECK (
        char_length(btrim("name_en")) BETWEEN 2 AND 60 AND "name_en" !~ '[[:cntrl:]<>]'
        AND ("name_hi" IS NULL OR (char_length(btrim("name_hi")) BETWEEN 2 AND 60 AND "name_hi" !~ '[[:cntrl:]<>]'))
        AND char_length("normalized_name") BETWEEN 1 AND 120
        AND ("reason" IS NULL OR (char_length("reason") BETWEEN 1 AND 500 AND "reason" !~ '[[:cntrl:]<>]'))
        AND ("rejection_reason" IS NULL OR (char_length("rejection_reason") BETWEEN 1 AND 500 AND "rejection_reason" !~ '[[:cntrl:]<>]'))),
    -- ST-subcategory-suggestion: review fields and target match the state.
    CONSTRAINT "subcategory_suggestions_state_check" CHECK (
        ("status" = 'pending' AND "reviewed_by" IS NULL AND "reviewed_at" IS NULL
            AND "rejection_reason" IS NULL AND "subcategory_id" IS NULL
            AND "merged_into_subcategory_id" IS NULL)
        OR ("status" = 'approved' AND "reviewed_by" IS NOT NULL AND "reviewed_at" IS NOT NULL
            AND "rejection_reason" IS NULL AND "subcategory_id" IS NOT NULL
            AND "merged_into_subcategory_id" IS NULL)
        OR ("status" = 'rejected' AND "reviewed_by" IS NOT NULL AND "reviewed_at" IS NOT NULL
            AND "rejection_reason" IS NOT NULL AND "subcategory_id" IS NULL
            AND "merged_into_subcategory_id" IS NULL)
        OR ("status" = 'merged' AND "reviewed_by" IS NOT NULL AND "reviewed_at" IS NOT NULL
            AND "rejection_reason" IS NULL AND "subcategory_id" IS NULL
            AND "merged_into_subcategory_id" IS NOT NULL)),
    CONSTRAINT "subcategory_suggestions_version_check" CHECK ("version" > 0),
    CONSTRAINT "subcategory_suggestions_submitter_user_id_fkey" FOREIGN KEY ("submitter_user_id")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "subcategory_suggestions_city_id_fkey" FOREIGN KEY ("city_id")
        REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "subcategory_suggestions_area_city_fkey" FOREIGN KEY ("area_id", "city_id")
        REFERENCES "areas"("id", "city_id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "subcategory_suggestions_category_id_fkey" FOREIGN KEY ("category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "subcategory_suggestions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "subcategory_suggestions_subcategory_id_fkey" FOREIGN KEY ("subcategory_id")
        REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "subcategory_suggestions_merged_into_fkey" FOREIGN KEY ("merged_into_subcategory_id")
        REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "subcategory_suggestions_pending_name_key"
    ON "subcategory_suggestions"("category_id", "normalized_name") WHERE "status" = 'pending';
CREATE INDEX "subcategory_suggestions_queue_idx"
    ON "subcategory_suggestions"("status", "city_id", "area_id", "created_at", "id");
CREATE INDEX "subcategory_suggestions_business_idx"
    ON "subcategory_suggestions"("business_id", "created_at" DESC, "id" DESC);
CREATE INDEX "subcategory_suggestions_normalized_name_trgm_idx"
    ON "subcategory_suggestions" USING GIN ("normalized_name" gin_trgm_ops);
CREATE INDEX "subcategory_suggestions_area_city_idx"
    ON "subcategory_suggestions"("area_id", "city_id");

CREATE TABLE "keyword_mappings" (
    "id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "keyword_mappings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "keyword_mappings_version_check" CHECK ("version" > 0)
);
CREATE INDEX "keyword_mappings_enabled_id_idx" ON "keyword_mappings"("enabled", "id");

CREATE TABLE "keyword_mapping_terms" (
    "id" UUID NOT NULL,
    "mapping_id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "normalized_term" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "keyword_mapping_terms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "keyword_mapping_terms_kind_check" CHECK ("kind" IN ('primary', 'synonym')),
    CONSTRAINT "keyword_mapping_terms_text_check" CHECK (
        char_length(btrim("term")) BETWEEN 1 AND 60 AND "term" !~ '[[:cntrl:]<>]'
        AND char_length("normalized_term") BETWEEN 1 AND 120),
    CONSTRAINT "keyword_mapping_terms_mapping_id_fkey" FOREIGN KEY ("mapping_id")
        REFERENCES "keyword_mappings"("id") ON DELETE CASCADE ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "keyword_mapping_terms_normalized_term_key" ON "keyword_mapping_terms"("normalized_term");
CREATE UNIQUE INDEX "keyword_mapping_terms_primary_key"
    ON "keyword_mapping_terms"("mapping_id") WHERE "kind" = 'primary';
CREATE INDEX "keyword_mapping_terms_normalized_term_trgm_idx"
    ON "keyword_mapping_terms" USING GIN ("normalized_term" gin_trgm_ops);
CREATE INDEX "keyword_mapping_terms_mapping_kind_idx" ON "keyword_mapping_terms"("mapping_id", "kind", "id");

CREATE TABLE "keyword_mapping_targets" (
    "id" UUID NOT NULL,
    "mapping_id" UUID NOT NULL,
    "target_kind" TEXT NOT NULL,
    "category_id" UUID,
    "subcategory_id" UUID,
    "product_tag" TEXT,

    CONSTRAINT "keyword_mapping_targets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "keyword_mapping_targets_kind_check"
        CHECK ("target_kind" IN ('category', 'subcategory', 'product_tag')),
    CONSTRAINT "keyword_mapping_targets_shape_check" CHECK (
        ("target_kind" = 'category' AND "category_id" IS NOT NULL
            AND "subcategory_id" IS NULL AND "product_tag" IS NULL)
        OR ("target_kind" = 'subcategory' AND "subcategory_id" IS NOT NULL
            AND "category_id" IS NULL AND "product_tag" IS NULL)
        OR ("target_kind" = 'product_tag' AND "product_tag" IS NOT NULL
            AND "category_id" IS NULL AND "subcategory_id" IS NULL)),
    CONSTRAINT "keyword_mapping_targets_product_tag_check"
        CHECK ("product_tag" IS NULL OR char_length("product_tag") BETWEEN 1 AND 120),
    CONSTRAINT "keyword_mapping_targets_mapping_id_fkey" FOREIGN KEY ("mapping_id")
        REFERENCES "keyword_mappings"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT "keyword_mapping_targets_category_id_fkey" FOREIGN KEY ("category_id")
        REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "keyword_mapping_targets_subcategory_id_fkey" FOREIGN KEY ("subcategory_id")
        REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "keyword_mapping_targets_category_key"
    ON "keyword_mapping_targets"("mapping_id", "category_id") WHERE "category_id" IS NOT NULL;
CREATE UNIQUE INDEX "keyword_mapping_targets_subcategory_key"
    ON "keyword_mapping_targets"("mapping_id", "subcategory_id") WHERE "subcategory_id" IS NOT NULL;
CREATE UNIQUE INDEX "keyword_mapping_targets_product_tag_key"
    ON "keyword_mapping_targets"("mapping_id", "product_tag") WHERE "product_tag" IS NOT NULL;
CREATE INDEX "keyword_mapping_targets_category_idx"
    ON "keyword_mapping_targets"("category_id") WHERE "category_id" IS NOT NULL;
CREATE INDEX "keyword_mapping_targets_subcategory_idx"
    ON "keyword_mapping_targets"("subcategory_id") WHERE "subcategory_id" IS NOT NULL;
CREATE INDEX "keyword_mapping_targets_product_tag_idx"
    ON "keyword_mapping_targets"("product_tag") WHERE "product_tag" IS NOT NULL;

-- Runtime grants: taxonomy and sections are never hard-deleted (deactivate or
-- soft-remove); section pills are replaced on edit; mapping terms/targets are
-- replaced on edit and mappings are deleted (cascade) by super_admin.
GRANT SELECT, INSERT, UPDATE ON "categories", "subcategories", "catalog_home_sections",
    "subcategory_suggestions" TO apnatown_runtime;
GRANT SELECT, INSERT ON "category_relations" TO apnatown_runtime;
GRANT SELECT, INSERT, DELETE ON "catalog_home_section_categories" TO apnatown_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON "keyword_mappings" TO apnatown_runtime;
GRANT SELECT, INSERT, DELETE ON "keyword_mapping_terms", "keyword_mapping_targets" TO apnatown_runtime;

COMMIT;
