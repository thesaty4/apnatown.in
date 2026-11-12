# BE: geo

Features: F-LC-001–F-LC-005, F-SA-004 | Rules: BR-01, BR-02, BR-11, BR-12, BR-14 | State machines: ST-city | Depends on: none | Used by: users, businesses, services, search, cart-checkout, delivery, admin

Frontend counterpart: [FE geo](../fe/geo.md).

## Responsibility

Own cities, customer-facing areas, service zones, delivery-fee slabs and service-area waitlist requests. Resolve optional location input and provide authoritative city/zone serviceability. Business distance and delivery-radius rules remain with `businesses`/`search`; geo does not own shop or provider pins.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `cities` | `id uuid PK` (UUIDv7, app-generated); `slug text NOT NULL UNIQUE`; `name_en/name_hi text NOT NULL`; `state_code char(2) NOT NULL` (verified Indian state/UT GST code); `status text NOT NULL CHECK enabled/disabled/coming_soon`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at timestamptz NOT NULL DEFAULT now()` | Unique `slug`; `(status,name_en)` for city picker and admin list |
| `areas` | `id uuid PK`; `city_id uuid NOT NULL FK cities`; `slug text NOT NULL`; `name_en/name_hi text NOT NULL`; `pin_code text NULL CHECK six digits when present`; `centroid geography(Point,4326) NULL`; timestamps as above; UNIQUE `(city_id,slug)` | `(city_id,name_en)` for area picker; `(city_id,pin_code)` for PIN lookup |
| `zones` | `id uuid PK`; `city_id uuid NOT NULL FK cities`; `name text NOT NULL`; `polygon geometry(Polygon,4326) NOT NULL`; `status text NOT NULL CHECK active/paused`; `version int NOT NULL DEFAULT 1`; timestamps as above | GiST on `polygon` for point-in-zone; `(city_id,status)` for city detail and serviceability |
| `zone_fee_slabs` | `zone_id uuid NOT NULL FK zones`; `sequence smallint NOT NULL CHECK 1..3`; `upper_distance_km numeric(5,2) NOT NULL CHECK >=0`; `fee_paise bigint NOT NULL CHECK >=0`; `created_at/updated_at timestamptz NOT NULL DEFAULT now()`; PK `(zone_id,sequence)`; UNIQUE `(zone_id,upper_distance_km)` | PK supports ordered slab lookup by zone |
| `service_area_waitlist` | `id uuid PK`; `city_id uuid NULL FK cities` (NULL when GPS did not resolve a city; Q-35); `phone_ciphertext text NOT NULL`; `phone_lookup_hash bytea NOT NULL`; `requested_at timestamptz NOT NULL DEFAULT now()` | `(city_id,requested_at DESC)` for city-card waitlist count |

City states map to the prototype's `active`/`planned`/`soon` labels as enabled/disabled/coming_soon. Preserve the observed toggle edges and keep Q-17/G-11 visible. Hindi city names are required; see Q-36/G-12. Active-zone overlap is rejected until Q-37 is resolved.

The additive Geo migrations and public city/area reads are implemented. Their
keyset indexes append `id` to the listed name sorts; area-name filtering uses
a shared EN/HI `gin_trgm_ops` index. Cities sort by `(status,name_en,id)`, areas
by `(name_en,id)`, ascending. Area query text is a literal case-insensitive
substring, not a SQL wildcard. Cursors are signed and bound to endpoint,
city and normalized filters. Both reads share a 60-per-minute/IP limit and
page default 20/hard cap 50. No locations or fees are seeded; migrations,
query plans and HTTP behavior remain unverified against a live database.
The `GeoScopePort.assertAreasInCity` read-validation capability is implemented
for Users saved addresses, including city-only selection and transaction-bound
reference locks. Location/zone resolution, other internal owner capabilities,
waitlist writes and admin mutations remain separate implementation slices.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/geo/cities?cursor=&limit=` | Public; no location required | → `{items:[{id,slug,nameEn,nameHi,status}],nextCursor}`; limit ≤50 | `VALIDATION_ERROR` | Yes | F-LC-001, F-LC-005 |
| GET | `/geo/cities/{cityId}/areas?query=&pinCode=&cursor=&limit=` | Public; query fields allow-listed | → `{items:[{id,cityId,slug,nameEn,nameHi,pinCode}],nextCursor}`; limit ≤50 | `CITY_NOT_FOUND`, `PIN_CODE_INVALID` | Yes | F-LC-001 |
| POST | `/geo/location/resolve` | Public; rate limited | Exactly one of `{lat,lng}`, `{pinCode}`, `{areaId}` → city/area/status and optional matching zone | `LOCATION_INVALID`, `LOCATION_UNRESOLVED`, `CITY_NOT_FOUND`, `AREA_NOT_FOUND` | Yes | F-LC-001, F-LC-004, F-LC-005 |
| POST | `/geo/waitlist` | Public; rate limited; explicit phone submission | `{cityId?,phone}` → `{requestId}` | `VALIDATION_ERROR`, `CITY_NOT_FOUND` | Yes via `Idempotency-Key` | F-LC-005 |
| GET | `/geo/admin/cities?cursor=&limit=` | `super_admin`; platform-wide; no city/area grant or module permission applies | → `{items,nextCursor}` city DTOs with area/zone/waitlist counts; limit ≤50 | `FORBIDDEN` | Yes | F-SA-004, S-SUPR-04 |
| POST | `/geo/admin/cities` | `super_admin`; platform-wide; audit required | `{nameEn,nameHi,stateCode,status}` → city DTO; state code selected from verified GST state/UT allow-list | `VALIDATION_ERROR`, `CITY_SLUG_CONFLICT` | Yes via `Idempotency-Key` | F-SA-004 |
| GET | `/geo/admin/cities/{cityId}` | `super_admin`; platform-wide | → city, areas, zones and fee slabs; admin assignments are read from `admin` | `CITY_NOT_FOUND` | Yes | F-SA-004, S-SUPR-05 |
| POST | `/geo/admin/cities/{cityId}/status` | `super_admin`; platform-wide; audit required | `{action:"enable"\|"disable",expectedVersion}` → updated city | `CITY_NOT_FOUND`, `CITY_TRANSITION_INVALID`, `GEO_VERSION_CONFLICT` | Yes via `Idempotency-Key` | F-SA-004 |
| POST | `/geo/admin/cities/{cityId}/zones` | `super_admin`; platform-wide; audit required | `{name,polygon,feeSlabs:[{upperDistanceKm,feePaise}],status}` → zone DTO | `CITY_NOT_FOUND`, `ZONE_INVALID`, `FEE_SLAB_INVALID` | Yes via `Idempotency-Key` | F-SA-004 |
| PATCH | `/geo/admin/zones/{zoneId}` | `super_admin`; platform-wide; audit required | Allow-listed `{name?,polygon?,feeSlabs?:[{upperDistanceKm,feePaise}],status?,expectedVersion}` → zone DTO | `ZONE_NOT_FOUND`, `ZONE_INVALID`, `FEE_SLAB_INVALID`, `GEO_VERSION_CONFLICT` | Yes via `Idempotency-Key` | F-SA-004 |
| DELETE | `/geo/admin/zones/{zoneId}` | `super_admin`; platform-wide; audit required | `{expectedVersion}` → deletion acknowledgement | `ZONE_NOT_FOUND`, `GEO_VERSION_CONFLICT` | Yes via `Idempotency-Key` | F-SA-004 |

