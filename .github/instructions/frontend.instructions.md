---
description: "Frontend screens, React Query API integration, URL state, design tokens and client security."
applyTo: "apps/web/**,packages/ui/**"
---

# Frontend

Builds on `.github/copilot-instructions.md`. Design tokens/components:
`docs/design-system.md`. i18n/a11y detail:
`i18n-a11y.instructions.md`.

## Architecture

- Feature-based folders: `apps/web/src/features/<area>` (cart, checkout,
  orders, explore, reels, admin, ...), each owning its own components,
  hooks, and API calls — no feature imports another feature's internals;
  share through `packages/ui`/`packages/shared`.
- API access only through a typed client generated from the OpenAPI
  contract (`backend.instructions.md`); never hand-write `fetch` calls
  scattered through components.
- **React Query is required:** use `@tanstack/react-query` for every
  client-side API read/mutation, through feature query/mutation hooks.
  Server-only reads stay in Server Components; do not make routes client-only.
  Follow the [shared API contract](../../specs/_foundation/frontend-shared.md#api-integration-with-react-query)
  for provider/hydration, typed errors, scoped keys, retries, invalidation,
  privacy and tests. No `useEffect` fetching, SWR or duplicate API-response
  stores; keep form/UI and URL state separate.
- Pages/routes stay thin; business logic (filter resolution, cart
  totals display) lives in hooks/services, is unit-tested.

## Five UX states (X7)

Every screen implements: **default, skeleton, empty, error+retry,
no-permission**. Use `packages/ui` skeleton/empty/error/no-permission
components (`docs/design-system.md`) — don't build bespoke ones.

## Tokens and shared components

- Never hard-code colours/spacing/radii — import tokens from
  `packages/ui`.
- Reuse the Services filter component (EX6) on Search and category
  pages; reuse shop/product/service cards, don't fork per screen.

## State and URL rules

- Explore state is a **shareable URL** (`/explore?tab=...&category=...`);
  browser Back restores the previous page and scroll position (EX9).
- Explore and Search keep **separate** filter state (BR-15,
  `domain-catalog-search.instructions.md`) — never share one store.
- Never alias event handlers by assignment (e.g.
  `const onClick = this.handleClick` losing `this`/closures); bind or
  use arrow functions explicitly.
- Don't re-render inputs while typing — keep form state local
  (`react-hook-form`) and commit to shared/query state on blur/submit,
  not on every keystroke.
- Esc is handled by the **top-most layer only** (dialog over sheet over
  page) — don't attach a global Esc handler per component.
- Ignore pointer capture on interactive elements inside custom
  drag/carousel handling, so clicks/taps on buttons inside them still
  work.
- Reels/deep-link ranking is **frozen per session**; a deep link
  (`/videos/:id`) resolves by id against the frozen list, not a live
  re-ranked feed (RL9).

## Performance budgets

- LCP < 2.5s on mid-range Android/slow 3G/4G; lazy-load below-the-fold
  media; paginate lists with a "Load more" fallback (not infinite
  scroll only); respect data-saver (RL3 "tap to play").
- Code-split by route/feature; avoid pulling admin-only bundles into
  the customer app.

## Client security

- Never store tokens in `localStorage`; rely on httpOnly session
  cookies (`security.instructions.md`).
- Render user-generated content as text; never `dangerouslySetInnerHTML`
  with unsanitized input.
- Rebuild video embeds only from server-provided, already-allow-listed
  embed URLs — never construct an iframe from a raw client-held link.
