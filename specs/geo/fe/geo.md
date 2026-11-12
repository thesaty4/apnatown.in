# FE: geo

Features: F-LC-001, F-LC-002, F-LC-003, F-LC-004, F-LC-005, F-SA-004 | Screens: S-CUST-01, S-CUST-02, S-CUST-06, S-CUST-07, S-CUST-09, S-SUPR-04, S-SUPR-05 | Flows: J10

API integration: [shared React Query contract](../../_foundation/frontend-shared.md#api-integration-with-react-query), including private location-context keys.

Backend counterpart: [BE geo](../be/geo.md).
Map implementation: [Leaflet/OSM contract](../../_foundation/media-and-maps.md#leaflet-and-openstreetmap).
Use one lazy client-only shared `MapView`, direct Leaflet bindings and Geoman
Free for polygon editing; API reads/writes remain React Query-owned.
Keep attribution, HTTP tile caching and origin-only referrers; no offline/
prefetched tiles or implicit geocoding service. A failed basemap retains the
list/manual inputs and explicit retry, never a fabricated empty result.

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/` (location bar and picker overlay) | S-CUST-01 | ISR home; picker is a client island | Guest or customer | Home index policy |
| `/explore` (map/list controls) | S-CUST-02 | SSR URL-derived results; map/list controls are a client island | Guest or customer | `noindex,follow` |
| `/shop/:slug`, `/provider/:slug`, `/service/:slug` (directions action only) | S-CUST-06, S-CUST-07, S-CUST-09 | ISR public page; geo supplies no page data beyond coordinates | Guest or customer | Owning module's policy |
| `/super-admin/cities` | S-SUPR-04 | SSR role gate; client city actions | `super_admin` | `noindex` |
| `/super-admin/cities/:id` | S-SUPR-05 | SSR role gate; client polygon editor and zone form | `super_admin` | `noindex` |

## Screens

### S-CUST-01 — Home location picker (overlay on `/`)

- Screenshots: `d-customer-home.jpg`, `m-customer-home.jpg`.
- Layout: sticky home location bar; mobile sheet and desktop popover use shared `Sheet`.
- Data: paginated `GET /geo/cities` and `GET /geo/cities/{cityId}/areas`, `POST /geo/location/resolve`, `POST /geo/waitlist`; the picker loads further options without silently truncating the city/area set.
- Special states: location denied, GPS off/unavailable, outside service area; home also retains its own outside-area banner.
- Interactions: “Use my current location”; choose an area; enter a six-digit PIN; select another city; dismiss without selecting a location. Keep browse-only location in active app-session state; persist coordinates only when explicitly saved as an address through `users` (Q-34).
- Validation/rules: location is optional (BR-11); invalid PIN retains the form and shows field-level error; notify-me requires a valid phone.
- Acceptance:
  - Given a customer denies location permission, when the picker is used, then manual area/PIN options remain available.
  - Given a GPS location resolves outside a supported city, when notify-me is submitted, then the request is acknowledged without claiming a notification was sent.
  - Given no location is selected, when home renders, then browsing remains available.

### S-CUST-02 — Explore map/list controls (`/explore`)

- Screenshots: `d-customer-explore.jpg`, `m-customer-explore.jpg`.
- Layout: shared map/list toggle; map shows the search-owned shop/provider pins, radius slider (1–12 km, default 6), and “you are here” only when location is available.
- Data: search-owned result/facet API plus geo location resolution; exact filter URL schema is owned by Search and follows F-EX-008.
- Special states: existing per-tab empty and count-loading states; empty map and unavailable location do not imply zero serviceability.
- Interactions: switch map/list; adjust radius; select a pin/list card; show distance separately from “Delivers to your address”. Do not reset another Explore tab's URL state.
- Validation/rules: radius bounds are 1–12 km with default 6; results and deliverability labels remain server-derived.
- Acceptance:
  - Given location is absent, when map mode opens, then results remain usable without a fabricated “you are here” marker.
  - Given a shop is nearby but cannot deliver to the selected address, when its result renders, then distance and delivery status are distinct.
  - Given map/list mode changes, when Back is used, then Search's URL-state and scroll-restoration contract remains intact.

### S-CUST-06 / S-CUST-07 / S-CUST-09 — Directions action

- Screenshots: `d-customer-biz-b1.jpg`, `d-customer-svc-s1.jpg`, `m-customer-svc-s1.jpg`, `d-customer-service-b4-sv2.jpg`, `m-customer-service-b4-sv2.jpg`.
- Layout/data: owned by Businesses or Services; geo behavior is limited to the Directions action and destination coordinates.
- Interactions: open the destination in the device maps app; never navigate to a client-supplied URL.
- Acceptance:
  - Given a public listing has destination coordinates, when Directions is activated, then the device maps app receives that destination.
  - Given coordinates are absent, when the action is rendered, then no broken or fabricated destination is offered.

### S-SUPR-04 — Cities (`/super-admin/cities`)

- Screenshots: `d-super-xgeo.jpg`, `m-super-xgeo.jpg`.
- Layout: city cards with status, zone/area/admin/waitlist counts, open-city action, enable/disable, and Add city; status always includes icon and text.
- Data: keyset `GET /geo/admin/cities?cursor=&limit=` and POST creation; append further cards with shared pagination. Assigned-admin counts come from Admin, not geo-owned tables.
- Special states: empty city list.
- Interactions: Add city collects English/Hindi names and verified GST state/UT code; show/correct that code in city detail with a separate versioned audited Save. Explain that it affects new fiscal quotes, not issued invoices. Enable/disable keeps the existing impact confirmation.
- Validation/rules: super admin only; city changes are audited; disabling stops new discovery/orders but open orders continue (BR-12).
- Acceptance:
  - Given a non-super-admin opens or mutates city management, when authorization runs, then protected city data/actions are denied.
  - Given a super admin disables an enabled city, when they confirm the named impact, then the state and counts refresh from the server.
  - Given Hindi or dark theme is active, when cards render on mobile, then labels wrap and status remains understandable without color.

### S-SUPR-05 — City detail and zones (`/super-admin/cities/:id`)

- Screenshots: `d-super-xcity-padrauna.jpg`, `d-super-xcity-kasia.jpg`, `m-super-xcity-kasia.jpg`, `m-super-xcity-padrauna.jpg`.
- Layout: city status and action; `MapView` with `ZoneEditor`; zone list with fee slabs and assigned-admin section. Admin assignments use the Admin module API.
- Data: `GET /geo/admin/cities/{cityId}`, zone create/update/delete endpoints, and Admin-owned assignment data.
- Special states: no zones yet.
- Interactions: draw/edit polygon; undo/cancel/save; edit zone name, up to three ordered distance/fee rows and active/paused state; delete zone only after the confirmation naming default-fee fallback; zone mutations require server confirmation of current version.
- Validation/rules: fee inputs display INR and serialize as paise (BR-01); invalid/overlapping polygons or non-monotonic slabs keep the editor open with errors. Deleting a zone uses the prototype confirmation that delivery falls back to the city default schedule (G-13/Q-38).
- Acceptance:
  - Given a city has no zones, when detail opens, then the no-zones state offers Draw zone.
  - Given a super admin saves an invalid polygon or slab order, when the server rejects it, then the editor preserves entered values and shows field errors.
  - Given a zone changes, when save succeeds, then the map/list refresh from server values and the action is auditable.
  - Given a super admin deletes a zone, when they confirm the stated fallback, then the city default schedule is used for eligible addresses and the UI confirms deletion.
  - Given keyboard-only use or failed tiles, when editing a zone, then the coordinate/list alternative retains undo/cancel/save; no paid plugin capability is required and server validation remains authoritative.

## Components and i18n

- Shared: `MapView`, `CityCard`, `ZoneEditor`, `PhoneInput`, `Input`, `Select`, `Button`, `Sheet`, `ConfirmImpactDialog`.
- Feature components: `LocationPicker`, `LocationBar`, `CityStatusBadge`.
- Key prefixes: `geo.location.*`, `geo.cities.*`, `geo.zones.*`; use approved EN/HI catalogue; do not auto-translate city names or invent legal/consent copy.
- Auth/permission, offline, skeleton, error/retry and no-permission use the shared state set; no business or permission logic lives in UI.

## Analytics and verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Analytics: no feature-specific events are prescribed.
- Manual UI: location picker validation/permission denial; map/list/radius controls; city status confirmation; zone editor geometry, slab validation and keyboard operation.
- Manual journey: location optional/manual fallback and J10 city/zone admin journey; permission-negative, long Hindi, dark mode and 360px viewport.
