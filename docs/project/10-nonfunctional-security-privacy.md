# 10 — Non-functional, Security, Privacy

**Purpose:** Performance, reliability, accessibility, observability targets, plus where the full security/privacy rules live.
**Audience:** All engineers, `security-auditor`.
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [`security.instructions.md`](../../.github/instructions/security.instructions.md) · [`docs/security/security-guidelines.md`](../security/security-guidelines.md) (full security detail — not repeated here) · [04-business-rules.md](./04-business-rules.md) (BR-11, BR-14)
**Last updated:** 2026-11-09
**Owner:** Engineering

## 1. Security and privacy (summary — see linked files for enforced rules)

Aligned with **OWASP ASVS** and the **OWASP Top 10**. Headlines only;
the actionable checklist is `.github/skills/secure-coding-review/SKILL.md`,
and the full rationale is `docs/security/security-guidelines.md`.

- Mobile OTP with hashing, expiry, attempt limits and rate limits
  (BR-05).
- httpOnly, Secure, SameSite cookie sessions.
- RBAC + ownership + city/area scope enforced server-side (BR-12).
- No secrets/PII/OTP/tokens in logs.
- Allow-listed embed hosts (`youtube.com`, `youtu.be`,
  `instagram.com`) with server-rebuilt embed URLs (BR-10).
- Hardened uploads and CSV import; webhook signature verification.
- Audit log for sensitive actions (BR-12).
- **DPDP:** consent records (WhatsApp, marketing, location, cookies),
  export/delete on request (BR-14), KYC documents restricted to
  authorised admins.

## 2. Performance targets

| Metric | Target |
|---|---|
| LCP | < 2.5s on slow 4G |
| Route JS | < ~170 KB gzip |
| CLS | < 0.1 |
| API read (p95) | < 300ms |
| Lists | Always paginated, "Load more" fallback |
| Media | Lazy-loaded; data-saver mode available |

## 3. Reliability

- Idempotent payments, orders and refunds (ties to BR-01, BR-03).
- Background jobs with retry for notifications, media processing and
  reports.
- Graceful degradation: offline banner (X5), embed fallback
  ("Open in YouTube/Instagram" — RL10).

## 4. Accessibility and i18n

WCAG 2.2 AA; full English + Hindi parity — see
[09-content-i18n-notifications.md](./09-content-i18n-notifications.md)
and [`i18n-a11y.instructions.md`](../../.github/instructions/i18n-a11y.instructions.md).

## 5. Observability

Structured logs with correlation ids; metrics and traces on checkout,
payment, OTP, and delivery flows (the highest-risk/highest-value
paths).

## 6. Device/browser support

Mid-range Android first; the rider app is a PWA (X15) that must stay
usable on a budget device with an intermittent connection.
