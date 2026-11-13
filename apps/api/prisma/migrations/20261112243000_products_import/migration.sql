-- Owner product import caps (products BE spec, Q-47): admits the
-- `product_import` settings key. No row is seeded, so CSV/XLSX import stays
-- disabled (PRODUCT_IMPORT_POLICY_REQUIRED) until a Super Admin configures
-- caps within the shared hard ceilings (zod-validated before every save).
-- Recovery: transaction rollback on failure; repair forward. Narrowing the
-- check again would first require deleting a saved `product_import` row.
BEGIN;
ALTER TABLE "settings" DROP CONSTRAINT "settings_key_check";
ALTER TABLE "settings" ADD CONSTRAINT "settings_key_check" CHECK ("key" IN
    ('branding', 'delivery', 'rider_earning', 'commission', 'plans', 'promotion_fees',
     'payments', 'policies', 'reviews', 'uploads', 'integrations', 'seo', 'tax',
     'product_import'));
COMMIT;
