# 06 Component catalogue

- **Purpose:** Every UI component with props, variants, states and where it is used. Anything used more than once is a shared component in `packages/ui` (or `apps/web/src/shared/ui`) and reused everywhere.
- **Audience:** Frontend developers and Copilot agents
- **Related:** 04-design-tokens.json, 05-design-system.md, 02-screen-inventory.md; prototype CSS classes are listed in `Proto class` for exact visual parity (see reference/prototype-source/style.css)
- **Last updated:** 2026-11-10

Conventions: all components accept `className`, forward refs, are keyboard accessible, support light/dark through tokens, have EN/HI labels via props (never hard-coded text), and expose `data-testid`. States column lists the states the component must implement.

## A. Primitives
| Component | Proto class | Props (key) | Variants / sizes | States | Used in |
|---|---|---|---|---|---|
| Button | `.btn` | `variant, size, loading, disabled, leftIcon, rightIcon, block, as` | primary, secondary(.s), outline(.o), ghost/tertiary(.g/.t), destructive(.d); sm, md(48px), lg | default, hover, focus (3px ring), active, disabled, loading | everywhere |
| IconButton | `.iconbtn` | `icon, label(required), badge` | 44-48px, ghost, filled | focus, badge | top bar, cards, sheets |
| Input (text/tel/number/email/search/date/time/textarea) | `.input` | `label, hint, error, prefix, suffix, required, inputMode` | 48px min height | default, focus, error, disabled, read-only | forms, filters |
| PhoneInput | `.input` + prefix | `value (E.164), onChange` | +91 prefix, 10 digits | error | login, onboarding, enquiry |
| OtpInput | `.otp` | `length=6|4, onComplete, resendSeconds` | 46x54 boxes | focus, error, success, resend timer | login, delivery OTP |
| Select | `select.input` | `options, value` | native on mobile | disabled | forms, sort |
| Checkbox / Radio / Toggle | `.check`, `.toggle` | `checked, label, description` | row 44px min | disabled | filters, settings |
| Combobox (searchable) | `.searchbar` + list | `items, groups, recent, onSelect` | single, multi | keyboard nav, empty, loading | admin comms audience, live-map city |
| SearchBar | `.searchbar` | `value, suggestions, voice` | header, page | focus, suggestions open | header, search |
| QuantityStepper | `.qty` | `value, min, max` | - | min/max disabled | cart, product |
| Uploader / MediaSorter | `.upl`, `.msort` | `accept, max, items, onReorder` | image, video-link | dragging, error, preview | vendor product/service/gallery |
| Chip / Pill | `.chip`, `.pills` | `selected, removable, count` | filter chip, category pill, subcategory pill row, removable chip | selected, focus, overflow scroll | filters, profile |
| Badge / StatusBadge | `.badge` | `tone, icon, label` | ok, warn, bad, info, neu, offer, sec; order and approval statuses | - | cards, tables |
| Rating | `.stars` | `value, count, interactive` | display, input, breakdown bars | hover, focus | cards, reviews |
| Avatar / ArtTile | `.art` | `emoji|src, hue, size` | mini, full, 4:3 | skeleton, dim in dark | cards |
| Skeleton | `.skel` | `shape, lines` | text, card, image | - | all loading states |
| Toast | `.toast` | `tone, message` | success, info, error | auto-dismiss 3.5s, pause on hover | global |
| Tooltip | `[data-tip]` | `text` | - | - | charts, icons |
## B. Layout and navigation
| Component | Proto class | Props | Variants | States | Used in |
|---|---|---|---|---|---|
| AppShell (customer) | `#app`, `.topbar`, `.tabbar` | `role` | mobile bottom tabs (Home, Explore, Videos, Cart, Orders, Account), desktop top nav | active tab, badge | all customer pages |
| DashboardShell | `.side`, `.dtabs` | `nav groups, role` | desktop sidebar groups, mobile bottom bar + More | active, permission-hidden | vendor/provider/rider/admin/super |
| TopBar | `.topbar` | `location, search, bell, cart, play` | mobile, desktop | scroll shadow | customer |
| Breadcrumbs | `.crumb` | `items` | - | current page | product, service, category |
| Tabs / Segmented | `.tabs`, `.seg` | `items, value` | underline, segmented | selected, overflow | profile, explore, dashboards |
| Stepper (wizard) | `.steps` | `steps, current` | - | done, current | onboarding, checkout |
| Pagination / LoadMore | `.more` | `hasMore, onMore` | cursor | loading | lists |
## C. Overlays and feedback
| Component | Proto class | Props | States |
|---|---|---|---|
| Sheet (bottom sheet / side sheet) | `#sheetRoot .sheet` | `title, wide, footer` | focus trap, Esc closes top layer only, drag handle |
| Modal / ConfirmDialog | `.dialog` | `title, impact text, confirmLabel, tone` | destructive confirm names the impact; text-labelled buttons |
| Popover / ActionSheet / ShareSheet | `.pop` | `items` | WhatsApp, copy link, native share |
| EmptyState / ErrorState / NoPermissionState / OfflineBanner / SuccessState | `.state`, `.offline` | `icon, title, message, action` | each always has one clear action |
## D. Cards and data display
| Component | Props | Notes / states | Used in |
|---|---|---|---|
| ShopCard | `shop, lazyCover` | image on top (4:3, lazy + skeleton), details bottom; 1/2/3-4 columns; open badge, distance, rating, delivery/pickup chips, Call/WhatsApp/Save | Home, Explore, Search |
| ProductCard | `product` | image, name, price + MRP + discount %, offer badge, stock state, Add to cart, heart | Home, Explore, Search, profile |
| **ServiceCard** | `service` | image/thumbnail, name, subcategory tag, provider name+logo (+verified), price or "Price on enquiry", rating, distance, open/availability badge, offer badge, Call/WhatsApp/Bookmark | Search, Explore, profile, category |
| OfferCard | `offer` | badge, shop, validity, opens deep link | Home, Offers |
| CategoryTile | `category` | emoji art + label, links to Explore | Home |
| OrderCard / DeliveryCard / ReviewCard / NotificationCard / BookmarkCard | | status badge, actions | account, dashboards |
| KpiCard | `label, value, delta` | up/down colour + text | dashboards |
| AdminCollapsibleCard | `title, chips, status, expanded` | collapsed summary, expanded details and actions | super admin admins list |
| DataTable | `columns, rows` | collapses to labelled cards on mobile; sort, empty | admin, reports |
| Timeline | `steps, current` | delivery vs pickup sets; icon + text + colour | order tracking, disputes |
| Charts | Bar, Line, Donut, Sparkline; legend; skeleton/empty/error | SVG, accessible table fallback | dashboards |
| KeyValue (dl) / Accordion | | | details |
## E. Commerce and discovery
| Component | Purpose / props | States |
|---|---|---|
| **FilterPanel** (`sf` family) | Generic filter container rendering as bottom sheet (mobile, sticky "Show N results", Reset/Apply), left sidebar (desktop, live), horizontal bar with count badge (tablet) | loading counts skeleton |
| **SubcategoryMultiSelect** | props `categories, selectedCats, selectedSubs, counts, onChange`; grouped by category heading; checkbox + count; Select all/Clear per group; inner search above 8 items; Show more; disabled at count 0; collapsed groups when no category; long-Hindi wrap; aria group labels | default, one selected, several across two categories, no results, loading |
| CategoryMultiSelect | counts per category | - |
| ActiveFilterChips + ClearAll | removable chips, count, Clear all | - |
| CategoryPillRow / SubcategoryPillRow | sticky horizontally scrollable pills with counts, overflow, long text | selected |
| MapView | Shared client-only Leaflet/OSM map; pins, clusters, you-are-here, radius, draggable pin; Geoman Free polygon editing and visible attribution | empty city; tile failure with list/manual fallback |
| PriceRangeSlider | min/max + inputs | - |
| OfferBanner | badge, discounted price, validity, terms; expired and out-of-stock | states |
| AddressForm / AddressCard | map pin, landmark, PIN, label | - |
| PaymentMethodPicker | UPI, cards, net banking, wallets, COD | failed |
| CouponField | apply/remove | invalid, applied |
| EnquiryForm | name, phone, message, preferred date | success |
| ReviewForm / RatingBreakdown | stars, text, photos, tags | not eligible |
## F. Media and engagement
| Component | Purpose / props | States |
|---|---|---|
| MediaCarousel | images + video thumbnails with play badge | loading, video error fallback |
| FullScreenViewer | prev/next, swipe, arrows, counter, zoom (pinch/double-tap/wheel), heart, focus trap, ignores pointer capture on buttons | - |
| EmbedCard | Typed YouTube iframe / Instagram permalink renderer with lazy poster and safe Open fallback; exact host/ID validation, no raw HTML | blocked, offline, provider unavailable |
| GalleryGrid + Lightbox | filters All/Photos/Videos/By product/By service; swipe; caption; linked chip; report | empty |
| **ReelsPlayer** | vertical snap feed, autoplay in view, tap pause, mute, progress, data-saver, keyboard (up/down), side panel on desktop | failed, offline, removed, empty Following, no nearby |
| **FollowButton** | Follow / Following + bell, unfollow confirmation, login prompt | pending |
| HeartButton / LikeButton | animation + reduced-motion | pressed |
| **LinkedItemsStrip** | product/service mini-cards with Add to cart / Enquire / View | - |
| ShopThisVideoSheet | list of all linked items | - |
| VideoGrid + VideoCard | poster, views, duration | - |
| **MediaConsentToggle** | "Also show this in my business Gallery / Videos & Reels" + explanation + default | - |
| ShareSheet | WhatsApp, copy link, native share | - |
| **SearchResultGroup** | header with count, See all, explanation label | - |
## G. Admin components
PermissionMatrix (modules x actions, unsaved indicator, before/after), RoleForm, ConfirmImpactDialog, ReviewBeforeSendSummary (communications), ApprovalDocumentViewer, AuditDiff, ChartCard with supported Graph metrics and an accessible table alternative (no Candle/OHLC controls), CityCard, ZoneEditor (polygon), ModerationQueueItem, KeywordMappingForm + PreviewPanel.
## H. Hooks and utilities (shared)
`useUrlState` (schema-validated query params), `useBackScroll` (scroll restoration), `useDebounce`, `useMediaQuery`, `useCart`, `useAuthGate` (login prompt + return), `useFollow`, `useLike`, `useI18n`, `formatInr(paise)`, `formatDateIst`, `formatTimeIst`, `formatDistanceKm`, `formatPhone`, `slugify`, `buildEmbedUrl` (server), zod schemas shared with API.
