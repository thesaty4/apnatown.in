---
name: ui-component
description: Recipe for building one frontend screen/component with React Query API integration, the five UX states, design tokens, and i18n/a11y built in from the start.
---

# UI component

Use when implementing a FE spec (`frontend.instructions.md`,
`i18n-a11y.instructions.md`, `docs/design-system.md`).

## Steps

1. Check `docs/design-system.md` for an existing `packages/ui`
   component that fits; extend it rather than forking.
2. Build the container (data/state) separate from the presentational
   component.
3. Implement all five UX states: default, skeleton, empty, error+retry,
   no-permission (X7) using the shared skeleton/empty/error/
   no-permission components.
4. Wire every client API operation with `@tanstack/react-query` over the
   typed API client, following the [shared API contract](../../../specs/_foundation/frontend-shared.md#api-integration-with-react-query):
   - Reuse the shared provider; define feature keys/options and
     `useQuery`/`useInfiniteQuery`/`useMutation` hooks, not component fetches.
   - Preserve typed errors and cancellation; specify freshness/retries,
     invalidation and any permitted optimistic rollback.
   - Keep server-only reads in Server Components; hydrate client-owned
     SSR data rather than issuing a duplicate initial request.
   - Keep form/UI state local. Explore/Search filters stay in their own
     URLs and query namespaces (`frontend.instructions.md`).
5. Add EN+HI translation keys (`<feature>.<screen>.<element>` naming);
   verify wrapping with the longer Hindi strings.
6. Keyboard and ARIA pass: tab order, focus ring, roles/labels,
   `prefers-reduced-motion` (`i18n-a11y.instructions.md`).
7. Verify in light and dark themes.
8. Write component tests including relevant shared API acceptance cases;
   take screenshots (360px + desktop, light +
   dark, EN + HI) for the PR.

## Skeleton

```tsx
export function ShopCard({ shopId }: { shopId: string }) {
  const { data, isLoading, isError, refetch } = useShop(shopId);
  if (isLoading) return <ShopCardSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return <EmptyState messageKey="shopCard.notFound" />;
  return (
    <Card>
      <Image src={data.imageUrl} alt={t('shopCard.imageAlt', { name: data.name })} />
      <StatusBadge status={data.status} /> {/* icon + text, never colour alone */}
      <Text>{data.name}</Text>
    </Card>
  );
}
```

## Checklist

- [ ] Reuses a `packages/ui` component or is a justified new one.
- [ ] All five UX states implemented.
- [ ] Client API operations use React Query and pass the relevant
  [integration acceptance cases](../../../specs/_foundation/frontend-shared.md#api-integration-acceptance-and-tests).
- [ ] EN+HI keys added, Hindi wrapping checked.
- [ ] Keyboard-operable, visible focus, reduced-motion respected.
- [ ] Verified in light and dark.
- [ ] Status shown with icon + text.
