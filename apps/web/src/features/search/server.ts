import 'server-only';
import { redirect } from 'next/navigation';
import { SearchHomeSchema } from '@apnatown/shared/search';
import { createPublicServerApi } from '../../shared/api/server';
import { ApiFailure, unwrap } from '../../shared/api/result';
import { maintenanceHref } from '../../shared/api/maintenance';
import type { Locale } from '../../shared/i18n/preferences';

/** S-CUST-01 Home composition; null when the read failed so Home can show a
 * retryable section error without blocking the rest of the page. */
export async function readSearchHome(locale: Locale) {
  try {
    return unwrap(
      await createPublicServerApi({
        revalidate: 300,
        tags: ['search-home'],
      }).GET('/search/home', { params: { query: { locale } } }),
      SearchHomeSchema,
    );
  } catch (error) {
    if (error instanceof ApiFailure) {
      if (error.code === 'MAINTENANCE')
        redirect(maintenanceHref('/', locale === 'hi'));
      return null;
    }
    throw error;
  }
}
