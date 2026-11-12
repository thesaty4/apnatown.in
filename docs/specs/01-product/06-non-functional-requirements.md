# Non-functional requirements

## Contents

- [Performance budgets](#performance-budgets)
- [Availability/recovery/capacity](#availabilityrecoverycapacity)
- [Accessibility/responsive/i18n](#accessibilityresponsivei18n)
- [Security and privacy](#security-and-privacy)
- [Compatibility and operations](#compatibility-and-operations)
- [Completion gates](#completion-gates)

## Performance budgets

| Measure | Target | Condition |
|---|---|---|
| LCP | <2.5 s | p75 on slow 4G, mid-range Android, representative P0 routes. |
| INP | <200 ms | p75 on same device/network profile. |
| CLS | <0.1 | p75 including media/font loading and Hindi strings. |
| Route JavaScript | approximately 170 KB gzip | Measure per route. |
| TTFB | <=800 ms p75 (provisional) | Public SSR routes on mobile; confirm Q-16. |
| API reads | p95 <300 ms | Production-like Padrauna traffic. |
| API writes | p95 <600 ms | Include database transaction; async provider delivery separately measured. |
| Availability | 99.5% launch objective | Endpoint set/exclusions to be defined before production. |
| Lists/feeds | All paginated; cursor/keyset for feeds and high-volume stable order. | No unbounded responses. |

## Availability/recovery/capacity

| Dimension | Provisional target | Status |
|---|---|---|
| RPO | <=15 minutes | Assumption; validate with backup/replication plan (Q-16). |
| RTO | <=4 hours | Assumption; validate with provider and restore exercise (Q-16). |
| Padrauna planning load | 10,000 monthly active customers; 50 sustained API req/s, 150 short peak; 500 active businesses; 100 concurrent riders. | Planning assumption only; forecast absent (Q-16). |
| 10-city planning load | 100,000 monthly active customers; 500 sustained req/s; 5,000 active businesses; 1,000 concurrent riders. | Linear test scenario, not commitment (Q-16). |
| Recovery | Encrypted automated backups, point-in-time restore where supported, periodic restore test and named operator. | Cadence/retention/provider awaits Q-13. |
| Degraded dependencies | Keep public cached shell readable; show offline/error/retry; never fake successful payment/order/OTP. | Provider-specific budgets to P09. |

## Accessibility/responsive/i18n

- WCAG 2.2 AA; keyboard/focus order; visible 3px focus ring; >=48px touch targets; focus trap and restore in overlays; Esc closes topmost; arrow keys in listbox/combobox/tabs/carousel/viewer/reels; live result counts; `aria-describedby` errors; skip link.
- Status = icon + text + colour (BR-22); reduced motion respects system preference; safe-area insets.
- Mobile baseline 360 px; tablet >=600 px; desktop >=900 px; max width 1200 px; grids 4/8/12 columns. Tables become labeled cards on mobile; filters use sheet/tablet bar/desktop sidebar.
- Every user-facing string has EN and HI; 927 source pairs; ICU placeholders/plurals; no sentence concatenation; Hindi may be ~30% longer and must wrap without fixed-height clipping. Admin translations are incomplete and require native review (A-02/A-12).
- Visual regression uses 390 px/1280 px plus dark/Hindi reference screenshots and exact [tokens](../../design-context/04-design-tokens.json)/[prototype CSS](../../design-context/reference/prototype-source/style.css).

## Security and privacy

- OWASP ASVS/Top 10-aligned; parameterized SQL; explicit DTO allowlists; no mass assignment; authorize role+ownership+city/area+module on every endpoint.
- OTP/codes server-only, rate limited, cooldown enforced; secure httpOnly/SameSite cookies; CSRF for state changes; no token/PII in localStorage.
- User content rendered as text unless sanitized. Embeds allow-listed/rebuilt; uploads content/size checked and EXIF/GPS stripped; CSV formula neutralization/type and row limits; webhooks signed/idempotent.
- Purpose/timestamp consent, opt-out-aware communications, export/delete, least-privilege KYC access. Redact secrets, codes, full phone, payment and raw KYC from logs.
- Sensitive changes audit actor/time/before/after; structured logs carry correlation IDs.
- Retention, residency and deletion semantics remain open (Q-05/Q-13); do not invent retention.

## Compatibility and operations

| Area | Requirement |
|---|---|
| Devices | Modern Android Chrome baseline; responsive tablet/desktop. Exact version floor needs P09 confirmation. |
| Network | Slow 3G/4G and offline; lazy media, smaller assets, no autoplay in data saver. |
| Observability | Structured/redacted logs, correlation ID, health, latency/error rate, queue lag, payment/webhook failure, OTP delivery outcome and backup/restore alerts; thresholds to P09. |
| Integrity | Integer paise, UTC, server-side state machines, idempotency for order/payment/refund/message/webhook, optimistic locking stock/status, outbox for notifications. |
| SEO | Readable routes, metadata, canonical/robots, JSON-LD, sitemap; facet policy in P07. |
| Legal | Terms/privacy/refund content requires legal review; no fabricated legal copy (Q-12). |

## Completion gates

All 206 feature sections and trace references are in the 22 area docs and aggregate matrix in [01-overview-and-scope.md](./01-overview-and-scope.md). P03 maps logical concepts to PostgreSQL tables, P04 maps module handles to endpoints/DTOs, P10 maps acceptance scenarios to manual evidence and existing non-test checks under the [verification policy](../../../.github/instructions/testing.instructions.md). Those prompts are not executed in P01.
