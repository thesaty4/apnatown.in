# FE Spec: <Feature ID> — <Feature name>

- **Feature ID:** <e.g. CK2>
- **Area:** `apps/web/src/features/<area>`
- **BE spec:** `specs/<module>/be/<id>-<slug>.md`
- **Role(s):** <from docs/design-context/01-feature-inventory.md>
- **Status:** draft | ready for dev | in review | done

## 1. Summary

One paragraph: what screen/component this is and why, referencing the
relevant `docs/design-context/01-feature-inventory.md` row.

## 2. Route / URL contract

- **Route:** `/path/:param`
- **Query params (if Explore/Search):** list each, with allowed
  values; note shareable-URL and Back/scroll-restoration behaviour
  (`domain-catalog-search.instructions.md`) if applicable.

## 3. UX states (all five required — X7)

| State | Behaviour |
|---|---|
| Default | |
| Skeleton | |
| Empty | |
| Error + retry | |
| No-permission | |

## 4. Components used

List `packages/ui` components from `docs/design-context/05-design-system.md` this screen
uses; note any new component this spec requires adding there.

## 5. Data and API calls

Follow the mandatory [React Query API integration contract](../_foundation/frontend-shared.md#api-integration-with-react-query).
When copying this template into a module's `fe/` folder, update that link
to `../../_foundation/frontend-shared.md#api-integration-with-react-query`.

- BE endpoints and typed operations; server-only reads versus React Query
  hooks for client reads, cursor pagination and mutations.
- Query-key namespace and response-affecting inputs, identity/business/scope,
  URL filters; freshness, garbage collection and refetch/retry policy.
- SSR prefetch/hydration where client-owned data is server-rendered.
- Mutation invalidation/update targets, permitted optimistic rollback,
  idempotency and session/scope cleanup.
- Loading, empty, error/permission and offline handling; local form state
  remains separate from API server-state.

## 6. i18n and accessibility

- EN/HI keys needed (new keys go in both catalogs).
- Keyboard interaction pattern (dialog/combobox/tabs/carousel/reels —
  see `i18n-a11y.instructions.md`).
- Long-Hindi-text check.

## 7. Acceptance criteria (Given/When/Then)

```
Given <context>
When <action>
Then <outcome>
```

## 8. Performance

Any lazy-loading, pagination, or data-saver behaviour specific to this
screen.

## 9. Verification plan

Follow the [verification policy](../../AGENTS.md#4-hard-limits-non-negotiable);
adjust the relative link when copying this template. No automated test files.

- Existing non-test commands and expected results: <list>
- Manual component and accessibility checks: <list>
- React Query cases: shared contract acceptance checks relevant to these
  operations (errors, key isolation, hydration, invalidation/rollback, retries).
- Manual browser journey(s): <reference J-number from
  `docs/design-context/03-user-flows.md` if applicable>
- Screenshots required: 360px + desktop, light + dark, EN + HI.
- Unverified scenarios and evidence limitations: <list>

## 10. Open questions

Anything ambiguous — record here and in
`docs/design-context/11-open-issues-and-assumptions.md` instead of
guessing.
