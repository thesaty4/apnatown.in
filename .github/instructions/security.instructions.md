---
applyTo: "**"
---

# Security

Enforced rules for every change. Full detail: `docs/security/security-guidelines.md`.
Required before touching `auth`, `payments`, `cart-checkout`, `orders`,
`delivery`, `admin`, `communications`, or any upload/media path —
`security-auditor` review is mandatory for those (`AGENTS.md`).

## Injection

- Parameterized queries only, via repositories
  (`database.instructions.md`); never concatenate user input into a
  query.
- Sort/filter fields are allow-listed against an enum, never passed
  through raw from the client.
- Never pass user input to a shell.

## Broken access control

- Authorize on **role + ownership + scope** on every endpoint: role,
  ownership (does this user own this shop/order/review?), and admin
  scope (assigned city/area + permission matrix module/action).
- IDOR: re-check ownership/scope server-side on every request,
  including nested resources — never trust a client-supplied ID alone.
- Mass assignment: DTOs are explicit allow-lists; status changes go
  through the module's state machine endpoint, never a generic field
  setter.
- Admin UI hides/disables actions the permission matrix doesn't grant
  (AD16) — but server-side enforcement is the real control.

## OTP and codes

- Login OTP, delivery OTP, and pickup code are generated and verified
  **server-side only**, with attempt limits and a resend cooldown.
- Never log an OTP/code or return it in any response other than its
  delivery channel.

## Sessions, CSRF, cookies

- Sessions: httpOnly, Secure, SameSite cookies; never tokens in
  `localStorage`.
- CSRF protection on all state-changing requests.
- Session expiry invalidates server-side.

## XSS / CSP

- Render all user-generated content as text; any rich text goes through
  a strict allow-listed sanitizer.
- Restrictive CSP; no inline scripts without nonces.

## SSRF, uploads, CSV, webhooks

- **Embeds (video links):** never embed a client-supplied URL directly;
  validate against an allow-list of hosts (YouTube, Instagram) and
  rebuild the embed URL server-side; fall back to "Open in
  YouTube/Instagram" otherwise.
- **Uploads:** validate file type by content and size; use the
  `storage` integration port; strip EXIF/GPS from photos.
- **CSV import/export:** treat cells as untrusted; neutralize
  formula-injection characters on export; cap/validate rows and types
  on import.
- **Webhooks:** verify signatures; handlers must be idempotent.
- No server-side request to a client-supplied URL outside an
  allow-list.

## Secrets

- Secrets only in env vars / the secret store; `.env.example` lists
  keys with placeholders only.
- Integration credentials stay inside their `integrations` adapter.

## PII, consent, DPDP

- Minimise data collected; KYC documents visible only to admins with
  the relevant approval permission.
- Marketing/WhatsApp communications require recorded consent;
  `communications` computes consent-aware recipient counts and honours
  opt-outs.
- Support data export and deletion requests end-to-end.

## Logging

- Structured logs; never log secrets, OTPs, full phone numbers, payment
  details, or raw KYC contents.
- Every data-changing admin action is audit-logged (actor, timestamp,
  before/after) via the `audit` module.

## Dependencies

- Keep `dependabot.yml` active; CodeQL runs every PR; merge patches
  promptly.

## Self-review checklist

Run the checklist in `.github/skills/secure-coding-review/SKILL.md`
before finishing any change touched by this file — it is the one
canonical copy, used by `developer-*` and `security-auditor` alike.
