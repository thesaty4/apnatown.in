import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { DomainError } from '../../../shared/errors/errors';
import type { CursorCodec, CursorBinding } from '../../../shared/pagination/cursor';

export function discoveryPosition(
  cursors: CursorCodec, cursor: string | undefined, binding: CursorBinding, now: string,
): { asOf: string; after?: string[] } {
  if (!cursor) return { asOf: now };
  const keys = cursors.decode(cursor, binding);
  if (!keys.every((key) => typeof key === 'string') || !TimestampSchema.safeParse(keys[0]).success
    || !IdSchema.safeParse(keys.at(-1)).success) throw new DomainError('COMMON_VALIDATION_FAILED');
  const asOf = String(keys[0]);
  const age = Date.parse(now) - Date.parse(asOf);
  if (!Number.isFinite(age) || age < 0 || age > 15 * 60_000) throw new DomainError('COMMON_VALIDATION_FAILED');
  return { asOf, after: keys.slice(1) as string[] };
}
