import 'server-only';
import { redirect } from 'next/navigation';
import { LegalPageSchema, type LegalSlug } from '@apnatown/shared/settings';
import { createPublicServerApi } from '../../shared/api/server';
import { ApiFailure, unwrap } from '../../shared/api/result';
import { maintenanceHref } from '../../shared/api/maintenance';
import type { Locale } from '../../shared/i18n/preferences';

/** Public legal routes → BE slugs. */
export const LEGAL_ROUTES = {
  about: '/about',
  terms: '/terms',
  privacy: '/privacy',
  refund: '/refund-policy',
} as const satisfies Record<LegalSlug, string>;

/** ISR-style data cache under `legal:{slug}`; `legal.updated` revalidates the
 * tag, the time window bounds staleness. Missing → null (route 404s). */
export async function readLegalPage(slug: LegalSlug, locale: Locale) {
  const api = createPublicServerApi({
    revalidate: 300,
    tags: [`legal:${slug}`],
  });
  try {
    return unwrap(
      await api.GET('/legal/{slug}', {
        params: { path: { slug }, query: { locale } },
      }),
      LegalPageSchema,
    );
  } catch (error) {
    if (error instanceof ApiFailure) {
      if (error.code === 'LEGAL_PAGE_NOT_FOUND') return null;
      if (error.code === 'MAINTENANCE')
        redirect(maintenanceHref(LEGAL_ROUTES[slug], locale === 'hi'));
    }
    throw error;
  }
}
