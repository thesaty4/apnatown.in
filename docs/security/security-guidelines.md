# Security Guidelines (detailed)

This is the detailed reference for `.github/instructions/security.instructions.md`
(which stays under 4,000 characters and links here). Read both before
touching `auth`, `payments`, `cart-checkout`, `orders`, `delivery`,
`admin`, `communications`, or any file upload/media path.

## 1. Injection

- **SQL/NoSQL:** only parameterized queries via repositories
  (`database.instructions.md`); never string-concatenate user input into
  a query. Sort/filter fields must be allow-listed against an enum, not
  passed through from the client.
- **Command injection:** never pass user input to a shell; media
  processing and print-template generation (X11) use library APIs, not
  shell commands with interpolated arguments.
- **Log injection:** sanitize/encode values before writing to logs.

## 2. Broken access control

- Every endpoint authorizes on **role + ownership + scope**: role
  (customer/vendor/provider/rider/admin/super_admin), ownership (does
  this user own this shop/order/review?), and scope (is this admin
  assigned to this city/area and does their permission matrix allow
  this module/action?). See BR-12 in `docs/project/04-business-rules.md`.
- **IDOR:** never trust an ID from the client as sufficient
  authorization; re-check ownership/scope server-side on every request,
  including nested resources (e.g. an order's items, a business's
  products).
- **Mass assignment:** DTOs are explicit allow-lists; never spread a
  raw request body into an entity update. Status transitions go through
  the module's state machine, never a generic "set field" endpoint.
- Admin UI must be **permission-aware**: hide or disable actions the
  current admin's permission matrix doesn't grant, with a
  "You don't have permission" message (AD16) — but the server is the
  real enforcement point; the UI check is only UX.

## 3. OTP and codes

- Login OTP (AU4), delivery OTP (RD4/OR3) and pickup code (OR4) are
  generated and verified **server-side only**.
- Apply attempt limits and lockout/backoff on verification; apply a
  resend cooldown on generation.
- OTP/codes are never logged, never returned in any response other than
  the delivery channel (SMS) itself, and are short-lived.

## 4. Sessions, CSRF, cookies

- Sessions are **httpOnly, Secure, SameSite** cookies; no tokens in
  `localStorage`.
- State-changing requests require CSRF protection (double-submit token
  or `SameSite=Lax/Strict` + custom header check).
- Session expiry (AU7) invalidates server-side, not just client-side.

## 5. XSS and CSP

- All user-generated content (reviews, captions, comments, business
  descriptions) is rendered as text, never raw HTML; rich text, if any,
  goes through a strict allow-listed sanitizer.
- Set a restrictive Content-Security-Policy; no inline scripts without
  nonces.

## 6. SSRF, uploads, CSV, webhooks

- **Media embeds (RL10):** video links accepted from the client are
  **never embedded directly**. The server validates the URL against an
  allow-list of hosts (YouTube, Instagram) and rebuilds a safe embed URL
  itself; unsupported/invalid links fall back to "Open in
  YouTube/Instagram" instead of an iframe.
- **Uploads:** validate file type by content (not just extension) and
  size; store via the `storage` integration port, not local disk;
  generate derivative/thumbnail sizes server-side; strip EXIF/GPS from
  user photos before public display.
- **CSV import/export (VD4, AD13):** treat every cell as untrusted text;
  neutralize formula-injection characters (`=`, `+`, `-`, `@` at cell
  start) on export; validate and cap row counts and column types on
  import.
- **Webhooks** (payment provider callbacks): verify signatures before
  trusting payload; make handlers idempotent (a replayed webhook must
  not double-apply a payment).
- No server-side request to a URL supplied by a client without going
  through an allow-list (applies to embeds, QR targets, directions
  links).

## 7. Secrets and configuration

- Secrets live only in environment variables / the deployment secret
  store; `.env.example` lists keys with placeholder values only, never
  real secrets.
- Integration credentials (payments, SMS/WhatsApp, maps) are read only
  inside the relevant `integrations` adapter, never passed through
  application code or logs.

## 8. PII, consent, DPDP

- Minimise collected data; KYC documents (RD1, VD1/PV1 onboarding) are
  visible only to admins with the relevant approval permission.
- WhatsApp/marketing communications require recorded consent;
  `communications` (AD12) must compute consent-aware recipient counts
  and honour opt-outs (BR-11).
- Support data export and account/data deletion requests (AU8, AC5)
  end-to-end, including from backups/queues where feasible.
- Mask sensitive data in UI where not needed in full (e.g. masked rider
  phone number — RD4 "masked call").

## 9. Logging and observability

- Structured logs only; never log secrets, OTPs, full phone numbers,
  payment instrument details, or raw KYC document contents.
- Every admin action that changes data is **audit-logged** with actor,
  timestamp, before/after values (BR-12, module `audit`).

## 10. Dependencies

- Keep `dependabot.yml` enabled; review and merge security patches
  promptly; run `codeql.yml` on every PR (see
  `.github/workflows/codeql.yml`).

## 11. Self-review checklist

The actionable, single-source checklist lives in
`.github/skills/secure-coding-review/SKILL.md` — run it before finishing
any change this file applies to, and paste its filled-in state into the
PR description for sensitive changes.
