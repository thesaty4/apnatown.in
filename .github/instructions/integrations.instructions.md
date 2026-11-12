---
applyTo: "apps/api/src/integrations/**,apps/api/src/modules/{payments,notifications,communications,media-videos,geo}/**"
---

# Integrations

Builds on `backend.instructions.md`/`security.instructions.md`.
Providers for payments, SMS/OTP, and WhatsApp are **not yet chosen**
(`docs/project/12-decisions-assumptions-open-questions.md`) — code against the ports below
regardless of provider.

## Ports and adapters

- One interface per capability: `PaymentProvider`, `SmsOtpProvider`,
  `WhatsAppProvider`, `EmailProvider`, `StoragePort`, `MapsPort`,
  `MediaProcessor`. Modules (`payments`, `notifications`,
  `communications`) depend only on the interface
  (`solid-dry-design.instructions.md` dependency inversion).
- Each real adapter lives under `apps/api/src/integrations/<provider>/`
  and implements exactly one port; no module imports a concrete
  provider SDK directly.

## Selected media and map integrations

Follow [the canonical contract](../../specs/_foundation/media-and-maps.md):
Cloudinary stores sanitized public-purpose images through `StoragePort`;
KYC/evidence/exports stay separate. Use authenticated image delivery behind
Media's same-origin gateway, never browser upload signatures or public URLs.
YouTube/Instagram links only; no direct video upload, scraping or raw embed
HTML. Leaflet/Geoman Free render OSM tiles; they do not supply geocoding,
routing or fee decisions. Honor tile attribution/limits; no offline downloads.
Wire documented configuration through schema, launcher allow-lists and env
template together; report unconfigured/unavailable states without fallback
to another provider.

## Local adapters

- Preserve approved local adapters for explicitly requested local runtime work
  without real network sends. Where required by the spec, support explicit
  failure modes (timeout, rejection, invalid webhook signature).
- Never generate test-only mocks, fixtures or suites; follow
  `testing.instructions.md`. Local adapters must not bypass runtime guards
  or be selectable in production.

## Timeouts, retries, circuit breaker

- Every outbound call has an explicit timeout; bounded retries with
  exponential backoff for transient failures; a circuit breaker (or
  equivalent) opens after repeated failures so one provider outage
  doesn't cascade into request pile-up.
- Background jobs are preferred over inline calls for anything that can
  tolerate async completion (bulk communications sends, media
  processing) — see `backend.instructions.md`.

## Webhook verification

- Every inbound webhook (payment status, WhatsApp delivery receipts)
  verifies the provider's signature before processing; handlers are
  idempotent — a redelivered webhook must not double-apply a payment or
  resend a notification (`security.instructions.md`).

## Secret handling

- Provider credentials are read only inside that provider's adapter,
  from env vars (`.env.example` lists the keys) — never passed through
  application code, logs, or client responses.

## WhatsApp consent and templates

- `communications`/`notifications` call `WhatsAppProvider` only for
  **consented** recipients (BR-11,
  `domain-accounts-admin.instructions.md`); templates are the
  provider-approved template objects, not freeform text, to stay
  compliant with WhatsApp Business policy.
- Opt-out requests update consent immediately and are honoured by the
  next send, not eventually.

## SMS/OTP provider failover

- `SmsOtpProvider` supports a primary and at least one fallback
  provider; OTP send failures on the primary fail over automatically
  (with the same OTP/session, not a new one) rather than surfacing an
  error to the user on the first provider hiccup.
- OTP verification always happens against ApnaTown's own server-side
  store, never delegated to the SMS provider
  (`security.instructions.md`).
