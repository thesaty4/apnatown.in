---
applyTo: "apps/api/src/modules/{catalog,products,services,search}/**,apps/web/src/features/{explore,search}/**"
---

# Domain: Catalog and search

Builds on `backend.instructions.md`/`frontend.instructions.md`.
Rules: `docs/project/04-business-rules.md` (BR-07, BR-08, BR-15,
BR-18). Covers `catalog`, `products`,
`services`, `search`, and the Explore/Search frontend.

## Fixed main categories, subcategory suggestions (BR-07)

- Main categories are created/edited **only by `super_admin`**
  (SA8) — no other role can create one, server-enforced, not just
  UI-hidden.
- Vendors/providers **suggest** subcategories (VD6); they enter
  `pending` and require admin approval (AD6): approve, reject with
  reason, or merge into an existing subcategory. Duplicate detection
  (fuzzy match against existing names/keywords) must warn before
  submission and again at admin review.
- Each **service** has **exactly one** subcategory (SV8, BR-08);
  products use category + subcategory (not single-valued the same way).
- A provider can be "expert in" **several** subcategories (many-to-many,
  `docs/project/05-domain-model.md` data relationships) — don't conflate
  this with a service's single subcategory.

## Explore URL contract and Back/scroll (EX8-EX9)

- Filter state lives in the URL:
  `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting`
  — every filter control reads/writes query params, never only
  component state.
- Browser Back restores the previous page's filters **and scroll
  position** (EX9); don't reset scroll on tab/filter navigation.
- Per-tab filters are remembered when switching tabs (EX3) within one
  Explore session.

## Services subcategory multi-select (EX6)

- Category multi-select + subcategory multi-select grouped under
  category headings; OR logic within and across selections; removing a
  category removes its subcategories; inner search appears above 8
  options per group; disabled (not hidden) when a group's count is 0;
  this exact component is reused on Search (Services tab) and service
  category pages — never forked (`solid-dry-design.instructions.md`).

## Search vs. Explore filter state (SR10, BR-15)

- Search keeps its **own** filter state, entirely separate from
  Explore's — switching between Search and Explore never carries one's
  filters into the other.

## Keyword mapping (SR2, AD15, SA8)

- A keyword maps to category/subcategory/product tags (e.g. "AC" ->
  AC products + electronics shops + AC services); mappings are
  admin-managed with a preview (AD15) before saving.
- **Hindi/Hinglish/typo tolerance** (SR3): queries like "एसी" or
  "plumbr" must resolve via the same keyword-mapping table (transliteration
  /fuzzy match), not a separate hard-coded branch per language.

## Counts and per-screen filter state

- Every filter option (category, subcategory, brand, etc.) shows a live
  result **count**; counts reflect the current combination of other
  active filters, not the unfiltered total.
- Explore and Search maintain independent query-state stores
  (`frontend.instructions.md`) so neither screen's back-navigation or
  deep link corrupts the other's state.
