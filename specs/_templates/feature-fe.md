# FE Spec: <Feature ID> — <Feature name>

- **Feature ID:** <e.g. CK2>
- **Area:** `apps/web/src/features/<area>`
- **BE spec:** `specs/<module>/be/<id>-<slug>.md`
- **Role(s):** <from docs/FEATURE_INVENTORY.md>
- **Status:** draft | ready for dev | in review | done

## 1. Summary

One paragraph: what screen/component this is and why, referencing the
relevant `docs/FEATURE_INVENTORY.md` row.

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

List `packages/ui` components from `docs/design-system.md` this screen
uses; note any new component this spec requires adding there.

## 5. Data and API calls

Which BE endpoint(s) (link the BE spec), loading/caching behaviour
(TanStack Query keys), optimistic updates if any.

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

## 9. Test plan

- Component tests: <list>
- Playwright journey(s): <reference J-number from docs/PROJECT.md if
  applicable>
- Screenshots required: 360px + desktop, light + dark, EN + HI.

## 10. Open questions

Anything ambiguous — record here and in `docs/PROJECT.md` "Open
questions" instead of guessing.
