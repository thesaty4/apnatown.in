-- Notifications owns the in-app feed, the five own preferences, versioned
-- EN/HI templates and per-channel delivery outcomes (F-NT-001, F-NT-002,
-- F-X-012; notifications BE spec). Logical messages are keyed by
-- (user, audience role, source event, template, content version) so outbox
-- replays publish once. Params hold ids/codes/business names only: never
-- OTP/pickup codes, phones, addresses, enquiry text or private evidence.
-- Provider receipts and follower fan-out checkpoints are NOT created here:
-- no email/WhatsApp provider is configured (NT-Q1/Q-04) and no
-- `*.first_published` producer exists yet.
-- Runtime may insert messages and only set publication/read state; it may
-- upsert own preferences; templates are migration-seeded and read-only.
-- Recovery is forward repair only. No backfill.
BEGIN;
CREATE TABLE notifications (
  id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  audience_role text NOT NULL,
  category text NOT NULL,
  topic text NOT NULL,
  intent text NOT NULL,
  template_key text NOT NULL,
  template_version integer NOT NULL,
  content_version text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_ref jsonb,
  follower_ref jsonb,
  link_path text,
  resource_scope jsonb,
  in_app_published_at timestamptz(6),
  read_at timestamptz(6),
  source_event_id uuid NOT NULL,
  source_type text NOT NULL,
  source_version bigint NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_audience_role_allowed CHECK (audience_role IN ('customer','vendor','provider','rider','admin','super_admin')),
  CONSTRAINT notifications_category_allowed CHECK (category IN ('order','offer','review','approval','enquiry','job','admin','system','follow')),
  CONSTRAINT notifications_topic_allowed CHECK (topic IN ('orders','offers','enquiries','system','follower_updates')),
  CONSTRAINT notifications_intent_allowed CHECK (intent IN ('transactional','marketing')),
  CONSTRAINT notifications_template_version_positive CHECK (template_version >= 1),
  CONSTRAINT notifications_source_version_positive CHECK (source_version >= 1),
  CONSTRAINT notifications_content_version_shape CHECK (content_version ~ '^[A-Za-z0-9._:-]{1,64}$'),
  CONSTRAINT notifications_params_object CHECK (jsonb_typeof(params) = 'object'),
  -- Allow-listed internal path only: no scheme/host, protocol-relative or traversal.
  CONSTRAINT notifications_link_internal CHECK (link_path IS NULL OR (char_length(link_path) <= 300 AND link_path ~ '^/[A-Za-z0-9._~?=&/-]*$' AND link_path !~ '^//' AND position('..' IN link_path) = 0)),
  CONSTRAINT notifications_read_requires_publication CHECK (read_at IS NULL OR in_app_published_at IS NOT NULL),
  CONSTRAINT notifications_logical_message_key UNIQUE (user_id,audience_role,source_event_id,template_key,content_version)
);
-- Role-bound feed: newest-first keyset over published in-app items only.
CREATE INDEX notifications_feed_idx ON notifications(user_id,audience_role,in_app_published_at DESC,id DESC) WHERE in_app_published_at IS NOT NULL;
-- Bell badge: unread published items only.
CREATE INDEX notifications_unread_idx ON notifications(user_id,audience_role) WHERE in_app_published_at IS NOT NULL AND read_at IS NULL;

CREATE TABLE notification_preferences (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  inapp boolean NOT NULL,
  email boolean NOT NULL,
  wa_orders boolean NOT NULL,
  wa_offers boolean NOT NULL,
  wa_enq boolean NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id),
  CONSTRAINT notification_preferences_version_positive CHECK (version >= 1)
);

