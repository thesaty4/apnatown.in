import { Inflate } from 'fflate';
import { DomainError } from '../../../../shared/errors/errors';

/**
 * Minimal, bounded ZIP access for XLSX parts. Only the central directory is
 * trusted for entry metadata; ZIP64, multi-disk, encrypted and non-deflate
 * entries are rejected. Inflation streams 4 KiB of compressed input at a time
 * and stops as soon as output exceeds the declared size (itself ≤ the caller's
 * cap), so a zip bomb costs at most one bounded chunk (≈4 MiB at DEFLATE's
 * maximum ratio) of work beyond the cap.
 */

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;
const CHUNK = 4096;

export interface ZipEntry {
  name: string;
  flags: number;
  method: number;
  compressedSize: number;
  size: number;
  localOffset: number;
}

const invalid = () =>
  new DomainError('PRODUCT_IMPORT_INVALID', { field: 'file' });
const tooLarge = () =>
  new DomainError('PRODUCT_IMPORT_LIMIT', { field: 'file' });

/** Central-directory entries by name; at most `maxEntries`. */
export function zipEntries(
  bytes: Buffer,
  maxEntries: number,
): Map<string, ZipEntry> {
  if (bytes.length < 22) throw invalid();
  const floor = Math.max(0, bytes.length - 22 - 0xffff);
  let eocd = -1;
  for (let at = bytes.length - 22; at >= floor; at -= 1)
    if (bytes.readUInt32LE(at) === EOCD) {
      eocd = at;
      break;
    }
  if (eocd < 0) throw invalid();
  const count = bytes.readUInt16LE(eocd + 10);
  const size = bytes.readUInt32LE(eocd + 12);
  const offset = bytes.readUInt32LE(eocd + 16);
  if (
    bytes.readUInt16LE(eocd + 4) !== 0 ||
    bytes.readUInt16LE(eocd + 6) !== 0 ||
    bytes.readUInt16LE(eocd + 8) !== count ||
    count === 0xffff ||
    offset === 0xffffffff ||
    offset + size > eocd
  )
    throw invalid();
  if (count > maxEntries) throw tooLarge();
  const entries = new Map<string, ZipEntry>();
  let at = offset;
  for (let index = 0; index < count; index += 1) {
    if (at + 46 > eocd || bytes.readUInt32LE(at) !== CENTRAL) throw invalid();
    const nameEnd = at + 46 + bytes.readUInt16LE(at + 28);
    if (nameEnd > eocd) throw invalid();
    const entry: ZipEntry = {
      name: bytes.toString('utf8', at + 46, nameEnd),
      flags: bytes.readUInt16LE(at + 8),
      method: bytes.readUInt16LE(at + 10),
      compressedSize: bytes.readUInt32LE(at + 20),
      size: bytes.readUInt32LE(at + 24),
      localOffset: bytes.readUInt32LE(at + 42),
    };
    if (entries.has(entry.name)) throw invalid();
    entries.set(entry.name, entry);
    at = nameEnd + bytes.readUInt16LE(at + 30) + bytes.readUInt16LE(at + 32);
  }
  return entries;
}

/** Entry bytes, at most `cap` (PRODUCT_IMPORT_LIMIT beyond it). */
export function inflateEntry(
  bytes: Buffer,
  entry: ZipEntry,
  cap: number,
): Buffer {
  if (entry.flags & 1 || (entry.method !== 0 && entry.method !== 8))
    throw invalid();
  if (entry.size > cap) throw tooLarge();
  const local = entry.localOffset;
  if (local + 30 > bytes.length || bytes.readUInt32LE(local) !== LOCAL)
    throw invalid();
  const start =
    local +
    30 +
    bytes.readUInt16LE(local + 26) +
    bytes.readUInt16LE(local + 28);
  const end = start + entry.compressedSize;
  if (end > bytes.length) throw invalid();
  const data = bytes.subarray(start, end);
  if (entry.method === 0) {
    if (data.length !== entry.size) throw invalid();
    return data;
  }
  if (!data.length) throw invalid();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let done = false;
  const inflater = new Inflate((chunk, final) => {
    total += chunk.length;
    // A lying size header cannot make the server keep inflating.
    if (total > entry.size) throw invalid();
    chunks.push(chunk);
    if (final) done = true;
  });
  try {
    for (let at = 0; at < data.length; at += CHUNK)
      inflater.push(
        data.subarray(at, Math.min(at + CHUNK, data.length)),
        at + CHUNK >= data.length,
      );
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw invalid();
  }
  if (!done || total !== entry.size) throw invalid();
  return Buffer.concat(chunks, total);
}
