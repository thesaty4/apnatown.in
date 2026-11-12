import {
  EXPLORE_TABS,
  ExploreQuerySchema,
  type ExploreSort,
  type ExploreTab,
} from '@apnatown/shared/search';

export type ExploreFilters = {
  tab: ExploreTab;
  category?: string;
  verified: boolean;
  sort: ExploreSort;
};
type FilterKey = 'category' | 'verified' | 'sort';
const FILTER_KEYS: readonly FilterKey[] = ['category', 'verified', 'sort'];
const filterSchema = ExploreQuerySchema.omit({ cursor: true, limit: true });

/** Services has no newest sort and Products no verified filter (spec per-tab lists). */
export const sortsFor = (tab: ExploreTab): ExploreSort[] =>
  tab === 'services' ? ['relevance'] : ['relevance', 'newest'];
export const hasVerified = (tab: ExploreTab) => tab !== 'products';

/** Reject unsupported or ambiguous links rather than silently broadening results. */
export function readFilters(params: URLSearchParams): ExploreFilters | null {
  const allowed = new Set<string>([
    'tab',
    ...FILTER_KEYS,
    ...EXPLORE_TABS.flatMap((tab) => FILTER_KEYS.map((key) => `${tab}.${key}`)),
  ]);
  for (const key of params.keys())
    if (!allowed.has(key) || params.getAll(key).length !== 1) return null;

  const active = parseFilters(
    Object.fromEntries([...params].filter(([key]) => !key.includes('.'))),
  );
  if (!active) return null;
  for (const tab of EXPLORE_TABS) {
    const saved = FILTER_KEYS.flatMap((key) =>
      params.has(`${tab}.${key}`) ? [[key, params.get(`${tab}.${key}`)]] : [],
    );
    if (saved.length) {
      if (tab === active.tab || !parseFilters({ ...Object.fromEntries(saved), tab }))
        return null;
    }
  }
  return active;
}

function parseFilters(input: unknown): ExploreFilters | null {
  const parsed = filterSchema.safeParse(input);
  if (!parsed.success) return null;
  const { tab, category, sort, verified } = parsed.data;
  if (
    !sortsFor(tab).includes(sort) ||
    (!hasVerified(tab) && verified === 'true')
  )
    return null;
  return {
    tab,
    ...(category ? { category } : {}),
    sort,
    verified: verified === 'true',
  };
}

function stashes(params: URLSearchParams, skip: readonly ExploreTab[]) {
  const out: [string, string][] = [];
  for (const tab of EXPLORE_TABS)
    for (const key of FILTER_KEYS) {
      const value = params.get(`${tab}.${key}`);
      if (!skip.includes(tab) && value) out.push([`${tab}.${key}`, value]);
    }
  return out;
}

/** Active-tab filter change; empty/default values are removed from the URL. */
export function withFilters(
  params: URLSearchParams,
  patch: Partial<Record<FilterKey, string | null>>,
) {
  const filters = readFilters(params);
  if (!filters) throw new Error('INVALID_EXPLORE_URL');
  const next = { ...filters, ...patch };
  const out = new URLSearchParams({ tab: filters.tab });
  if (next.category) out.set('category', String(next.category));
  if (String(next.verified) === 'true') out.set('verified', 'true');
  if (next.sort && next.sort !== 'relevance')
    out.set('sort', String(next.sort));
  for (const [key, value] of stashes(params, [filters.tab]))
    out.set(key, value);
  return out;
}

/**
 * Tab switch keeps each tab's filters independent: the current tab's filters
 * are stashed under `<tab>.` and the target tab's stash is restored.
 * Products and Shops share product categories, so a category carries over.
 */
export function withTab(params: URLSearchParams, tab: ExploreTab) {
  const current = readFilters(params);
  if (!current) throw new Error('INVALID_EXPLORE_URL');
  if (current.tab === tab) return new URLSearchParams(params);
  const out = new URLSearchParams({ tab });
  for (const key of FILTER_KEYS) {
    const value = params.get(`${tab}.${key}`);
    if (value) out.set(key, value);
  }
  const shared = current.tab !== 'services' && tab !== 'services';
  const visited = FILTER_KEYS.some((key) => params.has(`${tab}.${key}`));
  if (!visited && shared && current.category)
    out.set('category', current.category);
  for (const [key, value] of stashes(params, [tab, current.tab]))
    out.set(key, value);
  if (current.category) out.set(`${current.tab}.category`, current.category);
  if (current.verified) out.set(`${current.tab}.verified`, 'true');
  // Keep the default as a visited marker so a cleared category stays cleared.
  out.set(`${current.tab}.sort`, current.sort);
  return out;
}
