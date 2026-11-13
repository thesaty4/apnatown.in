# BE: settings

Features: F-SA-005, F-AC-005, F-AC-006, F-X-009 | Rules: BR-01, BR-02, BR-11, BR-12 | State machines: none | Depends on: audit; read by cart-checkout, delivery, geo, payments, offers, orders, reviews, media-videos, notifications, communications, search (SEO), web (flags).

Frontend counterpart: [FE settings](../fe/settings.md)

Contents: [Tables](#tables) · [Endpoints](#endpoints) · [Atomic saves](#atomic-section-save-boundaries) · [Support](#support-handoff-existing-admin-overview) · [Maintenance](#maintenance-admission-matrix) · [Acceptance](#acceptance-criteria)

## Responsibility

Own versioned platform configuration (branding, default delivery slabs, rider earning, commission, platform fee, plans, promotion fees, payment methods, refund window, review rules, upload limits, integration choices, SEO defaults), feature flags, legal page content and support messages. Provide a typed, cached `SettingsService` read port so other modules never hard-code these values. Maintenance mode and system-page error contracts.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `settings` | `key text PK CHECK IN ('branding','delivery','rider_earning','commission','plans','promotion_fees','payments','policies','reviews','uploads','integrations','seo','tax')`; `value jsonb NOT NULL` (zod-validated per key); `version int NOT NULL DEFAULT 1`; `updated_by uuid FK users`; `updated_at timestamptz` | PK |
| `feature_flags` | `key text PK CHECK IN ('reviews','guest_browse','whatsapp','booking','donations','payments_online','payments_cod','maintenance')`; `enabled bool NOT NULL`; `version int NOT NULL DEFAULT 1`; `updated_by uuid FK users`; `updated_at` | PK |
| `legal_pages` | `slug text PK CHECK IN ('terms','privacy','refund','about')`; `title_en/title_hi text NOT NULL`; `body_en/body_hi text NOT NULL` (sanitised Markdown subset); `version int NOT NULL DEFAULT 1`; `published_at timestamptz NOT NULL`; `updated_by uuid` | PK |
| `support_messages` | `id uuid PK`; `user_id uuid NULL FK users`; `message text NOT NULL CHECK trimmed length 1–1000`; `city_id/area_id uuid NULL` (trusted resolved scope; both null for unscoped guest); `created_at timestamptz NOT NULL`; no ticket status/assignee/reply fields | `(city_id,area_id,created_at DESC,id DESC)` existing admin alerts; `(user_id,created_at,id)` authorized account processing |

**Value shapes:** `delivery {slabs:[{uptoKm,feePaise}]}` (1–3 ascending; Geo owns zone overrides); `rider_earning {basePaise,perKmPaise}`; `commission {defaultBps,platformFeePaise}`; `plans [{code,nameEn,nameHi,pricePaise,commissionBps}]`; `promotion_fees [{code,nameEn,nameHi,pricePaise}]`; `payments {gatewayId:null|string}`; `policies {refundWindowHours}`; `reviews {ruleEn,ruleHi,blockedWords[]}`; `uploads {purposes:{purpose:{allowedMimeTypes[],maxBytes,maxDurationSeconds?}}}`; `integrations {smsProviderId:null|string,whatsappNumber:null|string,emailSender:null|string,supportCallE164:null|string,supportWhatsappE164:null|string}`; `seo {titleEn,titleHi,descriptionEn,descriptionHi}`; `branding {nameEn,nameHi,taglineEn,taglineHi}`.
Money is integer paise, bps integer 0–10,000, distance finite/nonnegative; policy limits are approved configuration, not invented fees/refund periods. Prototype numbers in BR-01/defaults are sample data only. Provider IDs must correspond to approved configured adapters; null means unconfigured, not a secretly selected vendor.

**Secrets** (gateway keys, WhatsApp token, SMS keys) are never stored here or returned; they live in the secret store/env. The API returns `{configured: boolean}` per integration only.

### Resolved launch configuration

The 2026-11-11 decisions are implementation requirements, not sample commercial values. Existing `plans` rows additionally require `{enabled,premium,billingPeriodMonths:1}`; paid plans require `pricePaise>0`, free Basic is non-Premium. `promotion_fees` adds `{enabled,kind:'homepage_banner'|'featured_business',durationDays:7}`. Price is tax-inclusive and explicit; no production plan/campaign is auto-created from prototype prices. [Payments](../../payments/be/payments.md#launch-billing-policy) owns renewal/cancellation/timing; Settings only validates/stores configuration.

- Add `tax={platformSupplier:SupplierTaxProfile,classifications:[{code,hsnOrSac,unitCode,supplyType:'taxable'|'exempt'|'nil_rated',gstRateBps,cessRateBps}],feeTaxCodes:{platformFee,platformDelivery,subscription,promotion,commission},versionEvidence}`. Semantics follow [Orders](../../orders/be/orders.md#invoice-and-tax-policy); unique codes, integer rates 0..10000 bps, valid references and at most 5000 classifications/version. Exempt/nil-rated requires zero tax; zero never substitutes for missing verification. Super Admin confirms external fiscal verification with a private evidence reference. Secrets remain adapter-only.
- `tax` has its own versioned single-key Save in the existing Payments settings section. Reject incomplete/invalid enabled products, unresolved tax references and incompatible platform supplier/IRN adapter capability. Fiscal profile/rates are effective only for new quotes; existing quote/purchase/order snapshots retain their versions. `SettingsTaxPort.resolve({taxCodes,supplierRef,placeOfSupplyStateCode,at},uow?)` returns a complete immutable policy snapshot or `configuration_required`, never guessed tax.
- `uploads` uses the exact public-image schema/defaults/hard ceilings in [Media](../../media-videos/be/media-videos.md#public-image-policy), stored as versioned deployment seeds. Super Admin may lower limits or disable a purpose but cannot raise hard ceilings or allow active-content formats. An independent Upload policies Save uses the existing single-key `uploads` endpoint; it is not secretly added to `policies_reviews` group membership.
- Image readiness additionally requires the selected Cloudinary adapter and
  its server-only configuration per [media and maps](../../_foundation/media-and-maps.md#configuration-and-readiness).
  Return readiness/missing-field names only, not credentials or delivery URLs.
  Public-image settings cannot enable video upload, change a private-document
  purpose, or choose arbitrary embed/tile hosts. Those deployment boundaries
  do not become new admin-editable provider/secret forms.
- `GET /super-admin/settings` adds `readiness:{plans,promotions,tax,images}` with `{ready,missingFields[]}`. `/settings/public` exposes only safe upload constraints, public prices/flags and checkout availability, never supplier verification evidence or internal tax configuration. A missing operator price/legal identity is a clear setup task; no open algorithm or sample-money fallback remains.
- Acceptance: Given invalid tax code, an enabled plan lacking price, or an upload override above a hard ceiling, when saving, then the atomic versioned update fails and previous configuration survives. Given a new valid version, then only new quotes use it; replayed payments/documents keep their frozen values.

## Endpoints

| Method | Path | Auth | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/settings/public` | Public safe projection; no-store for current flags; maintenance admits it | → branding, public flags, payment methods, approved refund/upload policy, SEO, **`support:{callPhoneE164,whatsappPhoneE164}`** (nullable), version metadata; no credentials/sender secrets | — | Yes | F-X-009, F-AC-005, all clients |
| GET | `/super-admin/settings` | super_admin | → all keys with `version`, flags, `integrationStatus{gateway,whatsapp,sms,email:{configured}}` | — | Yes | F-SA-005, S-SUPR-06 |
| PUT | `/super-admin/settings/{key}` | super_admin; audited; ungrouped section keys only | `{value,expectedVersion}` → saved key | `SETTINGS_INVALID`, `SETTINGS_VERSION_CONFLICT`, `SETTINGS_GROUP_REQUIRED` | Key/version | F-SA-005 |
| PUT | `/super-admin/settings/groups/{group}` | super_admin; one transaction/audit | `{updates:[{key,value,expectedVersion}]}` → `{group,values:[{key,value,version}],changeSetId}`; exact membership below | `SETTINGS_INVALID`, `SETTINGS_VERSION_CONFLICT` | Required key + all versions | F-SA-005 |
| PUT | `/super-admin/feature-flags/{key}` | super_admin; audited | `{enabled,expectedVersion}` → flag/version; future flags cannot be enabled | `SETTINGS_INVALID`, `SETTINGS_VERSION_CONFLICT`, `FEATURE_NOT_AVAILABLE` | Key/version | F-SA-005 |
| GET | `/legal/{slug}` | Public; ISR tag `legal:{slug}` | → title/body in locale, `updatedAt` | `LEGAL_PAGE_NOT_FOUND` | Yes | F-AC-006, S-CUST-31, S-CUST-32, S-CUST-33 |
| PUT | `/super-admin/legal/{slug}` | super_admin; audited | `{titleEn,titleHi,bodyEn,bodyHi,expectedVersion}` → page (sanitised) | `SETTINGS_INVALID`, `SETTINGS_VERSION_CONFLICT` | Yes | F-SA-005 |
| POST | `/support/messages` | Public guest or authenticated; no phone/login required; abuse-limited | **`{message}`** → `202 {id,status:'accepted'}` after message + admin-notification outbox commit | `VALIDATION_ERROR`, `RATE_LIMITED` | Required key | F-AC-005, S-CUST-30 |
| GET | `/admin/support/messages/{id}` | Admin `users:view` + exact resolved scope; super_admin for unscoped/global | → `{id,message,createdAt,authorLabel?,scope}` for existing overview alert detail; no reporter/contact export | `SUPPORT_MESSAGE_NOT_FOUND` | Yes | S-ADMN-01 |
| GET | `/health` | Public, always admitted | HTTP 200 `{status:'ok'\|'maintenance',checkedAt}`; no-store, no internal dependency/secrets dump | — | Yes | F-X-009 |

## Atomic section save boundaries

| Existing form / group | Allowed keys / mutation boundary |
|---|---|
| Branding | single `branding` PUT |
| Delivery & rider pay / `delivery_rider_pay` | **delivery + rider_earning** together |
| Commission, plans & promotions / `commission_plans` | **commission + plans + promotion_fees** together |
| Policies & reviews / `policies_reviews` | **policies + reviews** together |
| Payments | gateway `payments` single-key Save; existing online/COD toggles each use versioned flag PUT |
| Notifications & WhatsApp | `integrations` single-key Save (including support Call/WA configuration); WhatsApp flag is the existing separate immediate toggle |
| SEO defaults / feature flags / legal pages | `seo` single-key Save / versioned flag PUT / per-slug legal PUT |

1. A grouped Save supplies every allowed key once with its expected version, rejects missing/duplicate/extra keys, validates the whole group, locks keys in stable order, then commits all values, versions, before/after audit and outbox atomically. One stale/invalid key rolls **all** back; no partial success or “Saved” for half a form.
2. Single-key PUT refuses grouped member keys (`SETTINGS_GROUP_REQUIRED`); API clients cannot bypass the UI's transactional boundary. Same mutation key+payload replays the saved group; changed payload conflicts.
3. `SettingsService.getGroup(group)` reads/caches a coherent version tuple, never independently cached halves. Existing order/payment/delivery snapshots remain unchanged; new operations use the newly committed approved versions only.
4. `SettingsService.get(key)` may cache noncritical content ≤60 s with event invalidation. **`getCurrentFlag(key)`** for maintenance, WhatsApp and money/eligibility gates uses an authoritative current/version-validated read before the operation/send/retry; delayed outbox invalidation cannot authorize a disabled channel.
5. `booking` and `donations` remain **false and non-enablable**. Reject enabled=true until their separately approved features exist; no booking/donation backend is introduced.

## Support handoff: existing Admin overview

- Final `js7.js:34–35` is a public **message-only** form and immediate admin notification. Accept required trimmed message 1–1000; no invented guest phone requirement. Derive authenticated user ID, never trust submitted author/scope/contact fields.
- Atomic intake → `support_messages` + **`support.message_submitted {messageId,scope:{cityId,areaId}}`** outbox. Notifications routes to current users:view admins in a trusted known area, or super admins for unscoped/global guests. Never broadcast an unscoped guest's text to every area admin.
- Existing destination **`/admin/overview?supportMessageId={id}`** loads the protected GET above. `SettingsSupportReadPort.alerts(ctx,{cursor?,limit?}) -> Page<{id,createdAt,linkPath}>`, `detail(ctx,{messageId}) -> {id,message,createdAt,authorLabel?,scope}`, and `notificationContext({messageId}) -> {scope,linkPath}` supply Admin/Notifications. Scope is checked before alerts/counts/detail.
- Existing jobless rider support delegates to `SupportIntakePort.create({userId,message,source:'rider',sourceKey}) -> {id,status:'accepted'}`. Delivery verifies the actor; Settings applies the same intake/abuse/scope/outbox rules and deduplicates sourceKey. No separate rider ticket or spoofable public source/user field.
- Rate limit 5/hour per authenticated user/anonymous subject and abuse-IP hash; bounded body, plain-text rendering, CSRF/origin protection and idempotent replay. Do not log message/IP/PII; no silent drop after returning accepted.
- Public support contacts come only from configured `integrations.supportCallE164/supportWhatsappE164` via the safe public DTO. Validate E.164; absent config is null and no fabricated prototype number is rendered. Call/WA are user-initiated external links, not an outbound marketing API.
- No invented inbox, ticket lifecycle, reply API, assignee, contact requirement or response SLA. Follow-up to an anonymous message is an explicit product decision; acceptance acknowledgement does not promise a response channel.
- For account-linked messages, `SettingsUserDataPort` implements Users' internal `exportPage({userId,cursor,limit})` (own intake only, stable cursor, ≤50) and `erase({userId,requestId,policyVersion}) -> {receipt,status:'completed'|'blocked',reasonCode?}`. Q-32/Q-13 gate retention/anonymization; retries are idempotent. Anonymous messages are not attached by name/phone guessing and admin audit/notification records stay with their owners.

## Maintenance admission matrix

The maintenance guard classifies named routes/operations, not “all non-super-admin calls”. Normal role/ownership/scope, signatures, CSRF, rate limits and state/idempotency checks still apply to every admitted operation.

| Operation | While maintenance is on | Contract / reason |
|---|---|---|
| `/health`, safe `/settings/public`, maintenance/static assets and public legal reads | Admit | Health remains HTTP 200 with maintenance status; config supplies safe branding/contacts/current flags, no private settings |
| Existing Auth OTP start/verify, session inspection/refresh and logout/recovery paths | Admit normal Auth controls | A super admin with an expired session can recover; anonymous requests cannot be preclassified as super. Successful non-super login still cannot bypass maintenance on other routes |
| Authenticated super-admin settings/flag and recovery operations | Admit + usual super guard/audit | Enable→session expiry→reauthenticate→disable must work; future feature gates remain enforced |
| Signed payment/refund callbacks, notification receipts/verified STOP | Admit only after normal signature/account/replay verification | No loss of payment results, delivery reports or consent withdrawal; forged requests get auth failure, not a privileged bypass |
| Signed marketing-unsubscribe confirmation/POST and authenticated consent withdrawal or preference-disable actions | Admit normal capability/session/CSRF controls | Maintenance cannot prevent opting out. This narrow exception does not admit a consent grant, campaign send or arbitrary profile mutation |
| Internal outbox/reconciliation for **already committed** checkout/payment/refund/collection operations | Continue existing owning-module state machines | Complete verified paid checkout/order creation, refund/cash reconciliation and required financial bookkeeping once; maintenance never rolls back captured money or invents a cancellation/refund |
| Authorized status reads of existing payment attempts/orders/assigned jobs; idempotent handover/code verification/cash completion for existing work | Admit narrow owner contracts | Preserve in-flight financial/handover correctness under current auth/state/version checks; no new charge/work is authorized by a caller-supplied “inFlight” flag |
| New checkout/charge intents, normal marketplace mutations, new campaigns/support intake and marketing dispatch | 503 `MAINTENANCE`; dispatch stays durable/deferred | No partial commit. New marketing cannot run as an unguarded scheduled job; already sent receipts still process |
| Other public browsing/non-super operational requests | 503 `MAINTENANCE` | Web uses S-CUST-37; broader partial-availability/fulfilment policy remains SET-Q2 |

Blocked responses use the shared envelope + configured `Retry-After`, no stack/PII. Admission is server-owned and cannot be selected in a body/header. Existing monetary snapshots/state machines remain authoritative; enable/disable never bulk-cancels orders, releases paid reservations or changes approved refund policy. Broader shutdown/restart choices are SET-Q2, not hidden assumptions.

## Rules and use-cases

1. Validate key/group schemas and finite/integer money, localized text and normalized configured contacts. Financial/policy ranges come from approved owner rules; no unapproved production defaults or invented refund window limits.
2. Consumers use the typed reads above and record settings versions where amounts/policy are snapshotted. Required policy/provider/limit absent → explicit unavailable gate in its owner, not a sample fallback.
3. Changing a value never rewrites existing orders/payouts (snapshots).
4. **Maintenance:** enforce the admission matrix, including workers, and use current flag/version; UI hiding alone is insufficient.
5. **System errors:** unknown routes → 404 page; unhandled errors → shared error envelope with `correlationId` and 500 page; no stack traces.
6. Legal bodies are sanitised (allow-listed Markdown: headings, paragraphs, lists, links to https only).
7. Support handling is the reachable admin notification above; only responder workflow is open. Retention/erasure of messages/config/audit references follows Q-32/Q-13; no assumed purge duration.

## Events and jobs

- Publish `settings.updated {key,version,changeSetId}` for changed keys; grouped transactions also publish `settings.group_updated {group,keys:[{key,version}],changeSetId}`. Invalidate the whole group's coherent cache; web revalidates affected settings/SEO/branding/support tags.
- Publish **`feature_flag.updated {key,enabled,version}`**; Settings/Notifications/Communications and relevant public/owner feature consumers invalidate eligibility/cache and recheck the authoritative flag. Maintenance admission never waits for a stale cache.
- Publish **`legal.updated {slug,version,publishedAt}`** after sanitized save; web revalidates **`legal:{slug}`**, localized legal pages and affected metadata, not an unrelated settings event guess.
- Publish `support.message_submitted` in intake transaction; Notifications owns retry/delivery to the existing Admin overview. Outbox consumers deduplicate event ID; no direct provider send inside the intake request.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `SETTINGS_INVALID` | 422 | `errors.settings.invalid` |
| `SETTINGS_VERSION_CONFLICT` | 409 | `errors.settings.versionConflict` |
| `LEGAL_PAGE_NOT_FOUND` | 404 | `errors.legal.notFound` |
| `MAINTENANCE` | 503 | `errors.system.maintenance` |
| `SETTINGS_GROUP_REQUIRED` | 422 | `errors.settings.groupRequired` |
| `FEATURE_NOT_AVAILABLE` | 409 | `errors.settings.featureNotAvailable` |
| `SUPPORT_MESSAGE_NOT_FOUND` | 404 | `errors.support.messageNotFound` |

## Acceptance criteria

1. Given an approved configured earning policy, when Delivery reads it, then it receives exact paise values/version; sample defaults never silently become production policy.
2. Given slabs not ascending, when saved, then `SETTINGS_INVALID`.
3. Given one stale key in Delivery/rider-pay or Commission/plans/promotions, when grouped Save runs, then all values/audit/outbox roll back with `SETTINGS_VERSION_CONFLICT`.
4. Given a non-super admin, when calling `/super-admin/settings`, then 403.
5. Given private/public settings responses, when read, then no credentials appear; only configured status and explicitly public contacts are exposed.
6. Given maintenance enabled and the super-admin session expires, when Auth recovery completes, then settings can disable maintenance while a new customer checkout is still blocked.
7. Given a legal body containing executable markup, when saved, then it is sanitized and `legal.updated` invalidates that slug's EN/HI cache.
8. Given a guest with only a message, when intake succeeds/replays, then one stored message/event reaches an authorized existing Admin overview detail; no phone or fictional inbox is required.
9. Given the sixth support attempt or malicious message text, when submitted/rendered, then abuse controls apply and text is inert; out-of-scope detail is denied.
10. Given a signed payment callback/STOP or committed in-flight financial operation, when maintenance is on, then verification and idempotent completion still run; forged callbacks/new charges remain denied.
11. Given `/health` during maintenance, when Check again polls, then HTTP 200 reports maintenance and later ok, without requiring an authenticated super-admin session.
12. Given grouped settings/flag changes, when consumers read, then coherent new values/cache events appear, existing financial snapshots remain unchanged, and booking/donations cannot be enabled.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Rules: all group memberships/version failures, money/contacts/markup validation, maintenance admission matrix and future-flag denial. Manual API/DB: AC3 atomic concurrency/replay; settings/group/flag/legal cache events; guest support→outbox→scoped existing alert/detail; health/auth recovery; signed callback and in-flight financial correctness under maintenance. Negatives: same-city foreign support area, non-super settings/group writes, forged callback or body-selected bypass, stale flags before send, secrets/sample contacts in DTOs. Existing order snapshots and Q-32 retention gates are asserted.

## Open questions

- **SET-Q1 — Open question:** who responds to support, via which channel (especially anonymous message-only intake), and what approved response copy/SLA applies? Initial handoff is already defined; do not build a ticket/inbox product or require a guest phone to answer this.
- **SET-Q2 — Open question:** broader partial browsing, operational pause/restart and in-flight fulfilment policy beyond the admission matrix. No blanket guard may block recovery, signed callbacks, STOP or already committed financial correctness while awaiting it.
- Financial policy/provider/limits (Q-01/Q-03/Q-04/Q-06), final legal EN/HI copy (Q-12) and retention (Q-13/Q-32) remain gates. No default commission, vendor selection, legal text or destructive retention is invented.
