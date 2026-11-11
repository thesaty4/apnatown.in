# Design Context Pack

- **Purpose:** Everything about the finished ApnaTown design, in files that GitHub Copilot can read. It is the single source of truth for specs and code.
- **Audience:** Copilot agents and developers
- **Last updated:** 2026-11-10

| File | Contents |
|---|---|
| 00-product-summary.md | Vision, roles, PRD decisions, phases |
| 01-feature-inventory.md | 206 features with IDs `F-<AREA>-NNN`, roles, priority |
| 02-screen-inventory.md | 105 screens with IDs, production routes, states, features, screenshot names |
| 03-user-flows.md | 14 flows (J1-J14) with diagrams |
| 04-design-tokens.json | Exact tokens (light, dark, typography, layout) |
| 05-design-system.md | Visual language and accessibility |
| 06-component-catalogue.md | Every component with props, variants, states |
| 07-state-machines-and-business-rules.md | 16 state machines, BR-01..22, formulas, validation |
| 08-permissions-matrix.md | Roles, modules, admin scoping, navigation per role |
| 09-content-and-i18n.md, 09a-i18n-en-hi.json | Tone, formats, microcopy, notification templates, 927 EN/HI strings |
| 10-sample-data.json | Padrauna sample data (fictional) |
| 11-open-issues-and-assumptions.md | Assumptions, conflicts, open questions |
| screenshots/ | 316 reference images: `m-<role>-<view>.jpg` (390px), `d-<role>-<view>.jpg` (1280px), dark and Hindi samples, `*-overlay-*` states |
| reference/apnatown-prototype.html | The runnable design. Open in a browser; the Demo button switches role, language, theme and simulated states |
| reference/prototype-source/ | Complete source (JS modules, `style.css`) of the prototype: the exact visual and behavioural reference |

Rule: when a document and the prototype disagree, the prototype wins; log the conflict in file 11.
Validate this pack: `node scripts/validate-design-pack.mjs`.
