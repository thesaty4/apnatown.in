import { Prisma } from '../../../shared/persistence/generated/client';

/** Bound literal, token/full-text and the existing pg_trgm typo policy. */
export function searchText(query: string, text: Prisma.Sql, name: Prisma.Sql) {
  return Prisma.sql`(
    strpos(lower(unaccent(${text})),lower(unaccent(${query})))>0
    OR to_tsvector('simple',unaccent(${text})) @@ plainto_tsquery('simple',unaccent(${query}))
    OR lower(unaccent(${name})) % lower(unaccent(${query}))
  )`;
}
