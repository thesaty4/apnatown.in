CREATE TABLE "video_comments" (
  "id" UUID NOT NULL,
  "video_id" UUID NOT NULL,
  "author_user_id" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "removed_reason" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "video_comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "video_comments_text_length_check"
    CHECK (length(btrim("text")) BETWEEN 1 AND 500),
  CONSTRAINT "video_comments_status_check"
    CHECK ("status" IN ('pending', 'published', 'removed')),
  CONSTRAINT "video_comments_version_check"
    CHECK ("version" >= 1),
  CONSTRAINT "video_comments_video_id_fkey"
    FOREIGN KEY ("video_id") REFERENCES "videos"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "video_comments_author_user_id_fkey"
    FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX "video_comments_video_status_page_idx"
  ON "video_comments" ("video_id", "status", "created_at" DESC, "id" DESC);
CREATE INDEX "video_comments_status_page_idx"
  ON "video_comments" ("status", "created_at", "id");
