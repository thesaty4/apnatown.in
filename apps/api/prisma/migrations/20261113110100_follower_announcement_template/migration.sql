-- Follower announcement template (engagement BE F-NT-003; notifications BE matrix).
-- In-app EN/HI v1 consumed by the worker on `engagement.announcement_created`
-- for current followers with the bell on. Params: business name and the
-- owner's announcement text only (rendered as plain text, capped server-side).
-- TODO(verify): Hindi copy pending content review.
-- Data-only and insert-only (ON CONFLICT DO NOTHING); recovery is forward
-- repair by a new version row. No schema or grant changes.
BEGIN;
INSERT INTO notification_templates (key,channel,locale,title,body,provider_template_id,version,active) VALUES
  ('follower.announcement','in_app','en','{name}','{message}',NULL,1,true),
  ('follower.announcement','in_app','hi','{name}','{message}',NULL,1,true)
ON CONFLICT DO NOTHING;
COMMIT;
