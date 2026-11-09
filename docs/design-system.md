# Design System

Expands `docs/PROJECT.md` section "Design and platform principles" with
concrete tokens, type scale, spacing, and the component list that
`packages/ui` must implement. Frontend code must consume tokens from
`packages/ui`, never hard-code hex values (`frontend.instructions.md`).

## 1. Brand

"ApnaTown" — pin + awning mark. Tone: warm, trustworthy, simple; see
`docs/glossary.md` for microcopy tone in English and Hindi.

## 2. Colour tokens

All `Dark` values below are provisional and need an AA-contrast pass
before launch (`TODO(verify)` — see the note after the table; not
repeated per row).

| Token | Light | Dark | Usage |
|---|---|---|---|
| `color.primary` | `#C2410C` | `#F4722B` | primary actions, brand accents |
| `color.secondary` | `#0F766E` | `#14B8A6` | secondary actions, links |
| `color.accent` | `#F59E0B` | `#FBBF24` | highlights, offer ribbons |
| `color.success` | `#15803D` | `#4ADE80` | delivered, approved |
| `color.warning` | `#B45309` | `#FBBF24` | low stock, pending |
| `color.error` | `#B91C1C` | `#F87171` | failed, rejected |
| `color.info` | `#1D4ED8` | `#60A5FA` | informational banners |
| `color.offer` | `#A3166B` | `#E879C0` | offer badges |
| `color.star` | `#F59E0B` | `#FBBF24` | rating stars |
| `color.background` | `#FFFBF5` | `#14100C` | page background |
| `color.surface` | `#FFFFFF` | `#1F1A14` | cards, sheets |
| `color.text` | `#1F1A14` | `#F5F1EA` | primary text |

**Rule:** status is always icon + text, never colour alone
(`i18n-a11y.instructions.md`). `TODO(verify)`: every dark-mode value
above is a provisional shade and must pass WCAG 2.2 AA contrast before
launch.

### Status colour + icon pairs

- Order: `placed` (info), `accepted` (info), `preparing` (warning),
  `ready` (accent), `out_for_delivery` (primary), `delivered` (success),
  `cancelled` (error), `refunded` (secondary).
- Approval: `pending` (warning), `approved` (success), `rejected`
  (error), `suspended` (error), `inactive` (text/muted).

## 3. Typography

- Headings and prices: **Poppins**.
- Body (Latin): **Noto Sans**. Body (Devanagari): **Noto Sans
  Devanagari**.
- Type scale: `display/32`, `h1/28`, `h2/22`, `h3/18`, `body/16`,
  `small/14`, `caption/12` (line-height 1.4-1.5). Hindi strings may run
  30-60% longer — components must wrap, never truncate critical text
  (see `i18n-a11y.instructions.md`).

## 4. Spacing, radius, grid

- Spacing scale: multiples of 4 and 8 (`4, 8, 12, 16, 24, 32, 48`).
- Radius scale: `6` (inputs), `10` (cards), `14` (sheets), `20`
  (large cards), `pill` (chips/pills/badges).
- Focus ring: 3px, offset, visible in both themes.
- Touch target minimum: 48px.
- Grid: 4 columns (mobile, 360px+), 8 columns (tablet, 600px+), 12
  columns (desktop, 900px+), max content width 1200px. Breakpoints:
  `600`, `900`.

## 5. Components (`packages/ui`)

Each component must implement the five UX states (X7) where
applicable: default, skeleton, empty, error+retry, no-permission.

| Component | Purpose | Key states/props |
|---|---|---|
| Button (primary/secondary/ghost/danger) | all CTAs | loading, disabled, icon-only (48px) |
| Input, Phone input (+91) | forms | validation, error text |
| OTP input (6-box) | AU4, RD4 OTP | auto-advance, paste, resend timer, attempt-limit lockout |
| Searchable combobox | AD12 audience, location search | async options, freeform, keyboard nav |
| Time-range picker | VD3 hours | per-day, closed toggle |
| Quantity stepper | CK1, PD3 | min/max, stock-aware |
| Uploader / gallery sorter | VD4, VD12 | drag-reorder, image + embed mix, consent toggle |
| Chip / badge | filters, status | removable, count badge |
| Rating (stars + breakdown) | RV, PD7, SV6 | read-only and input modes |
| Business/shop card | HM6-9, EX5 | image-top, details-bottom; 1/2/3-4 column responsive |
| Product card | EX4, HM9 | price, offer badge, stock state |
| Service card | SV1 | price type, offer badge, availability |
| Offer card | HM5, OF2 | expired/out-of-stock states |
| Order card / timeline | OR1-2 | state machine progress |
| Notification card | NT1 | read/unread |
| KPI card | AD1, SA1 | sparkline, trend |
| Admin collapsible card | SA2 | expand/collapse, inline actions |
| Tabs | PF3, EX1, SR1 | scrollable, counts |
| Pills (category/subcategory) | EX2, PF4 | removable, grouped, counts |
| Sheet / modal / dialog | filters, confirmations | focus trap, Esc closes top-most layer only |
| Toast / tooltip | feedback | auto-dismiss, ARIA live region |
| Table -> card collapse | admin lists | responsive breakpoint |
| Timeline | OR2, delivery tracking | state + ETA |
| Charts: bar, line, donut, sparkline, candlestick | SA1, AD13 | skeleton/empty/error; candlestick differentiates up/down by fill/hollow **and** the words "Up"/"Down" in the tooltip (never colour alone) |
| Schematic map (pins, radius, polygon editor) | LC2, SA4, AD8 | "you are here", polygon draw/edit |
| QR component | PF7, VD11 | poster/table-tent/sticker print templates |
| Media carousel + full-screen viewer | PD2 | swipe, arrow keys, pinch/double-tap zoom, focus trap |
| Reels player | RL | autoplay-on-view, mute, progress, data-saver tap-to-play |
| Follow button | PF8, RL5 | Follow/Following + bell |
| Linked-product strip | PD5, RL6 | "Shop this video" sheet |
| Video grid | PF10 | views count |
| Media-consent toggle | VD13 | per-upload, defaults from VD12 |
| Search result groups | SR4, SR6 | grouped autocomplete sections with "See all" |
| Filter panel (sheet/sidebar/bar) | EX7 | mobile sheet, desktop sidebar, tablet bar |
| Skeleton | X7 | all list/detail screens |
| Empty / error / no-permission state | X7 | consistent copy pattern, see `docs/glossary.md` |
| Permission matrix | SA3, AD16 | per-module view/edit/create/delete/export checkboxes |

## 6. Do / don't

- **Do** reuse the Services filter component (EX6) on Search and
  service category pages; **don't** fork it.
- **Do** show both an icon and text for every status; **don't** rely on
  colour alone.
- **Do** keep Explore and Search filter state independent; **don't**
  share one filter store between them (invariant 14).
- **Do** use skeletons for first paint; **don't** use spinners for list
  screens.
- **Don't** truncate Hindi labels — wrap or reflow instead.