All responses use the shared error envelope and OpenAPI DTOs in [backend-shared.md](../../_foundation/backend-shared.md). City-card assigned-admin counts and detail rows come from `admin`; `geo` does not read `admin_scopes` directly.

`GeoTaxPort.stateForCity({cityId},uow?) -> {stateCode,cityVersion}` resolves the fiscal destination from the authoritative address city; never infer state from client locale, phone or IP. New city creation requires the verified state code. Forward migration backfills existing cities from verified geography only; unresolved legacy rows remain fiscally unavailable and cannot silently assume Uttar Pradesh. Historical order tax snapshots are not rewritten. Admin city DTOs include `stateCode`; correction is a versioned, super-admin-only audited PATCH of that field, validated against the allow-list.

Correction contract: `PATCH /geo/admin/cities/{cityId} {stateCode,expectedVersion}` with `Idempotency-Key`; super_admin only, atomic audit/version, same city DTO, `VALIDATION_ERROR`/`CITY_NOT_FOUND`/`GEO_VERSION_CONFLICT`. Stage migration with nullable state code, block affected fiscal operations, verify/backfill, then validate NOT NULL; never invent a value to satisfy the constraint.

Internal `GeoDeliveryPort.quoteDeliveryFee({cityId,destination,origin})` resolves the destination zone and distance, then returns `{zoneId?,distanceKm,feePaise}` to `cart-checkout`; callers never read geo tables or submit a client fee. For an enabled, resolved city without a matching active zone, use the global default schedule from `settings` (Q-38). `businesses`/`cart-checkout` still enforce each shop's delivery radius. Rider earning rules remain in `settings` and are applied by `delivery` at job completion.

