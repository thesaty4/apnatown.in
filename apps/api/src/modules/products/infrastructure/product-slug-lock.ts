import { createHash } from 'node:crypto';
import type { PrismaDatabase } from '../../../shared/persistence/prisma-database';

/**
 * Slug allocation is serialized per bucket, not per base, so one import of
 * up to 1000 rows takes at most SLUG_LOCK_BUCKETS advisory locks instead of
 * one per base (bounded shared lock-table use). Single create and import
 * MUST use this same key function so a base always maps to the same lock.
 * TODO(verify): bucket count vs. create contention.
 */
export const SLUG_LOCK_BUCKETS = 64;

const bucket = (base: string) =>
  createHash('sha256').update(base).digest().readUInt32BE(0) %
  SLUG_LOCK_BUCKETS;

/** Distinct bucket lock keys for `bases`, ascending (deadlock-free order). */
export function slugLockKeys(bases: readonly string[]): string[] {
  return [...new Set(bases.map(bucket))]
    .sort((left, right) => left - right)
    .map((index) => `product.slug.bucket:${index}`);
}

/** Transaction-scoped locks for every bucket of `bases`, in sorted order. */
export async function lockSlugBases(
  client: ReturnType<PrismaDatabase['client']>,
  bases: readonly string[],
): Promise<void> {
  // Sequential on purpose: the acquisition order is the deadlock guard.
  for (const key of slugLockKeys(bases))
    await client.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