CREATE TABLE notification_templates (
  key text NOT NULL,
  channel text NOT NULL,
  locale text NOT NULL,
  title text,
  body text NOT NULL,
  provider_template_id text,
  version integer NOT NULL,
  active boolean NOT NULL,
  CONSTRAINT notification_templates_pkey PRIMARY KEY (key,channel,locale,version),
  CONSTRAINT notification_templates_channel_allowed CHECK (channel IN ('in_app','email','whatsapp')),
  CONSTRAINT notification_templates_locale_allowed CHECK (locale IN ('en','hi')),
  CONSTRAINT notification_templates_version_positive CHECK (version >= 1),
  CONSTRAINT notification_templates_key_shape CHECK (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  CONSTRAINT notification_templates_text_length CHECK (char_length(body) BETWEEN 1 AND 1000 AND (title IS NULL OR char_length(title) BETWEEN 1 AND 200)),
  -- WhatsApp needs an approved provider template mapping; in-app/email never carry one.
  CONSTRAINT notification_templates_provider_mapping CHECK ((channel = 'whatsapp') = (provider_template_id IS NOT NULL))
);
-- One active version per key/channel/locale.
CREATE UNIQUE INDEX notification_templates_active_idx ON notification_templates(key,channel,locale) WHERE active;

CREATE TABLE notification_deliveries (
  id uuid NOT NULL,
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  channel text NOT NULL,
  status text NOT NULL,
  suppression_reason text,
  campaign_id uuid,
  recipient_key text,
  attempts integer NOT NULL DEFAULT 0,
  provider_message_id text,
  last_error_code text,
  lease_until timestamptz(6),
  next_attempt_at timestamptz(6),
  sent_at timestamptz(6),
  delivered_at timestamptz(6),
  failed_at timestamptz(6),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT notification_deliveries_channel_allowed CHECK (channel IN ('in_app','email','whatsapp')),
  CONSTRAINT notification_deliveries_status_allowed CHECK (status IN ('queued','sending','sent','delivered','failed','suppressed')),
  CONSTRAINT notification_deliveries_reason_allowed CHECK (suppression_reason IS NULL OR suppression_reason IN ('preference_off','consent_withdrawn','channel_disabled','subject_inactive','scope_revoked','target_unavailable','policy_unresolved')),
  CONSTRAINT notification_deliveries_suppression_reason_matches CHECK ((status = 'suppressed') = (suppression_reason IS NOT NULL)),
  CONSTRAINT notification_deliveries_attempts_nonnegative CHECK (attempts >= 0),
  CONSTRAINT notification_deliveries_version_positive CHECK (version >= 1),
  CONSTRAINT notification_deliveries_campaign_key_pairing CHECK ((campaign_id IS NULL) = (recipient_key IS NULL)),
  CONSTRAINT notification_deliveries_message_channel_key UNIQUE (notification_id,channel)
);
CREATE UNIQUE INDEX notification_deliveries_campaign_recipient_idx ON notification_deliveries(campaign_id,recipient_key) WHERE campaign_id IS NOT NULL;
CREATE UNIQUE INDEX notification_deliveries_provider_message_idx ON notification_deliveries(channel,provider_message_id) WHERE provider_message_id IS NOT NULL;
-- Resumable external sends (blocked until a provider is configured).
CREATE INDEX notification_deliveries_work_idx ON notification_deliveries(status,next_attempt_at,lease_until);

-- In-app templates for producer events that exist today. Plain text with
-- allow-listed {placeholders}; Hindi copy pending content review (TODO(verify)).
INSERT INTO notification_templates (key,channel,locale,title,body,provider_template_id,version,active) VALUES
  ('admin.alert','in_app','en','Needs review','A new {subject} is waiting for review.',NULL,1,true),
  ('admin.alert','in_app','hi','समीक्षा आवश्यक','एक नया {subject} समीक्षा की प्रतीक्षा में है।',NULL,1,true),
  ('approval.decided','in_app','en','Application update','Your application status is now: {status}.',NULL,1,true),
  ('approval.decided','in_app','hi','आवेदन अपडेट','आपके आवेदन की स्थिति अब: {status}।',NULL,1,true),
  ('enquiry.new','in_app','en','New enquiry','You have a new enquiry. Open it to respond.',NULL,1,true),
  ('enquiry.new','in_app','hi','नई पूछताछ','आपके पास एक नई पूछताछ है। जवाब देने के लिए इसे खोलें।',NULL,1,true),
  ('subcategory.decided','in_app','en','Subcategory suggestion','Your suggestion "{name}" was {status}.',NULL,1,true),
  ('subcategory.decided','in_app','hi','उपश्रेणी सुझाव','आपका सुझाव "{name}" {status}।',NULL,1,true),
  ('comment.decided','in_app','en','Comment update','Your comment was {status}.',NULL,1,true),
  ('comment.decided','in_app','hi','टिप्पणी अपडेट','आपकी टिप्पणी {status}।',NULL,1,true),
  ('support.received','in_app','en','New support message','A new support message was received.',NULL,1,true),
  ('support.received','in_app','hi','नया सहायता संदेश','एक नया सहायता संदेश प्राप्त हुआ है।',NULL,1,true);

GRANT SELECT, INSERT ON notifications TO apnatown_runtime;
GRANT UPDATE (in_app_published_at, read_at) ON notifications TO apnatown_runtime;
GRANT SELECT, INSERT ON notification_preferences TO apnatown_runtime;
GRANT UPDATE (inapp, email, wa_orders, wa_offers, wa_enq, version, updated_at) ON notification_preferences TO apnatown_runtime;
GRANT SELECT ON notification_templates TO apnatown_runtime;
GRANT SELECT, INSERT ON notification_deliveries TO apnatown_runtime;
COMMIT;
