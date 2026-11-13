import { IdSchema } from '@apnatown/shared/wire';
import { DomainError } from '../errors/errors';
import type { CursorBinding, CursorCodec } from './cursor';

/** Keyset of a business profile tab: [featured rank 0|1, name prefix, id]. */
export type BusinessListingKeys = [number, string, string];

/** Sealed, filter-bound cursor; tampered or foreign cursors fail validation. */
export function decodeBusinessListingCursor(
  codec: CursorCodec, cursor: string | undefined, binding: CursorBinding,
): BusinessListingKeys | null {
  if (!cursor) return null;
  const [rank, name, id, ...rest] = codec.decode(cursor, binding);
  if (rest.length || (rank !== 0 && rank !== 1) || typeof name !== 'string'
    || !IdSchema.safeParse(id).success) throw new DomainError('COMMON_VALIDATION_FAILED');
  return [rank, name, String(id)];
}

export function encodeBusinessListingCursor(
  codec: CursorCodec, next: BusinessListingKeys | null, binding: CursorBinding,
): string | null {
  return next ? codec.encode(binding, next) : null;
}
