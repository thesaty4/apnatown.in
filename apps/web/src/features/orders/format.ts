import {
  BUSINESS_REJECT_REASONS,
  CUSTOMER_CANCEL_REASONS,
} from '@apnatown/shared/orders';

export type Locale = 'en' | 'hi';

export const localName = (
  value: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && value.nameHi) || value.nameEn;

const known = new Set<string>([
  ...CUSTOMER_CANCEL_REASONS,
  ...BUSINESS_REJECT_REASONS,
]);

/** Stable snake_case reason → camelCase `orders.reasons.*` key; unknown
 * server keys render no reason rather than raw text. */
export function reasonKey(value: string): string | null {
  if (!known.has(value)) return null;
  return value.replace(/_([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}
