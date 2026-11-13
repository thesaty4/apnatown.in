import 'server-only';
import { cache } from 'react';
import { CatalogSlugSchema } from '@apnatown/shared/catalog';
import { PublicProviderExpertiseSchema } from '@apnatown/shared/services';
import { BusinessDiscoveryDetailSchema } from '@apnatown/shared/public-listings';
import { createPublicServerApi } from '../../../shared/api/server';
import { resource, unwrap } from '../../../shared/api/result';
import {
  currentLocale,
  noindex,
  publicPageMetadata,
} from '../../support/metadata';

export type ProfileKind = 'shop' | 'provider';

/** One request-scoped read shared by metadata and the page (no-store API). */
export const readPublicBusiness = cache(async (slug: string) => {
  if (!CatalogSlugSchema.safeParse(slug).success)
    return { kind: 'error', code: 'COMMON_NOT_FOUND' } as const;
  const api = createPublicServerApi();
  return resource(async () =>
    unwrap(
      await api.GET('/businesses/public/{slug}', {
        params: { path: { slug } },
      }),
      BusinessDiscoveryDetailSchema,
    ),
  );
});

/** Services-owned provider expertise; only approved public providers resolve. */
export const readProviderExpertise = cache(async (slug: string) => {
  const api = createPublicServerApi();
  return resource(async () =>
    unwrap(
      await api.GET('/businesses/{slug}/expertise', {
        params: { path: { slug } },
      }),
      PublicProviderExpertiseSchema,
    ),
  );
});

/** Self-canonical + index only while the approved listing resolves at its own path. */
export async function businessProfileMetadata(kind: ProfileKind, slug: string) {
  const result = await readPublicBusiness(slug);
  if (result.kind !== 'ready' || result.data.item.path !== `/${kind}/${slug}`)
    return noindex;
  const { item, description } = result.data;
  const locale = await currentLocale();
  const name = locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn;
  const metadata = await publicPageMetadata(item.path, name);
  const cover = result.data.profile.cover ?? result.data.profile.logo;
  return {
    ...metadata,
    ...(description && { description: description.slice(0, 160) }),
    openGraph: {
      title: name,
      ...(description && { description: description.slice(0, 160) }),
      ...(cover && {
        images: [{ url: cover.path, width: cover.width, height: cover.height }],
      }),
    },
  };
}
