# docs/project/ — README

**Purpose:** The ID scheme, file ownership, and how to add or deprecate a feature in this knowledge base.
**Audience:** Everyone who edits `docs/project/*.md`.
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index)
**Last updated:** 2026-11-09
**Owner:** Product

## 1. ID scheme (stable, never reused)

| Prefix | Meaning | Owning file |
|---|---|---|
| `X1, AU1, HM1, LC1, EX1, SR1, PF1, PD1, SV1, OF1, CK1, OR1, RV1, EG1, RL1, NT1, AC1, VD1, PV1, RD1, AD1, SA1` | Feature IDs, one per area | [03-feature-catalog.md](./03-feature-catalog.md) |
| `BR-01..` | Business rule | [04-business-rules.md](./04-business-rules.md) |
| `R-01..` | Role | [02-users-roles-permissions.md](./02-users-roles-permissions.md) |
| `ST-<name>` | Status/lifecycle model | [05-domain-model.md](./05-domain-model.md) |
| `J1..` | User journey | [06-user-journeys.md](./06-user-journeys.md) |
| `S-<area>-<n>` | Screen | [07-screens-routes-sitemap.md](./07-screens-routes-sitemap.md) |
| `D-01..` | Decision | [12-decisions-assumptions-open-questions.md](./12-decisions-assumptions-open-questions.md) |
| `A-01..` | Assumption `[ASSUMPTION]` | [12-decisions-assumptions-open-questions.md](./12-decisions-assumptions-open-questions.md) |
| `Q-01..` | Open question `[OPEN]` | [12-decisions-assumptions-open-questions.md](./12-decisions-assumptions-open-questions.md) |

**Never reuse or renumber an ID**, even if the feature/rule/screen it
named is deprecated — see "Deprecating" below. Always cross-link by ID
(for example "see BR-05, ST-order-delivery, S-CK-2").

## 2. File ownership

Each file has exactly one owning concern (DRY — define a fact once,
link to it from everywhere else):

- **03** owns feature behaviour. **04** owns rules. **05** owns
  entities/statuses. **06** owns journeys. **07** owns
  screens/routes. **08** owns design tokens/components. **09** owns
  copy/i18n/notifications. **10** summarizes NFRs and links out for
  the enforced security detail (`.github/instructions/security.instructions.md`,
  `docs/security/security-guidelines.md`). **11** owns settings/flags/
  integrations. **12** owns decisions/assumptions/open questions.
  **13** is the cross-reference index — it doesn't restate anything,
  only maps IDs across the other files.

If you find yourself copying a table or paragraph into a second file,
stop and link instead.

## 3. How to add a feature

1. Pick the next unused ID in its area (e.g. the next `EX` number).
2. Add a row to [03-feature-catalog.md](./03-feature-catalog.md) in
   the right area table.
3. Add a row to [13-traceability-matrix.md](./13-traceability-matrix.md)
   table 1 (and update tables 2/3 if it introduces a new BR/journey
   link).
4. Note any new rule in [04-business-rules.md](./04-business-rules.md)
   (next `BR-xx`), any new status in
   [05-domain-model.md](./05-domain-model.md), any new screen in
   [07-screens-routes-sitemap.md](./07-screens-routes-sitemap.md).
5. Add any new EN/HI copy to
   [09-content-i18n-notifications.md](./09-content-i18n-notifications.md)
   (and the actual translation catalogs — see
   `.github/skills/i18n-en-hi/SKILL.md`).
6. Run `node scripts/validate-project-docs.mjs` before opening the PR.

## 4. How to deprecate a feature

**Never delete an ID.** Mark its row `Deprecated` in
[03-feature-catalog.md](./03-feature-catalog.md) and
[13-traceability-matrix.md](./13-traceability-matrix.md) with a short
reason and, if relevant, the ID that replaces it. Leave it in the
history so old links and specs still resolve to something meaningful.

## 5. Update docs in the same PR as the code

Any PR that changes behaviour covered by a `docs/project/*.md` file
must update that file in the **same PR** — not as follow-up work. This
is checked by `code-reviewer` and by
`scripts/validate-project-docs.mjs` (which can't check behaviour, only
structure — the review step is what catches a stale description).
