# 05 Design system

- **Purpose:** Exact visual language. The built UI must match the prototype exactly.
- **Audience:** Frontend developers and Copilot agents
- **Related:** 04-design-tokens.json (exact values), 06-component-catalogue.md, reference/prototype-source/style.css (complete stylesheet), screenshots/
- **Last updated:** 2026-11-10

**Rule:** use the tokens in `04-design-tokens.json` through the Tailwind theme (CSS variables). No hard-coded colours. When this file and the prototype CSS disagree, the prototype CSS wins; record the conflict in `11-open-issues-and-assumptions.md`.

## Brand and imagery
- Wordmark "ApnaTown" (map-pin + shop-awning mark); variants full / icon / mono / on-dark. Tagline "Apna Shehar, Apni Dukaan".
- Category art uses emoji on tinted tiles (prototype). Real photography (shops, products, people of Padrauna) replaces it later; keep 4:3 for cards and covers, 1:1 for products, 16:9 for banners, 9:16 for reels. Dark mode dims art (brightness .78).
- Icons: a single outline set, 24px grid, 2px stroke, rounded caps (names in the prototype `IC` map: home, map, play, cart, bell, search, star, heart, share, phone, chat, pin, tag, shield, etc.). Icon-only buttons need aria-label; icons with text are aria-hidden.

## Colour (summary; exact values in tokens)
Primary `#C2410C` (CTA, links, active), Secondary `#0F766E` (trust, verified, WhatsApp-like success), Accent `#F59E0B` (stars, highlights), Offer `#A3166B`. Background `#FFFBF5`, surface white, surface-2 `#FAF4EA`, border `#E7DFD3`. Text `#1F1A14`, secondary `#5A5045`, muted `#6F6457`. Semantic: success `#15803D`, warning `#B45309`, error `#B91C1C`, info `#1D4ED8`, each with a soft background. Order statuses (placed `#1D4ED8`, accepted `#0F766E`, preparing `#B45309`, ready `#6D28D9`, out for delivery `#C2410C`, delivered `#15803D`, cancelled `#B91C1C`, refunded `#475569`) and approval statuses (pending, approved, rejected, suspended, inactive). **Status is always icon + text + colour.** Dark theme overrides every colour; text contrast >= 4.5:1.

## Typography
Poppins (headings, prices, KPIs), Noto Sans (body), Noto Sans Devanagari (Hindi). Scale: h1 1.75rem, h2 1.4rem, h3 1.15rem, h4 1rem (all 700, line-height 1.25, letter-spacing -0.01em); body 16px/1.5; small 0.8-0.875rem; caption 0.75rem; button 600 1rem; price 700 1.1rem with ₹ and strikethrough MRP; KPI 700 1.5rem. Hindi text may be ~30% longer: wrap, use min-height, never fixed heights.

## Spacing, grid, radius, shadow, motion
4/8px spacing; touch target >= 48px; focus ring 3px; grids 4 (mobile) / 8 (tablet) / 12 (desktop) columns, max width 1200px, breakpoints 600px and 900px; safe-area insets. Radius xs 6, sm 10, md 14, lg 20, pill 999. Shadows sh-1/2/3 (soft, warm). Motion 120/220/380 ms with cubic-bezier(.2,.8,.2,1); micro-interactions: add-to-cart bump, heart pop, star fill, live pulse, OTP success; `prefers-reduced-motion` replaces animation with instant state change.

## Accessibility
WCAG 2.2 AA; keyboard: Tab order matches visual; Esc closes the top-most layer only; arrow keys in listbox/combobox/tabs/carousel/viewer/reels; dialogs and sheets trap and restore focus; live regions for counts ("12 results"); form errors linked with aria-describedby; skip-to-content; no colour-only status.

## Content and microcopy
Friendly, simple, Hinglish-aware; speak like a helpful neighbour. Error = what happened + what to do. Empty = friendly + one action. Never blame the user. Formats: `₹1,25,000` (Indian grouping), `7 Nov 2026`, `2:17 PM` IST 12-hour, `+91 98765 43210`, `1.4 km`. See `09-content-and-i18n.md`.

## Responsive patterns
Mobile: bottom tab bar (Home, Explore, Videos, Cart, Orders, Account), bottom sheets for filters, sticky action bars, tables become labelled cards. Tablet: horizontal filter bar with count badge. Desktop: top nav + left sidebar filters, side panels, 12-column grid. Dashboards: mobile bottom bar with primary items + "More", desktop sidebar groups.
