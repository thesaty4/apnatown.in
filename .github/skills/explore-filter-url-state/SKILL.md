---
name: explore-filter-url-state
description: "Recipe for the Explore/Search filter component: shareable URL state, Back/scroll restoration, per-screen independent state, and the reusable services subcategory component."
---

# Explore/Search filter URL state

Covers EX1-EX11, SR7, SR10 (`domain-catalog-search.instructions.md`).

## Steps

1. Model filter state as URL query params, not component state:
   `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting`.
2. Each filter control reads its current value from the URL (via a
   shared `useExploreFilters()`/`useSearchFilters()` hook — **two
   separate hooks/stores**, never shared, per BR-15) and writes
   back via router push/replace.
3. On tab switch, keep each tab's filters in its own URL namespace so
   switching back restores them (EX3).
4. On browser Back, restore both the previous filter state **and**
   scroll position (EX9) — store scroll position keyed by the full URL
   before navigating away.
5. Build the Services filter (EX6) as one reusable component: category
   multi-select + subcategory multi-select grouped under category
   headings, counts, Select all/Clear per group, inner search above 8
   options, OR logic, removing a category removes its subcategories,
   removable chips + Clear all. Reuse it unmodified on Search (Services
   tab) and service category pages (`solid-dry-design.instructions.md`).
6. Render counts live per filter option based on the current combination
   of other active filters. Load client results/counts with React Query
   through the typed API client, following the [shared API contract](../../../specs/_foundation/frontend-shared.md#api-integration-with-react-query).
   Derive distinct Explore/Search keys from validated URL state and
   location context; cancel superseded reads and reset cursor pages when
   filters change. Query cache is not the filter source of truth.

## Skeleton

```ts
function useExploreFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') ?? 'products';
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    router.push(`/explore?${next.toString()}`, { scroll: false });
  };
  return { tab, params, setFilter };
}
```

## Checklist

- [ ] Filters live in the URL, not only component state.
- [ ] Explore and Search use separate hooks/stores.
- [ ] Back restores filters and scroll position.
- [ ] Services filter component reused unmodified across screens.
- [ ] Counts reflect the current combined filter state.
- [ ] React Query keys isolate each screen/filter context; late responses
  cannot replace current results or counts.
