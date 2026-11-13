-- Reference services quote recurring fees per month (e.g. coaching fees), so
-- `month` joins the Services unit allow-list. Without it a monthly quote could
-- only be stored as enquiry or misread as a one-time price.
-- The original inline column CHECK uses PostgreSQL's generated name
-- services_unit_check; the replacement is explicitly named.
-- Recovery: a new reviewed migration can restore the narrower list only after
-- existing `month` rows are re-priced; no rows are modified here.
BEGIN;

ALTER TABLE services DROP CONSTRAINT services_unit_check;
ALTER TABLE services ADD CONSTRAINT services_unit_allowed
  CHECK (unit IN ('hour','day','event','sq_ft','unit','visit','plate','month'));

COMMIT;
