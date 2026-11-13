-- Search needs Media's documented linked-item read source (Media BE video_links).
-- No Search-owned table, link writer, approval, counter or seed is introduced.
-- Runtime reads only; Media's later attach command must validate ownership.
-- Read projection also rechecks same-business and current target publication.
-- Recovery is forward repair; dropping this table loses owner attachment data.
BEGIN;
CREATE TABLE video_links (
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  target_type text NOT NULL CHECK (target_type IN ('product','service')),
  target_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (video_id,target_type,target_id)
);
CREATE INDEX video_links_target_idx ON video_links(target_type,target_id);
CREATE INDEX video_links_order_idx ON video_links(video_id,sort_order,target_id);
GRANT SELECT ON video_links TO apnatown_runtime;
COMMIT;
