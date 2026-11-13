-- Supports the area picker's literal EN/HI substring filter alongside its city
-- and keyset indexes. A forward repair may drop this index without removing data.
BEGIN;

CREATE INDEX "areas_names_trgm_idx" ON "areas" USING GIN (
    "name_en" gin_trgm_ops,
    "name_hi" gin_trgm_ops
);

COMMIT;
