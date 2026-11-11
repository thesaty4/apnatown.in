# Frontend shared foundation

**Bootstrap copy contract:** `common.navigation.skipToContent` uses the EN/HI
pair approved on 2026-11-11, stored only in
`apps/web/src/shared/i18n/reviewed-additions.json` and emitted by the catalogue
generator without fallback. The first keyboard-focusable link targets `#main`
(`tabIndex={-1}`); keyboard activation moves focus there.

## Contents

- [Structure and imports](#structure-and-imports)
- [Rendering and SEO](#rendering-and-seo)
- [Tokens and typography](#tokens-and-typography)
- [Shared components](#shared-components)
- [Shared hooks and utilities](#shared-hooks-and-utilities)
- [States, i18n and interaction contracts](#states-i18n-and-interaction-contracts)
- [Performance, media and PWA](#performance-media-and-pwa)
- [Cross-cutting feature ownership](#cross-cutting-feature-ownership)
- [Reference components](#reference-components)

## Structure and imports

```text
apps/web/src/
  app/
    (public)/ (account)/ (vendor)/ (provider)/ (rider)/ (admin)/ (super-admin)/
  features/<feature>/{components,hooks,api,schemas,server}/
  shared/{ui,hooks,lib,i18n,api}/
packages/ui/src/             # single source for reusable design-system UI
packages/shared/src/         # shared Zod schemas, types, enums, formatters
```

- `apps/web/src/shared/ui` only re-exports `packages/ui`; it must not contain a second implementation. A feature may import `packages/shared`, `packages/ui`, `apps/web/src/shared`, and another feature's public `index.ts` only. Never import another feature's internals.
- Shared UI never imports a feature; it renders props and callbacks only—no business logic, API calls or data fetching.
- Server Components are the default. Add Client Components only for browser state, forms, media, gestures or live updates. API access uses the generated/typed OpenAPI client.
- Use TanStack Query only in client islands that need client-side cache, mutation or live-update behavior; keep server data loading in Server Components.
- Bootstrap, root layout/providers/loading/error/not-found, package exports/`transpilePackages`, generated-client commands and same-origin `/api` cookie/CSRF wrappers are specified in [architecture](./architecture.md#runtime-composition-and-lifecycle). Use those shared wrappers, not component fetches. Browser auth always comes from the live Auth contract; no cookie-role or UI-only authorization.
- `shared/i18n/request.ts` supplies validated `en|hi` request config to the next-intl plugin; root `NextIntlClientProvider` receives the needed locale/messages. Query clients are request-local on SSR and stable per browser session, cleared on logout/account switch. No `"use client"` root layout or global private query cache.
- Vendor/provider owner wrappers set `X-Business-Kind: shop|provider` explicitly and key private caches by that context; never select the first business implicitly. `BUSINESS_CONTEXT_REQUIRED` is an explicit error, not empty data. Pending-applicant profile capabilities and approved selling roles come from live server contracts, not this header or the role switcher.

## Rendering and SEO

| Route group / routes | Strategy | Reason and cache rule |
|---|---|---|
| `(public)`: `/`, `/category/:slug`, `/shop/:slug`, `/provider/:slug`, `/product/:slug`, `/service/:slug`, `/offers` | Public content ISR/tag cache; source-only legal/help shells use SSG | Only approved/live data is cached. API-dependent content resolves at runtime, never requiring a running API during `next build`; request-specific locale/theme/auth shell is not shared cached HTML. Revalidate affected tags on publish, stock/offer change or removal. |
| `(public)`: `/explore`, `/services`, `/search?q=`, `/videos`, `/videos/:id` | SSR for URL-derived results/metadata; Reels feed is a client island | Filters and nearby results depend on request state; do not cache personalized location. Reels uses a frozen server-ranked session and client playback. |
| Public auth/account shells: `/login`, `/account`, `/session-expired` | SSR with optional live session, public guest/login UI | Never redirect a guest away from login/the guest Account menu. Personalized responses are no-store; fetch protected details only after authentication. |
| `(account)`: protected `/account/**`, `/orders/**`, `/saved`, `/my-reviews`, `/notifications` | SSR auth gate; CSR islands for forms, filters and live order updates | Private/no-store. Keep public shells outside this protected layout; login returns to the validated origin. |
| `(vendor)` and `(provider)` dashboards | SSR live role or documented owned-applicant capability + ownership gate; CSR editing/tables/live updates | Pending applicants can reach their permitted onboarding/profile/limited overview, not seller actions. Private business data has no shared cache; revalidate after successful mutations. |
| `(rider)` PWA | CSR task shell after server session/role check; no-store operational data | Weak-network controls and live requests need client updates; server remains authoritative for countdowns, acceptance and codes. |
| `(admin)` and `(super-admin)` | SSR role, permission and scope gate; CSR for interactive maps, queues and charts | No shared cache for scoped or sensitive data; server checks every request. |
| `(public)` system routes `/404`, `/500`, `/offline`, `/maintenance` | Static/SSG shell, dynamic error content only where needed | Must remain useful when application APIs are unavailable. |

Public caching is a data-fragment optimization, not publication authority: the dynamic request shell checks current owner visibility before returning cached content/metadata. Do not serve full-route/CDN HTML that bypasses that check. Resolve revocable media/embeds through current Media eligibility; denial or an unavailable authority check must not fall back to a previously approved cached object. Tag invalidation refreshes data but is not the security gate.

| Public fragment / tag | Owner and invalidation |
|---|---|
| `catalog-taxonomy` | Catalog category/subcategory names, order, active state and image references; invalidate on `catalog.taxonomy.changed`, `photo.removed` and `media.visibility_changed`. |
| `catalog-home-sections` | Catalog dedicated/curated section configuration and order; invalidate on `catalog.home_sections.changed`. |
| `promotion-placements` | Offers banners/featured placements; invalidate on `promotion.placement_changed` / `.expired`, including background asset changes. |
| `business:{id}` | Businesses profile, category membership, approval/suspension and public visibility; invalidate on the corresponding committed business events. |
| `product:{id}` / `service:{id}` | Owner listing content, publication, inventory/service visibility, media and target eligibility; invalidate from Products/Services and owning Offers/Media events. |
| `featured:{businessId}` | Effective featured status for that business's public listings; invalidate on subscription-eligibility and business/listing changes. Reads and cursors bind to current entitlement version/expiry; cached freshness cannot extend beyond the earliest relevant subscription/placement end. |

Location-specific, personalized, scoped-admin, account, checkout and bill responses remain `no-store`; public tags never contain user-specific state. Home/Explore composition batches owner projections and bounded page data; never issue one API/database lookup per rendered card. A public cache hit still rechecks the current publication/authorization authority.

| Public page type / URL | EN / HI title and description template | JSON-LD | Canonical and indexing |
|---|---|---|---|
| Home `/` | EN: `ApnaTown \| {home.seoTitleEn}`; HI: `ApnaTown \| {home.seoTitleHi}`; description uses locale-specific `home.seoDescription` key | `Organization`, `WebSite` | Self canonical; index |
| Category `/category/:slug` | EN: `{category.name} \| ApnaTown`; HI: `{category.nameHi} \| ApnaTown`; description uses localized category SEO key | `CollectionPage`, `ItemList`, `BreadcrumbList` | Canonical category landing only; index |
| Shop `/shop/:slug`, provider `/provider/:slug` | EN: `{business.name} in {area.name} \| ApnaTown`; HI: `{business.nameHi}, {area.nameHi} \| ApnaTown`; description uses approved localized profile summary | `LocalBusiness`, `BreadcrumbList` | Self canonical only while public/live; otherwise noindex |
| Product `/product/:slug` | EN: `{product.name} at {business.name} \| ApnaTown`; HI: `{product.nameHi}, {business.nameHi} \| ApnaTown`; description uses approved localized product summary | `Product`, `BreadcrumbList` | Public listings self-canonical/indexable including truthful OutOfStock; unpublished/removed -> noindex 404 |
| Service `/service/:slug` | EN: `{service.name} by {provider.name} \| ApnaTown`; HI: `{service.nameHi}, {provider.nameHi} \| ApnaTown`; description uses approved localized service summary | `Service`, `BreadcrumbList` | Self canonical if public/active; otherwise noindex |
| Explore/Search/filter combinations | EN/HI title and description use localized discovery keys | None | `noindex,follow`; never canonicalize arbitrary filter combinations to landing pages |
| Subcategory `/category/:categorySlug/:subcategorySlug` | EN/HI title uses `{subcategory.name} - {category.name} \| ApnaTown`; description from localized taxonomy summary | `CollectionPage`, `ItemList`, `BreadcrumbList` | Self-canonical landing, index only while parent/child are active and have eligible public results; reuse S-CUST-05, not a new screen. |

All SEO copy is localized using the route policy below, which resolves Q-23/Q-24. Generate XML sitemaps only from approved, public, canonical pages; remove noindex/removed/expired targets and update `lastmod` only for actual content changes. Reuse approved EN/HI catalogue strings and entity content, never fabricated copy or ratings.

Public entity pages also emit localized Open Graph/social-preview title, description and image from the same authorized public DTO. Never invent rating, price, stock/availability, hours, location or business facts in metadata/JSON-LD; omit unavailable values. Use only currently approved/resolvable Media assets for social images. Public routes have one canonical route per entity kind; slug fields are immutable in current write contracts. Query filters/cursors are `noindex,follow` and do not create duplicate sitemap URLs. Unpublished, suspended, deleted or removed entities resolve as unavailable/not-found with `noindex`, leave sitemaps on owner-event invalidation, and do not expose stale metadata. Protected account, admin, checkout, order and bill routes are `noindex` and `no-store`.

### Public URL and locale policy

**Decision 2026-11-11:** English keeps existing unprefixed routes; Hindi uses `/hi` before the same path, including `/hi` for Home. Public next-intl routing uses `localePrefix:'as-needed'`, default `en`, supported `en|hi`, and `localeDetection:false`: the path, never Accept-Language or a cookie, controls public content. `/en/...` redirects 308 to its unprefixed English equivalent; trailing slashes normalize without chains. Existing English links remain valid.

- All module spec public-route tables are English/locale-neutral shapes. One shared `publicHref(path,locale)` builds internal links, breadcrumbs, offers, QR targets, canonicals and alternates; never concatenate locale prefixes in components. API routes, signed callbacks, assets and protected dashboard/account/checkout/bill URLs are **not prefixed**. Private pages use the validated existing locale cookie/user preference and remain no-store/noindex; public Hindi prefixes on private paths return noindex 404, not a public profile fallback.
- Public language switch changes only locale, preserving entity, supported filter query and fragment. Private switch changes locale through the shared preference action, not the pathname. Browser Back restores the prior public language/filter/scroll state. Route groups remain logical; public pages move under the next-intl locale layout/matcher only, not private/API routes.
- Each public English/Hindi page has its own absolute self-canonical, reciprocal `hreflang=en/hi`, and `x-default` pointing to English. Use configured production origin, not arbitrary Host/forwarded headers. One metadata helper generates these and Open Graph URLs; sitemap lists both valid locale URLs, with at most 50,000 URLs/file and a sitemap index. Inactive/unpublished/removed pages are omitted in both locales.
- Subcategory route is `/category/{categorySlug}/{subcategorySlug}` (Hindi `/hi/category/...`), validated as a live parent-child pair, SSR content plus approved tag-cached fragments. Reuse Catalog/S-CUST-05 and Search's exact kind/category/subcategory query; mismatched/removed pairs return noindex 404. Breadcrumbs are Home -> Category -> Subcategory. Taxonomy slugs remain immutable; name edits change neither route nor canonical.
- Homepage category/subcategory cards retain their requested Explore destinations. The category landing's subcategory links use the indexable subcategory route. Both share filters; broadening beyond the route's category/subcategory navigates to Explore with that state rather than showing unrelated results under a misleading landing URL.
- Facet/search/cursor URLs remain noindex,follow and out of sitemaps. An unfiltered landing is the indexable page; cursor results render real server HTML with crawlable next links and normalized self URLs, not canonicalized to unrelated first-page content. Strip only known tracking parameters from canonical URLs, never meaningful filters. Out-of-stock product pages stay indexable if still public, with truthful `OutOfStock` availability; removed products return 404/noindex.
- Reserve private route literals under `/provider` before public slug resolution (including billing, offers, onboarding, overview, profile, services, products, orders, enquiries, analytics, followers, reviews, qr, media, notifications, account). Shared slug validation rejects reserved candidates on creation and appends the existing stable ID suffix; immutable legacy collisions require an explicit audited migration, never redirect a public slug into private data.
- Acceptance: Given `/category/wedding-events/dj-sound` and its Hindi equivalent, then both render the same scoped public results with localized metadata, reciprocal alternates and self-canonicals. Given `/en`, unknown locale/slug, removed taxonomy, a private route or arbitrary Host header, then redirects/404/noindex and canonical origin are deterministic with no protected data leak. Verify HTML, sitemap entries, JSON-LD and Back restoration, not only client navigation.

Reference: [Google localized-page guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). This selects URL behavior; it does not claim crawl/ranking results.

## Tokens and typography

- Map every token in [04-design-tokens.json](../../docs/design-context/04-design-tokens.json) into the Tailwind theme through CSS variables. Components use semantic utilities (`bg-bg`, `text-text`, `border-border`, `text-primary`, status tokens), never raw hex values.
- Expose token-backed radius utilities and `ring-focus` (the 3px focus-ring token); do not rely on Tailwind's unmodified default radii or focus-ring width.
- Define light/dark/auto using the token set and `prefers-color-scheme`; no per-component color overrides. Preserve status text/icon as well as color.
- Load Poppins, Noto Sans and Noto Sans Devanagari through `next/font`; body defaults to Noto Sans with Devanagari fallback. Match the token type scale, spacing/radius/shadow/motion and touch targets from the source pack.
- Breakpoints: tablet 600px, desktop 900px; mobile-first 4/8/12-column grids and 1200px maximum container. Exact measurements live in the token file and design system.
- Prototype CSS is the visual source of truth; the desktop/mobile dark Explore screenshots duplicate their light variants, so use dark token/CSS rules until corrected ([G-10](../../docs/design-context/11-open-issues-and-assumptions.md)).
- `pnpm tokens:generate` reads this JSON, emits `packages/ui` token CSS and the pinned Tailwind-version theme integration, merging `dark_overrides` over light values once. Import in root `globals.css`; scan both Web and UI source (or equivalent Tailwind source directives), including exported client components. Verify `ring-focus`, radius, status, motion and 600/900 breakpoints in generated CSS; no second hand-maintained palette.
- `pnpm i18n:generate` converts [09a-i18n-en-hi.json](../../docs/design-context/09a-i18n-en-hi.json)'s English-text keys using a reviewed `shared/i18n/source-key-map.json` into semantic `messages/en.json` and `hi.json`; the source is not a ready-made next-intl catalogue. Preserve translations, map reused copy intentionally, validate ICU placeholder/key parity, and fail on unmapped/missing keys. API `message_key`s and new UI keys need reviewed EN/HI entries. Locale layout/matcher behavior follows the public URL policy above, not a second routing strategy.

## Shared components

Owner paths are under `packages/ui/src`; grouped names share the stated file unless a more specific subpath is shown. Props/variants are concise references to the full catalogue, not replacements for it. `—` means the catalogue does not specify a variant. Every component accepts `className`, forwards refs, is keyboard accessible, uses token-driven light/dark styles, receives EN/HI copy through props and exposes `data-testid`.

| Component(s) | Props / variants | Owner |
|---|---|---|
| Button | `variant,size,loading,disabled,leftIcon,rightIcon,block,as`; primary/secondary/outline/ghost/tertiary/destructive; sm 40px, md 48px, lg metric open (Q-27) | `primitives/Button.tsx` |
| IconButton | `icon,label (required),badge`; ghost/filled; 44-48px | `primitives/IconButton.tsx` |
| Input | label, hint, error, prefix/suffix, required, inputMode; text/tel/number/email/search/date/time/textarea | `primitives/Input.tsx` |
| PhoneInput | E.164 value/onChange; +91, 10 digits | `primitives/PhoneInput.tsx` |
| OtpInput | `length,onComplete,resendSeconds`; 4/6 boxes | `primitives/OtpInput.tsx` |
| Select | options/value; native on mobile | `primitives/Select.tsx` |
| Checkbox / Radio / Toggle | checked, label, description; row/toggle variants | `primitives/Selection.tsx` |
| Combobox | items, groups, recent, onSelect; single/multi | `primitives/Combobox.tsx` |
| SearchBar | value, suggestions, voice; header/page | `discovery/SearchBar.tsx` |
| QuantityStepper | value, min, max; min/max disabled | `commerce/QuantityStepper.tsx` |
| Uploader / MediaSorter | accept, max, items, onReorder; image/video-link | `media/Uploader.tsx`, `media/MediaSorter.tsx` |
| Chip / Pill | selected, removable, count; filter/category/subcategory | `primitives/Chip.tsx`, `primitives/Pill.tsx` |
| Badge / StatusBadge | tone, icon, label; ok/warn/bad/info/neutral/offer/security | `primitives/Badge.tsx` |
| Rating | value, count, interactive; display/input/breakdown | `data/Rating.tsx` |
| Avatar / ArtTile | emoji/src, hue, size; mini/full/4:3 | `data/Avatar.tsx`, `data/ArtTile.tsx` |
| Skeleton | shape, lines; text/card/image | `feedback/Skeleton.tsx` |
| Toast | tone, message; success/info/error; auto-dismiss/pause on hover | `feedback/Toast.tsx` |
| Tooltip | text; keyboard-accessible hint | `feedback/Tooltip.tsx` |
| AppShell | role; customer mobile tabs/desktop nav | `layout/AppShell.tsx` |
| DashboardShell | nav groups, role; desktop sidebar/mobile bar | `layout/DashboardShell.tsx` |
| TopBar | location, search, bell, cart, play; mobile/desktop | `layout/TopBar.tsx` |
| Breadcrumbs | items; current-page semantics | `navigation/Breadcrumbs.tsx` |
| Tabs / Segmented | items, value; underline/segmented | `navigation/Tabs.tsx` |
| Stepper | steps, current; done/current | `navigation/Stepper.tsx` |
| Pagination / LoadMore | hasMore, onMore; cursor | `navigation/Pagination.tsx` |
| Sheet | title, wide, footer; focus trap, Esc, drag handle | `overlay/Sheet.tsx` |
| Modal / ConfirmDialog | title, impact text, confirm label, tone; destructive impact named | `overlay/ConfirmDialog.tsx` |
| Popover / ActionSheet / ShareSheet | items; WhatsApp/copy/native share where supported | `overlay/ShareSheet.tsx` |
| EmptyState / ErrorState / NoPermissionState / OfflineBanner / SuccessState | icon, title, message, action; one clear action | `feedback/StateViews.tsx` |
| ShopCard | shop, lazyCover; responsive grid, open/rating/distance/actions | `cards/ShopCard.tsx` |
| ProductCard | product; price/offer/stock/add/heart | `cards/ProductCard.tsx` |
| ServiceCard | service; category/provider/price-or-enquiry/availability/actions | `cards/ServiceCard.tsx` |
| OfferCard | offer; validity and deep link | `cards/OfferCard.tsx` |
| CategoryTile | category; emoji art and Explore link | `cards/CategoryTile.tsx` |
| OrderCard / DeliveryCard / ReviewCard / NotificationCard / BookmarkCard | domain view data, status badge, permitted actions | `cards/RecordCards.tsx` |
| KpiCard | label, value, delta; up/down text and color | `data/KpiCard.tsx` |
| AdminCollapsibleCard | title, chips, status, expanded | `admin/AdminCollapsibleCard.tsx` |
| DataTable | columns, rows; sort/empty and mobile labelled cards | `data/DataTable.tsx` |
| Timeline | steps, current; delivery/pickup sequence | `data/Timeline.tsx` |
| Charts | Bar/Line/Donut/Sparkline; tooltip, legend, accessible table fallback | `data/Charts.tsx` |
| KeyValue / Accordion | definition list / expandable details | `data/KeyValue.tsx`, `data/Accordion.tsx` |
| FilterPanel | filter content/count; mobile sheet/tablet bar/desktop sidebar | `discovery/FilterPanel.tsx` |
| SubcategoryMultiSelect | `categories,selectedCats,selectedSubs,counts,onChange`; search/show-more/group select; default/selected/empty/loading | `discovery/SubcategoryMultiSelect.tsx` |
| CategoryMultiSelect | counts per category; selected/empty | `discovery/CategoryMultiSelect.tsx` |
| ActiveFilterChips / ClearAll | removable chips/count; clear all | `discovery/ActiveFilterChips.tsx` |
| CategoryPillRow / SubcategoryPillRow | pills/counts; sticky horizontal overflow | `discovery/FilterPillRows.tsx` |
| MapView | pins, clusters, radius, draggable pin, polygon editor; empty-city state | `geo/MapView.tsx` |
| PriceRangeSlider | min/max and paired inputs | `commerce/PriceRangeSlider.tsx` |
| OfferBanner | badge, discounted price, validity, terms; expired/out-of-stock | `commerce/OfferBanner.tsx` |
| AddressForm / AddressCard | map pin, landmark, PIN, label | `geo/Address.tsx` |
| PaymentMethodPicker | UPI/cards/net banking/wallets/COD; failed | `commerce/PaymentMethodPicker.tsx` |
| CouponField | apply/remove; invalid/applied | `commerce/CouponField.tsx` |
| EnquiryForm | name, phone, message, preferred date; success | `forms/EnquiryForm.tsx` |
| ReviewForm / RatingBreakdown | stars, text, photos, tags; not-eligible | `forms/ReviewForm.tsx`, `data/RatingBreakdown.tsx` |
| MediaCarousel | images/video thumbnails; loading/error fallback | `media/MediaCarousel.tsx` |
| FullScreenViewer | prev/next, swipe, zoom, counter, heart; focus trap | `media/FullScreenViewer.tsx` |
| EmbedCard | validated YouTube/Instagram poster and open fallback | `media/EmbedCard.tsx` |
| GalleryGrid / Lightbox | filters, caption, linked chip, report; swipe/empty | `media/Gallery.tsx` |
| ReelsPlayer | vertical feed, playback, mute, progress, data-saver, keyboard | `media/ReelsPlayer.tsx` |
| FollowButton | follow/following, bell, confirm, login prompt | `engagement/FollowButton.tsx` |
| HeartButton / LikeButton | pressed state, reduced-motion animation | `engagement/ReactionButtons.tsx` |
| LinkedItemsStrip | product/service cards; add/enquire/view | `media/LinkedItemsStrip.tsx` |
| ShopThisVideoSheet | linked-item list | `media/ShopThisVideoSheet.tsx` |
| VideoGrid / VideoCard | poster, views, duration | `media/VideoGrid.tsx` |
| MediaConsentToggle | Gallery/Reels surface consent and explanation | `media/MediaConsentToggle.tsx` |
| SearchResultGroup | header/count/See all/explanation label | `discovery/SearchResultGroup.tsx` |
| PermissionMatrix | module/action grid, unsaved and before/after states | `admin/PermissionMatrix.tsx` |
| RoleForm | role and permission editing | `admin/RoleForm.tsx` |
| ConfirmImpactDialog | destructive confirmation names impact | `admin/ConfirmImpactDialog.tsx` |
| ReviewBeforeSendSummary | audience/channel/template send summary | `admin/ReviewBeforeSendSummary.tsx` |
| ApprovalDocumentViewer | permission-gated document view | `admin/ApprovalDocumentViewer.tsx` |
| AuditDiff | before/after display | `admin/AuditDiff.tsx` |
| ChartCard | Graph-only series, supported metric/date/city filters, accessible table alternative | `admin/ChartCard.tsx` |
| CityCard | city status and summary | `admin/CityCard.tsx` |
| ZoneEditor | polygon editing with draggable corners | `admin/ZoneEditor.tsx` |
| ModerationQueueItem | content, status and permitted actions | `admin/ModerationQueueItem.tsx` |
| KeywordMappingForm / PreviewPanel | mapping editor and result preview | `admin/KeywordMapping.tsx` |

`ShareSheet` is one implementation reused by overlay and media flows. Use the complete props, states, accessibility and prototype classes in [06-component-catalogue.md](../../docs/design-context/06-component-catalogue.md); do not fork a component to change its feature context.

## Shared hooks and utilities

| API | Owner and rule |
|---|---|
| `useUrlState` | `apps/web/src/shared/hooks/use-url-state.ts`; schema-validate and serialize URL params, preserve Back/Forward. |
| `useBackScroll`, `useDebounce`, `useMediaQuery` | `apps/web/src/shared/hooks/`; restore per-screen scroll, debounce input, subscribe to media queries with cleanup. |
| `useCart`, `useAuthGate`, `useFollow`, `useLike`, `useI18n` | `apps/web/src/shared/hooks/`; use typed API/client contracts; login gate returns to a validated origin. |
| `formatInr(paise)`, `formatDateIst`, `formatTimeIst`, `formatDistanceKm`, `formatPhone`, `slugify` | `packages/shared`; one implementation shared by web and API where applicable. |
| `buildEmbedUrl` | `apps/api/src/modules/media-videos`; server-only allow-list and reconstruction—never build an embed from a client URL. |

## States, i18n and interaction contracts

- Every screen implements default, skeleton loading, helpful empty with one action, error with retry, no-permission, and offline. Add success/special states only when the screen inventory calls for them. The shared `StateViews`, `Skeleton` and `OfflineBanner` provide the UI; data fetching owns state selection.
- Every user-facing string is a semantic key with English and Hindi values via next-intl; no hard-coded JSX copy or sentence concatenation. Use ICU placeholders/plurals. Hindi may be longer: allow wrapping and flexible heights; do not truncate meaningful labels. Translation source/review comes from the Design Context i18n catalogue.
- Auth-required actions use a login sheet, retain a safe same-origin return path (including video ID), and complete the pending action after login per BR-21. Never accept arbitrary redirect URLs.
- Explore uses Search's typed query DTO: active tab filters are unprefixed; inactive tab filters use `products.`/`shops.`/`services.`; removable shared Home category is `contextCategory`. Do not invent a second serializer. Search (`/search?q=`) is independent; precise location uses the paired `X-Discovery-Latitude`/`X-Discovery-Longitude` headers through the private/no-store wrapper, never shareable params. Back/Forward restores URL filters/scroll; Reels `/videos/:id` resolves by ID against its frozen session.
- Sheets/dialogs trap focus, close the top layer with Esc, restore focus to the trigger and expose labelled actions. Keyboard navigation, visible 3px focus ring, minimum 48px touch targets, reduced motion and text/icon status are required. The compact prototype button dimensions are a logged exception pending approval in [Q-27](../../docs/design-context/11-open-issues-and-assumptions.md).

## Performance, media and PWA

- Budgets: retain the existing LCP <2.5 s on slow 4G, route JS approximately 170 KB gzip and CLS <0.1 targets; verify the full API/INP/TTFB budgets in [product NFR](../../docs/specs/01-product/06-non-functional-requirements.md). Do not add targets or claim measurements without production-like verification.
- Use intrinsic dimensions/aspect ratio plus responsive `sizes`; prioritize only the actual LCP image and lazy-load below-fold/category/subcategory cards. Batch owner projections and cap every rendered section/page using its module's cursor limit. Preserve skeleton/poster geometry before media. Video never autoplays in data-saver/Save-Data mode; show tap-to-play poster and respect reduced motion.
- Link embeds only from approved hosts; API rebuilds embed URLs. Uploads use the storage port, content/size validation and EXIF/GPS stripping; use short-lived authorized media access where required.
- Revocable uploaded images use Media's revalidated public-content URLs. Do not let Next's image optimizer/CDN cache bypass their current publication check; use `unoptimized` with supplied dimensions/responsive layout until an equally authorized optimization path exists. Media's configured upload policy owns byte/dimension limits, EXIF removal and any approved compressed/responsive variants; no image format, quality or variant breakpoints are selected by this foundation. If no approved compressed variant exists, serve the validated source and measure it against the existing LCP budget; do not claim a compression gain. Static design assets may use ordinary image caching.
- Cache the static app shell for offline rendering; do not cache private API, KYC, session or payment data. Show offline state and retry. Rider actions remain server-authoritative; countdowns use server timestamps and cannot be accepted/delivered offline.
- PWA supports install prompt and weak connections. Data-saver disables autoplay and requests smaller media variants; all controls remain operable without motion.

## Cross-cutting feature ownership

| IDs | Shared behavior / owner |
|---|---|
| F-X-001, F-X-002 | Locale/theme controls and token providers in `apps/web/src/shared`; settings persistence in `users`/`settings` specs. |
| F-X-003, F-X-004, F-X-007 | Responsive layouts, WCAG 2.2 AA and standard screen states in this foundation and `packages/ui`. |
| F-X-005, F-X-006, F-X-015 | Offline banner, data-saver and rider PWA shell here; rider task rules in `delivery`. |
| F-X-008 | Consent UI in `users`; consent record and enforcement stay server-side. |
| F-X-009 | System pages and maintenance state in `settings`. |
| F-X-010 | Public templates, metadata, canonical, JSON-LD, hreflang and sitemap rules here. |
| F-X-011 | Print UI in `businesses`/`orders`; no separate print service. |
| F-X-012 | Notification screens/templates in `notifications`; EN/HI catalogue referenced, not duplicated. |
| F-X-013 | Indian formatters from `packages/shared`. |
| F-X-014 | Audit UI in `audit`; API authorization and append-only storage are server-owned. |
| F-AU-001, F-AU-003 | Language choice and guest browsing UI here; role/session enforcement in `auth`/`users`. |
| F-AU-002 | Location primer UI here; optional geo detection and manual fallback in `geo`. |

## Reference components

### Button — `packages/ui/src/primitives/Button.tsx`

```tsx
'use client';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'tertiary' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; leftIcon?: ReactNode; rightIcon?: ReactNode; block?: boolean };

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-on-primary hover:brightness-[.93]',
  secondary: 'border-transparent bg-secondary text-surface',
  outline: 'border-primary bg-transparent text-primary',
  ghost: 'border-border bg-surface-2 text-text',
  tertiary: 'border-transparent bg-transparent text-primary underline-offset-4 hover:bg-primary-soft hover:underline',
  destructive: 'border-transparent bg-error text-surface',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', type = 'button', loading = false, leftIcon, rightIcon, block = false, disabled, children, className = '', ...props }, ref,
) {
  const sizes = {
    sm: 'min-h-10 rounded-[var(--r-sm)] px-3.5',
    md: 'min-h-12 rounded-[var(--r-md)] px-5',
    lg: 'min-h-12 rounded-[var(--r-md)] px-5',
  };
  return <button {...props} type={type} ref={ref} disabled={disabled || loading} aria-busy={loading || undefined}
    className={`inline-flex items-center justify-center gap-2 border-2 font-semibold focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-primary motion-safe:active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-transform ${sizes[size]} ${variants[variant]} ${block ? 'w-full' : ''} ${className}`}>
    {loading ? <span aria-hidden="true" className="size-4 motion-safe:animate-spin rounded-full border-2 border-current border-r-transparent" /> : leftIcon}
    {children}{!loading && rightIcon}
  </button>;
});
```

The production Button also provides the catalogue's polymorphic `as` adapter; this is the native branch, defaulting to `type="button"` (forms opt into `submit`). Under reduced motion the spinner is static and press scaling/transitions are absent; label/busy/disabled semantics remain. `lg` is a Q-27 provisional base-size alias, not an approved new metric.

### Input — `packages/ui/src/primitives/Input.tsx`

```tsx
'use client';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, required, className = '', 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }, ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const descriptionIds = [...new Set([describedBy, hintId, errorId].filter(Boolean).join(' ').split(/\s+/).filter(Boolean))].join(' ') || undefined;
  const borderClass = error ? 'border-error' : 'border-border-strong focus:border-primary';
  return <div className="grid gap-1.5">
    <label htmlFor={inputId} className="font-medium text-text">{label}{required && <span aria-hidden="true"> *</span>}</label>
    <input {...props} ref={ref} id={inputId} required={required} aria-invalid={error ? true : invalid}
      aria-describedby={descriptionIds}
      className={`min-h-12 rounded-[var(--r-md)] border-2 bg-surface px-3.5 py-2.5 text-text placeholder:text-muted outline-none focus-visible:ring-focus focus-visible:ring-primary-soft disabled:bg-surface-2 ${borderClass} ${className}`} />
    {hint && <p id={hintId} className="text-sm text-text-2">{hint}</p>}
    {error && <p id={errorId} role="alert" className="text-sm text-error">{error}</p>}
  </div>;
});
```

Input IDs use `useId` unless an explicit unique ID is supplied, **not `name`** (repeated names are valid). External descriptions are merged with hint/error IDs and caller invalid state is preserved. The same contract covers text/tel/number/email/search/date/time and textarea; textarea retains the prototype's 96px minimum height/vertical resize.

```tsx
// packages/ui/src/primitives/controls.test.tsx
import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { Input } from './Input';

it('Given loading, When clicked, Then semantic native Button stays disabled', async () => {
  const user = userEvent.setup();
  let clicked = false;
  render(<Button loading onClick={() => { clicked = true; }}>Save</Button>);
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button).toHaveClass('bg-primary');
  expect(button).toHaveAttribute('type', 'button');
  expect(button).toHaveAttribute('aria-busy', 'true');
  expect(button).toBeDisabled();
  await user.click(button);
  expect(clicked).toBe(false);
});

it('Given repeated names and external help, When rendered, Then IDs and descriptions remain correct', () => {
  render(<><p id="help">Name</p><Input name="name" label="Shop" required hint="Name" error="Enter a name" aria-describedby="help" /><Input name="name" label="Provider" /></>);
  const input = screen.getByRole('textbox', { name: /Shop/ });
  expect(input.id).not.toBe(screen.getByRole('textbox', { name: 'Provider' }).id);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAttribute('aria-describedby', `help ${input.id}-hint ${input.id}-error`);
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a name');
});
```

Acceptance/tests: Given a form, when a default Button is clicked, then it does not submit; explicit `type="submit"` does. Given reduced-motion emulation, when loading/pressing, then computed animation/transform is absent but loading remains accessible. Given a caller ID/invalid/description, when an Input hint/error changes, then label association and external descriptions survive without ID collision. RTL + axe cover keyboard/ref/disabled/error and Hindi/light/dark; Playwright checks real generated CSS, root hydration/error recovery, EN/HI parity and the browser-to-API smoke in [architecture](./architecture.md#verification-and-clean-checkout-ci). No app/component test is claimed executed in this spec-only repair.
