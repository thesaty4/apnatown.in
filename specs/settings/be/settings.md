# BE: settings

Features: F-SA-005, F-AC-005, F-AC-006, F-X-009 | Rules: BR-01, BR-02, BR-11, BR-12 | State machines: none | Depends on: audit; read by cart-checkout, delivery, geo, payments, offers, orders, reviews, media-videos, notifications, communications, search (SEO), web (flags).

Frontend counterpart: [FE settings](../fe/settings.md)

## Responsibility

Own versioned platform configuration (branding, default delivery slabs, rider earning, commission, platform fee, plans, promotion fees, payment methods, refund window, review rules, upload limits, integration choices, SEO defaults), feature flags, legal page content and support messages. Provide a typed, cached `SettingsService` read port so other modules never hard-code these values. Maintenance mode and system-page error contracts.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `settings` | `key text PK CHECK IN ('branding','delivery','rider_earning','commission','plans','promotion_fees','payments','policies','reviews','uploads','integrations','seo')`; `value jsonb NOT NULL` (zod-validated per key); `version int NOT NULL DEFAULT 1`; `updated_by uuid FK users`; `updated_at timestamptz` | PK |
| `feature_flags` | `key text PK CHECK IN ('reviews','guest_browse','whatsapp','booking','donations','payments_online','payments_cod','maintenance')`; `enabled bool NOT NULL`; `updated_by uuid FK users`; `updated_at` | PK |
| `legal_pages` | `slug text PK CHECK IN ('terms','privacy','refund','about')`; `title_en/title_hi text NOT NULL`; `body_en/body_hi text NOT NULL` (sanitised Markdown subset); `version int NOT NULL DEFAULT 1`; `published_at timestamptz NOT NULL`; `updated_by uuid` | PK |
| `support_messages` | `id uuid PK`; `user_id uuid NULL FK users`; `phone_ciphertext text NULL` (guest); `message text NOT NULL CHECK 10–1000`; `status text NOT NULL DEFAULT 'open' CHECK ('open','closed')`; `created_at` | `(status, created_at DESC)` |

**Value shapes (money in paise, distance km numeric):** `delivery {slabs:[{uptoKm,feePaise}] (1–3, ascending)}` (global default used when a zone has none; zone slabs are Geo-owned); `rider_earning {basePaise:2000, perKmPaise:700}`; `commission {defaultBps, platformFeePaise:500}`; `plans [{code,nameEn,nameHi,pricePaise,commissionBps}]`; `promotion_fees [{code,nameEn,nameHi,pricePaise}]`; `payments {gateway:'razorpay'|'phonepe'|'cashfree'}`; `policies {refundWindowHours:24}`; `reviews {ruleEn,ruleHi,blockedWords[]}`; `uploads {imageMaxMb,videoMaxMb,documentMaxMb}`; `integrations {smsProvider:'msg91'|'twilio', whatsappNumber, emailSender}`; `seo {titleEn,titleHi,descriptionEn,descriptionHi}`; `branding {nameEn,nameHi,taglineEn,taglineHi}`. Production values are entered by the super admin; prototype numbers are seed defaults only.

**Secrets** (gateway keys, WhatsApp token, SMS keys) are never stored here or returned; they live in the secret store/env. The API returns `{configured: boolean}` per integration only.

## Endpoints

| Method | Path | Auth | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/settings/public` | Public; `Cache-Control: public, max-age=300` + revalidate tag `settings` | → branding, enabled flags, payment methods, refund window, SEO defaults, upload limits | — | Yes | F-X-009, all clients |
| GET | `/super-admin/settings` | super_admin | → all keys with `version`, flags, `integrationStatus{gateway,whatsapp,sms,email:{configured}}` | — | Yes | F-SA-005, S-SUPR-06 |
| PUT | `/super-admin/settings/{key}` | super_admin; audited before/after | `{value, expectedVersion}` → saved key | `SETTINGS_INVALID`, `SETTINGS_VERSION_CONFLICT` | Yes | F-SA-005 |
| PUT | `/super-admin/feature-flags/{key}` | super_admin; audited | `{enabled}` → flag | `SETTINGS_INVALID` | Yes | F-SA-005 |
| GET | `/legal/{slug}` | Public; ISR tag `legal:{slug}` | → title/body in locale, `updatedAt` | `LEGAL_PAGE_NOT_FOUND` | Yes | F-AC-006, S-CUST-31, S-CUST-32, S-CUST-33 |
| PUT | `/super-admin/legal/{slug}` | super_admin; audited | `{titleEn,titleHi,bodyEn,bodyHi,expectedVersion}` → page (sanitised) | `SETTINGS_INVALID`, `SETTINGS_VERSION_CONFLICT` | Yes | F-SA-005 |
| POST | `/support/messages` | Public (guest gives phone) or authenticated; rate-limited 5/hour per user/IP | `{message, phone?}` → `{id}` | `VALIDATION_ERROR`, `RATE_LIMITED` | Required key | F-AC-005, S-CUST-30 |
| GET | `/health` | Public | → `{status:'ok'\|'maintenance'}` | — | Yes | F-X-009 |

## Rules and use-cases

1. Each key's value is validated by its shared zod schema: slabs ascending and non-negative; paise integers; bps 0–10 000; refund window 1–168 h.
2. `SettingsService.get(key)` caches per process for 60 s and is invalidated by outbox event `settings.updated`; consumers read through it and record `settings_version` where amounts are snapshotted (payments, orders).
3. Changing a value never rewrites existing orders/payouts (snapshots).
4. **Maintenance:** when flag `maintenance` is on, all non-super-admin API calls return 503 `MAINTENANCE`; web renders S-CUST-37.
5. **System errors:** unknown routes → 404 page; unhandled errors → shared error envelope with `correlationId` and 500 page; no stack traces.
6. Legal bodies are sanitised (allow-listed Markdown: headings, paragraphs, lists, links to https only).
7. Support messages: phone encrypted, never logged; super admin handling channel is an open question.

## Events and jobs

Publishes `settings.updated {key, version}` and `feature_flag.updated {key, enabled}` (web revalidates tags `settings`/`legal:*`).

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `SETTINGS_INVALID` | 422 | `errors.settings.invalid` |
| `SETTINGS_VERSION_CONFLICT` | 409 | `errors.settings.versionConflict` |
| `LEGAL_PAGE_NOT_FOUND` | 404 | `errors.legal.notFound` |
| `MAINTENANCE` | 503 | `errors.system.maintenance` |

## Acceptance criteria

1. Given rider earning set to ₹20 + ₹7/km, when a 3 km delivery completes, then Delivery uses 4100 paise (via Settings read).
2. Given slabs not ascending, when saved, then `SETTINGS_INVALID`.
3. Given two super admins save with the same version, then the second gets `SETTINGS_VERSION_CONFLICT`.
4. Given a non-super admin, when calling `/super-admin/settings`, then 403.
5. Given the settings response, then no secret value appears; only `configured` booleans.
6. Given `maintenance` on, when a customer calls any API, then 503 `MAINTENANCE`; super admin still works.
7. Given a legal body containing `<script>`, then it is stripped on save.
8. Given 6 support messages in an hour from one IP, then `RATE_LIMITED`.

## Tests

Unit: zod schemas per key, sanitiser, cache invalidation. Integration: update → event → consumer reads new value; maintenance middleware; snapshot unaffected by change. Authorisation negatives: admin/customer on super-admin endpoints.

## Open questions

Who handles support messages (assumed super admin inbox, later); maintenance toggle exposure in UI (assumed flag in Feature flags section); default commission value (no production value).
