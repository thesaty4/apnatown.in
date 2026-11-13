-- Owner offers (specs/offers/be/offers.md S-VEND-07, F-VD-007, F-OF-005):
-- runtime may insert owner offers and update only owner-editable columns
-- and status. Review decision columns stay admin-owned except that an owner
-- edit clears them back to pending approval (same statement).
-- Recovery: forward-only; revoking the grants disables owner writes only.
BEGIN;
GRANT INSERT ON offers TO apnatown_runtime;
GRANT UPDATE (title_en, title_hi, discount_type, discount_percent, discount_paise,
  valid_from, valid_to, status, review_decision, rejection_reason, version, updated_at)
  ON offers TO apnatown_runtime;
COMMIT;
