---
name: ui-component
description: Recipe for building one frontend screen/component with React Query API integration, the five UX states, design tokens, and i18n/a11y built in from the start.
---

# UI component

Use when implementing a FE spec (`frontend.instructions.md`,
`i18n-a11y.instructions.md`,
`docs/design-context/05-design-system.md`).

## Steps

1. Check `docs/design-context/05-design-system.md` for an existing `packages/ui`
   component that fits; extend it rather than forking.
   For uploads, embeds or maps, use the shared components and selected
   [media/map contract](../../../specs/_foundation/media-and-maps.md);
   never add a direct Cloudinary browser upload or a second map library.
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
   implement wrapping for longer Hindi strings.
6. Keyboard and ARIA pass: tab order, focus ring, roles/labels,
   `prefers-reduced-motion` (`i18n-a11y.instructions.md`).
7. Implement light/dark theme behavior and responsive states.
8. Invoke `verify-change` to build and fix related errors only. Do not
   launch browsers or capture screenshots during implementation; report
   runtime/UI checks as deferred.

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
  [integration acceptance cases](../../../specs/_foundation/frontend-shared.md#api-integration-acceptance-and-verification).
- [ ] EN+HI keys added, Hindi wrapping checked.
- [ ] Keyboard-operable, visible focus, reduced-motion respected.
- [ ] Light and dark behavior implemented.
- [ ] Status shown with icon + text.
