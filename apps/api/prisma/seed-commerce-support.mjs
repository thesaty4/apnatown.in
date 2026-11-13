import { createRequire } from 'node:module';
import { FIXTURE_CLOCK } from './seed-fixtures.mjs';

const require = createRequire(import.meta.url);
export const DAY_MS = 86_400_000;
// Explicit datetime bounds, not date-only inputs: [2026-11-01T00:00Z,
// 2027-04-30T00:00Z). Offers has no maximum duration; this 180-day LOCAL/TEST
// window keeps demos usable without infinite validity or a sliding seed clock.
export const DEMO_VALID_TO = new Date(FIXTURE_CLOCK.getTime() + 180 * DAY_MS);

export function loadCommerceSchemas() {
  try {
    return {
      businesses: require('@apnatown/shared/businesses'),
      products: require('@apnatown/shared/products'),
      cart: require('@apnatown/shared/cart'),
    };
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND')
      throw new Error('API_BUILD_REQUIRED', { cause: error });
    throw error;
  }
}

/** Never include submitted/sample contents or a Zod/SQL diagnostic in errors. */
export function checked(schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error('SEED_DATA_INVALID');
  return parsed.data;
}

export function assertSeed(condition) {
  if (!condition) throw new Error('SEED_DATA_INVALID');
}

export function assertReference(condition) {
  if (!condition) throw new Error('SEED_REFERENCE_CONFLICT');
}