`GeoScopePort.resolve({areaId,location?}) -> {cityId,areaId,cityStatus,zoneId?}` validates an area and optionally resolves a containing zone. Area IDs and delivery-zone IDs are not interchangeable; changing a fee polygon never grants admin permissions. Admin checks both old and destination areas on moves; zone-targeted communications use actual zone membership, not all recipients in the city. `GeoScopePort.assertAreasInCity({cityId,areaIds})` rejects mismatched IDs before any owner write.

`GeoAdminReadPort.options(ctx,{kind:'city'|'area'|'zone',cityId?,q?,cursor?,limit?}) -> Page<GeoScopeOption>` returns authorized options, limit ≤50: city `{kind,id,nameEn,nameHi,status,version}`, area `{kind,id,cityId,nameEn,nameHi}`, zone `{kind,id,cityId,name,status,version}`. Choices do not grant authority. `summary(ctx) -> {enabledCities,waitlistSignups}` uses real records, super_admin only.
`GeoAdminReadPort.resolveZoneScope({zoneIds[]}) -> {zones:[{id,cityId,areaIds[],version}],revision,unresolved}` supplies only authoritative area relationships. Area centroids/PINs do not establish full polygon containment. Open question: area-boundary/zone-area mapping source is not supplied; mark it unresolved for area-only authorization instead of fabricating a mapping. An explicit whole-city grant may authorize its known city/zone without claiming an area mapping; recipient zone membership still requires authoritative location.

The fee port is for `apna_town_rider` delivery only. Self-delivery uses the business's configured flat fee and pickup uses zero; callers cannot accidentally apply Geo slabs to both modes. Resolve current enabled city and versioned zone/settings state again at checkout commitment, not only from a cached discovery response.

## Rules and use-cases

1. Location is optional. Resolve GPS coordinates through the `MapsPort` and configured PostGIS boundaries; manual area/PIN selection remains available when permission is denied, GPS is off, or reverse geocoding fails. Do not persist browse-only coordinates; an explicitly saved address may persist its selected point through `users`.
2. Resolve a PIN only when it is six digits; a submitted area must belong to the requested city. Point coordinates must be finite and within latitude/longitude bounds.
3. Keep proximity and deliverability distinct: return city/zone serviceability only. `businesses`/`search` combine that result with each business's own delivery mode/radius to label “Nearby” versus “Delivers to your address”.
4. A disabled city cannot serve new discovery or checkout requests; disabling never cancels in-flight orders. Enable/disable requires the confirmation UI naming the impact.
5. Apply the first zone slab whose upper-distance bound includes the requested distance; beyond its last band, use the last fee as the prototype does. When no active zone matches inside an enabled, resolved city, use the global default schedule from `settings`; business-specific radius still controls eligibility. An unresolved/out-of-city point is not serviceable (G-13/Q-38). Store and return fees in integer paise (BR-01); sample amounts are not defaults (Q-09).
6. Zone geometry must be a valid, non-empty GeoJSON polygon with coordinates in `[longitude,latitude]` order. Slab distances are non-negative and strictly increasing, with at most three rows as shown in the prototype editor; fee values are non-negative paise. Reject intersecting active zones in the same city pending Q-37.
7. Preserve the prototype city status controls: create may choose enabled, disabled or coming_soon; Disable changes enabled to coming_soon; Enable changes disabled/coming_soon to enabled. This differs from a literal enabled→disabled edge (G-11); do not add other transitions.
8. A waitlist request stores only a valid 10-digit Indian phone encrypted plus a lookup hash and the known selected city, if any. It is not marketing consent; do not send a message until Q-35 defines target, channel and retention.
9. City/zone writes use optimistic version checks, `@Roles('super_admin')`, and the shared audit interceptor with before/after values (BR-12). Regular admins are denied even if assigned to the city.

