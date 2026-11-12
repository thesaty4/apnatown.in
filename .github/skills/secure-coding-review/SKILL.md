---
name: secure-coding-review
description: Step-by-step self-review against the ApnaTown security checklist before security-auditor review or architect code review.
---

# Secure coding review

Use this before finishing any `developer-backend`/`developer-frontend`
task, and as the working checklist for `security-auditor`. Full rules:
`.github/instructions/security.instructions.md` and
`docs/security/security-guidelines.md`.

## Checklist

1. [ ] All queries parameterized; sort/filter fields allow-listed
   against an enum.
2. [ ] Every endpoint checks role **and** ownership **and** admin scope
   (city/area + permission module/action) — not role alone.
3. [ ] DTOs are explicit allow-lists; no request body spread into an
   entity.
4. [ ] OTP/codes (login, delivery, pickup) generated and verified
   server-side only, attempt-limited, never logged.
5. [ ] Sessions are httpOnly/Secure/SameSite; mutations are
   CSRF-protected.
6. [ ] User-generated content rendered as text or through a strict
   sanitizer — never raw HTML.
7. [ ] Typed YouTube/Instagram playback and safe fallback links are rebuilt
   server-side; invalid links/direct video files are rejected, no raw HTML.
8. [ ] Uploads validated by content and size, routed through the
   storage port; EXIF/GPS stripped before Cloudinary. Public-purpose
   images use authenticated storage plus the reauthorizing gateway;
   KYC/evidence/exports stay separate.
9. [ ] CSV export neutralizes formula-injection characters; CSV import
   validates row count and column types.
10. [ ] Webhook handlers verify signatures and are idempotent.
11. [ ] Secrets only via env/secret store; never in code, commits, or
    logs.
12. [ ] No secrets/PII (OTPs, full phone numbers, payment details, KYC
    contents) in logs.
13. [ ] Data-changing admin actions write an audit entry with
    before/after values.
14. [ ] Marketing/WhatsApp sends check recorded consent and honour
    opt-outs.
15. [ ] [Media/map contract](../../../specs/_foundation/media-and-maps.md)
    enforced: credentials stay server-only, CSP is narrowly scoped,
    map popups cannot inject HTML, location remains optional and tiles
    follow attribution/caching/no-offline rules.

## Authorization reference

Use the real guard/policy and Catalog reference contracts in
[backend-shared.md](../../../specs/_foundation/backend-shared.md),
not a second placeholder authorization helper.
Await asynchronous ownership/scope checks before proceeding; a Promise is
not an authorization result. Recheck mutable authority inside the command
transaction and on idempotent replay. Pending applicants use owner-issued
capabilities, never self-granted seller/rider roles.

## Output

A filled checklist (checked/unchecked with a one-line reason for any
unchecked item) attached to the hand-off note or review.
