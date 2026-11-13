-- Services owns enquiries (F-SV-005, F-VD-016, F-PV-004; services BE spec
-- table `enquiries`; ST-enquiry). A guest or signed-in customer submits an
-- enquiry for an active service of an approved business; only the owning
-- vendor/provider reads it. Guest submissions have no user link.
-- PII: the phone is stored only as AEAD ciphertext (never plaintext and no
-- lookup hash); name/message are owner-visible text and are never placed in
-- events or logs (BR-14). Guest PII retention/deletion remains Q-51.
-- `converted_at` keeps the first conversion instant (reporting-v1).
-- Runtime may insert enquiries and advance status/version/converted_at only;
-- it can never rewrite the service, business, customer or submitted fields.
-- Recovery is forward repair only; dropping this table loses customer
-- enquiries and review-eligibility proof. No seed or backfill.
BEGIN;
CREATE TABLE enquiries (
  id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  customer_user_id uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  name text NOT NULL,
  phone_ciphertext text NOT NULL,
  message text NOT NULL,
  preferred_date date,
  status text NOT NULL DEFAULT 'new',
  version integer NOT NULL DEFAULT 1,
  converted_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT enquiries_pkey PRIMARY KEY (id),
  CONSTRAINT enquiries_status_allowed CHECK (status IN ('new','contacted','converted','closed')),
  CONSTRAINT enquiries_version_positive CHECK (version >= 1),
  CONSTRAINT enquiries_name_length CHECK (char_length(name) BETWEEN 2 AND 60),
  CONSTRAINT enquiries_message_length CHECK (char_length(message) BETWEEN 1 AND 1000),
  CONSTRAINT enquiries_phone_ciphertext_present CHECK (char_length(phone_ciphertext) > 0),
  -- A converted enquiry always records when it was (first) converted.
  CONSTRAINT enquiries_conversion_recorded CHECK (status <> 'converted' OR converted_at IS NOT NULL)
);
-- Owner inbox: status filter + newest-first keyset.
CREATE INDEX enquiries_inbox_idx ON enquiries(business_id,status,created_at DESC,id DESC);
-- User data requests and enquirer review eligibility.
CREATE INDEX enquiries_customer_idx ON enquiries(customer_user_id,business_id,created_at DESC);
-- Reporting cohorts (also serves the all-status inbox order) and conversion activity.
CREATE INDEX enquiries_cohort_idx ON enquiries(business_id,created_at,id);
CREATE INDEX enquiries_conversion_idx ON enquiries(business_id,converted_at,id);
-- Foreign-key index.
CREATE INDEX enquiries_service_idx ON enquiries(service_id);

GRANT SELECT, INSERT ON enquiries TO apnatown_runtime;
GRANT UPDATE (status, version, converted_at, updated_at) ON enquiries TO apnatown_runtime;
COMMIT;
