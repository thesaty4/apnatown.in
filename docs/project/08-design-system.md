# 08 — Design System

**Purpose:** Brand, tokens, typography, motion, and the full component list — the canonical design-system reference.
**Audience:** Frontend/design engineers, `developer-frontend`, `packages/ui` maintainers.
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [`docs/design-system.md`](../design-system.md) (short pointer to this file) · [04-business-rules.md](./04-business-rules.md) (BR-22) · [09-content-i18n-notifications.md](./09-content-i18n-notifications.md) · [`frontend.instructions.md`](../../.github/instructions/frontend.instructions.md)
**Last updated:** 2026-11-09
**Owner:** Design

> This is now the **single canonical** design-system file.
> `docs/design-system.md` (used by several `.github/instructions/*`
> `applyTo` paths) is a short pointer here — update tokens/components in
> **this** file only.

## 1. Brand

Wordmark "ApnaTown" (map-pin + shop-awning mark), with full / icon /
mono / on-dark variants.

## 2. Colour tokens

All `Dark` values are provisional and need an AA-contrast pass before
launch `[OPEN — Q-19]`. Text must be at least 4.5:1 contrast against
its background (WCAG 2.2 AA).

| Token | Light | Dark |
|---|---|---|
| `color.primary` | `#C2410C` | `#FB923C` |
| `color.primary-soft` | `#FFEDD5` | — |
| `color.secondary` | `#0F766E` | `#2DD4BF` |
| `color.accent` | `#F59E0B` | — |
| `color.success` | `#15803D` | — |
| `color.warning` | `#B45309` | — |
| `color.error` | `#B91C1C` | — |
| `color.info` | `#1D4ED8` | — |
| `color.offer` | `#A3166B` | — |
| `color.star` | `#F59E0B` | — |
| `color.background` | `#FFFBF5` | `#14110D` |
| `color.surface` | `#FFFFFF` | `#1E1913` |
| `color.surface-2` | `#FAF4EA` | — |
| `color.border` | `#E7DFD3` | — |
| `color.text` | `#1F1A14` | `#F6EFE6` |
| `color.text-2` | `#5A5045` | — |
| `color.muted` | `#6F6457` | — |

### Status colours (BR-22: always icon + text, never colour alone)

| Order status | Colour | Approval status | Colour |
|---|---|---|---|
| placed | `#1D4ED8` | pending | `#B45309` |
| accepted | `#0F766E` | approved | `#15803D` |
| preparing | `#B45309` | rejected | `#B91C1C` |
| ready | `#6D28D9` | suspended | `#6D28D9` |
| out for delivery | `#C2410C` | inactive | `#57534E` |
| delivered | `#15803D` | | |
| cancelled | `#B91C1C` | | |
| refunded | `#475569` | | |

## 3. Typography

Poppins (headings, prices) + Noto Sans + Noto Sans Devanagari.

| Style | Mobile | Desktop |
|---|---|---|
| display | 32 | 48/56 |
| h1 | 28 | — |
| h2 | 22 | — |
| h3 | 18 | — |
| body | 16/24 | — |
| small | 14 | — |
| caption | 12.5 | — |
| button | 16/600 | — |
| price | 18/700, `₹` prefix, strikethrough MRP | — |

## 4. Spacing, radius, elevation, grid

- Spacing: 4 / 8px scale.
- Radius: 6 / 10 / 14 / 20 / pill.
- Shadows: 3 levels (no hard-offset shadows in this app).
- Focus ring: 3px. Touch target: 48px minimum.
- Grid: 4 / 8 / 12 columns, max container 1200px, breakpoints 600 and
  900. Respect safe-area insets (notch/home-indicator).

## 5. Motion

- Durations: 120 / 220 / 380ms. Easing: `cubic-bezier(.2,.8,.2,1)`.
- Micro-interactions: add-to-cart bump, heart animation, star-rating
  input, pulse on live status, OTP success check.
- Every animation has a `prefers-reduced-motion` alternative
  (`i18n-a11y.instructions.md`).

## 6. Components

Purpose, key props, states and do/don't live with the component in
`packages/ui`; this is the authoritative **list**.

- **Buttons:** primary, secondary, outline, tertiary, destructive,
  icon, FAB, sticky Call/WhatsApp/Directions bar.
- **Inputs:** text, phone (+91), 6-box OTP, search, textarea, select,
  searchable combobox, date, time-range, toggle, checkbox, radio, chip
  input, quantity stepper, price, uploader, drag/arrow media sorter.
- **Chips, pills** (category and subcategory), **badges** (status,
  offer, verified, featured, new, open/closed).
- **Rating:** display, input, breakdown, review card.
- **Cards:** business, **shop card (image on top)**, product,
  **service card**, offer, category tile, order, delivery, review,
  notification, KPI, bookmark, admin collapsible card.
- **Navigation:** bottom tabs per role, top bar, location bar, sidebar,
  breadcrumbs, tabs, segmented switch, pagination, stepper.
- **Overlays:** bottom sheet, modal, dialog, popover, toast, tooltip,
  confirmation dialog (names the impact — SA2), action sheet, share
  sheet.
- **Data display:** tables that collapse to labelled cards, timeline,
  accordion, key-value, charts (bar, line, donut, sparkline,
  graph chart with an accessible table alternative — SA1; do not specify Candle/OHLC.
- **Feedback:** skeleton, progress, spinner, empty/error/no-permission/
  success states, offline banner.
- **Map components:** schematic map with pins, clusters, you-are-here,
  radius, draggable pin, polygon editor with draggable corners.
- **QR card** with logo.
- **Media:** carousel with video thumbnails and play badge, gallery
  grid with lightbox, **full-screen viewer**, YouTube/Instagram embed
  card with fallback, **reels player**, **follow button** states,
  **linked-product strip**, video grid, **media-consent toggle**,
  **heart button**.
- **Filter panel:** sheet / sidebar / tablet bar, including the
  **subcategory multi-select** (EX6).
- Notification bell; language/theme/role switchers; cookie and
  WhatsApp opt-in components; permission matrix.

## 7. Do / don't

- **Do** reuse the Explore Services filter component (EX6) everywhere
  it appears (Search, category pages) — never fork it.
- **Do** show every status with icon + text, never colour alone
  (BR-22).
- **Don't** truncate Hindi labels — wrap or reflow
  ([09-content-i18n-notifications.md](./09-content-i18n-notifications.md)).
- **Don't** use hard-offset shadows; use the 3-level soft-shadow scale.
