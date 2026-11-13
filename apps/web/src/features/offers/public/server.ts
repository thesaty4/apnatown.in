import 'server-only';
import { cache } from 'react';
import { PlacementPublicPageSchema } from '@apnatown/shared/offers';
import { createPublicServerApi } from '../../../shared/api/server';
import { resource, unwrap } from '../../../shared/api/result';

/**
 * Home hero banners (S-CUST-01). Public and location-free on the server, so a
 * short shared cache is safe; eligibility/destinations stay Offers-owned.
 */
export const readHeroBanners = cache(async () =>
  resource(async () => {
    const api = createPublicServerApi({ revalidate: 60, tags: ['promotions'] });
    return unwrap(
      await api.GET('/promotions/placements', {
        params: { query: { kind: 'homepage_banner', limit: 5 } },
      }),
      PlacementPublicPageSchema,
    );
  }),
);