## Events and jobs

- Publish `geo.city.status_changed` and `geo.zone.changed` through the outbox in the same transaction as the write. Consumers invalidate city/serviceability and checkout quote caches; checkout still checks current city/zone state synchronously.
- Retry transient outbox delivery with the shared bounded exponential-backoff policy; consumers deduplicate by event ID. No waitlist notification job is created until Q-35 is resolved.

## Error codes added

| Code | Status | Message key |
|---|---:|---|
| `CITY_NOT_FOUND` | 404 | `geo.city.notFound` |
| `CITY_SLUG_CONFLICT` | 409 | `geo.city.slugConflict` |
| `CITY_TRANSITION_INVALID` | 409 | `geo.city.transitionInvalid` |
| `AREA_NOT_FOUND` | 404 | `geo.area.notFound` |
| `ZONE_NOT_FOUND` | 404 | `geo.zone.notFound` |
| `LOCATION_INVALID` | 422 | `geo.location.invalid` |
| `LOCATION_UNRESOLVED` | 422 | `geo.location.unresolved` |
| `PIN_CODE_INVALID` | 422 | `geo.pin.invalid` |
| `ZONE_INVALID` | 422 | `geo.zone.invalid` |
| `FEE_SLAB_INVALID` | 422 | `geo.feeSlab.invalid` |
| `GEO_VERSION_CONFLICT` | 409 | `geo.versionConflict` |

`FORBIDDEN`, `VALIDATION_ERROR` and rate-limit errors use the shared catalogue.

## Acceptance criteria

1. Given location access is denied or GPS is unavailable, when a customer opens the picker, then area/PIN selection remains usable and location is not required to browse.
2. Given valid GPS or PIN input, when location resolves, then the response identifies the matched city/area and does not persist raw coordinates.
3. Given a business is nearby but outside its delivery range, when results render, then geo proximity is not presented as delivery availability.
4. Given a city is disabled, when a new discovery/checkout request resolves it, then it is unavailable while in-flight orders remain unchanged.
5. Given an active zone and eligible distance, when a delivery quote asks for a fee, then the matching slab is returned in paise; distance beyond the last band uses that last fee, with business delivery radius checked separately.
6. Given a regular admin or customer calls a city/zone mutation, when authorization runs, then the server denies it and records no change.
7. Given a super admin updates a city or zone with a stale version, when saved, then the write returns `GEO_VERSION_CONFLICT` and audit data is not fabricated.
8. Given an invalid polygon, overlapping active zone or invalid slab order, when saved, then the mutation is rejected without partial writes.
9. Given a valid phone is submitted to notify-me, when accepted, then the encrypted request is counted for its known city and no outbound message is sent.
10. Given a zone is deleted, when deletion is confirmed, then an enabled, resolved city uses the configured default delivery-fee schedule and the zone change is audited.
11. Given two areas share a city, when an area-scoped caller supplies the other area's ID or a zone ID in its place, then the owner operation is denied without broadening to city-wide access.
12. Given self-delivery or pickup is selected, when checkout computes the fee, then it uses the business flat fee or zero respectively, not platform-rider slabs.
13. Given unknown zone-area relationships, when an area-only admin requests broader zone authority, then no same-city/centroid inference grants it; scoped options paginate without broadening access.

## Tests

- Unit: PIN/coordinate/phone validation, city-status mapping/edges, point-to-zone lookup, zone/default fee boundaries and beyond-last-band behavior.
- Integration: public location resolution, city/zone CRUD and default-fee fallback, PostGIS overlap validation, outbox cache invalidation, waitlist encryption/count.
- Authorization negatives: customer and area-scoped admin attempting every geo admin mutation; cross-city area IDs; stale version; duplicate idempotency key.
