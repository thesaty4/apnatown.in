import { Prisma } from '../../../shared/persistence/generated/client';

/** ISO-8601 UTC text with microseconds (matches `TimestampSchema`). */
export const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );

/** `column = ANY(ids)`; an empty list matches nothing. */
export const anyIds = (column: string, ids: readonly string[]) =>
  Prisma.sql`${Prisma.raw(column)} = ANY(${[...ids]}::uuid[])`;
