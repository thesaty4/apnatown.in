import { DomainError } from '../../../shared/errors/errors';
import type { ImageByteRange } from '../domain/images';

/** GET/HEAD If-None-Match uses weak comparison; authorization happens first. */
export function imageNotModified(header: string | undefined, etag: string): boolean {
  return Boolean(header?.split(',').some((value) => {
    const tag = value.trim();
    return tag === '*' || (tag.startsWith('W/') ? tag.slice(2) : tag) === etag;
  }));
}

/** Single-range policy, evaluated against trusted stored byte length before I/O. */
export function imageByteRange(header: string, bytes: number): ImageByteRange {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  const invalid = (): never => { throw new DomainError('MEDIA_RANGE_INVALID'); };
  if (!match || (!match[1] && !match[2])) return invalid();
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last)))
    return invalid();
  if (first === null && (!last || last < 1)) return invalid();
  const start = first ?? Math.max(0,bytes-last!);
  const end = first === null || last === null ? bytes-1 : Math.min(last,bytes-1);
  if (start < 0 || start >= bytes || start > end) return invalid();
  return { start,end };
}
