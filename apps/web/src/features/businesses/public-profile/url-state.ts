import { CatalogSlugSchema } from '@apnatown/shared/catalog';

/**
 * S-CUST-06/07 shareable profile URL state, independent of Explore/Search
 * filter state (BR-15). Readable params: `?tab=listings&type=services&cat=
 * wedding-events&sub=dj-sound`. Defaults are omitted from the URL.
 */
export const PROFILE_TABS = [
  'about',
  'listings',
  'offers',
  'gallery',
  'videos',
  'reviews',
  'contact',
] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];
export type ProfileSegment = 'products' | 'services';

export type ProfileUrlState = {
  tab: ProfileTab;
  /** Explicit Products/Services segment; absent means the kind default. */
  type?: ProfileSegment | undefined;
  /** Services category slug (globally unique). */
  cat?: string | undefined;
  /** Products: subcategory slug. Services: subcategory slug scoped by `cat`. */
  sub?: string | undefined;
};

const slug = (value: string | null) =>
  value !== null && CatalogSlugSchema.safeParse(value).success
    ? value
    : undefined;

export function readProfileState(params: URLSearchParams): ProfileUrlState {
  const tab = params.get('tab');
  const type = params.get('type');
  return {
    tab: PROFILE_TABS.includes(tab as ProfileTab) ? (tab as ProfileTab) : 'about',
    type: type === 'products' || type === 'services' ? type : undefined,
    cat: slug(params.get('cat')),
    sub: slug(params.get('sub')),
  };
}

/** Rewrites only profile-owned params; unrelated params are preserved. */
export function profileSearch(
  params: URLSearchParams,
  state: ProfileUrlState,
): string {
  const next = new URLSearchParams(params);
  for (const key of ['tab', 'type', 'cat', 'sub', 'filter']) next.delete(key);
  if (state.tab !== 'about') next.set('tab', state.tab);
  if (state.tab === 'listings') {
    if (state.type) next.set('type', state.type);
    if (state.cat) next.set('cat', state.cat);
    if (state.sub) next.set('sub', state.sub);
  }
  const query = next.toString();
  return query ? `?${query}` : '';
}
