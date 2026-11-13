# ADR 0002: Local demo persona sign-in

## Status

Accepted (2026-11-12, explicit user decision). Narrow exception to the
"no login-as route / no authentication-bypass seed" rules in the
[architecture foundation](../../specs/_foundation/architecture.md),
[data model](../../specs/_foundation/data-model.md) and
[database instructions](../../.github/instructions/database.instructions.md).
Requires a `security-auditor` pass before any PR that changes it.

## Context

The HTML prototype has "Demo controls" (`js3.js` `A.demo`/`pickRole`): a
header `users` button and an Account "Switch role" card that open a
"View as" grid for Customer, Vendor, Service provider, Rider, Admin and
Super Admin. The prototype switches a browser-local role; the real app has
server-side sessions, live role checks and no client-trusted roles
(BR-05, `specs/auth/be/auth.md` rules 4-5). Reviewers and the product
owner need a fast way to open each dashboard locally without running an
OTP flow per role. Existing rules forbid HTTP login-as routes, bypass
flags and seeded credentials, so this needs a recorded exception.

## Decision

When the server-only `DEMO_LOGIN_ENABLED=true` flag is set in a local/test
environment, `POST /api/auth/demo/sessions {persona}` replaces the current
session with a fresh authenticated session for a **seeded synthetic persona
that already holds that role**; it is never registered otherwise.

Contract:

| Concern | Rule |
|---|---|
| Activation | `DEMO_LOGIN_ENABLED` defaults to `false`. API `parseConfig` and the web environment schema refuse `true` in production; `AuthModule` registers the controller/service only when enabled, so deployed APIs return 404. The name avoids the forbidden `FAKE/MOCK/BYPASS` key pattern. |
| Identity | `persona` is an allow-listed enum (`customer`, `vendor`, `provider`, `admin`, `super_admin`) mapped server-side to fixed synthetic sample phones in `auth/domain/demo-personas.ts`. No user ID, phone or role is accepted from the client. Rider has no module yet and is shown as "Coming soon". |
| Authorization | The service reads the live principal (status, roles, approvals) and refuses with `DEMO_PERSONA_UNAVAILABLE` (404) unless the persona user exists, is active and already holds the role. It never creates users or grants roles. All dashboards keep their normal role/ownership/scope/permission checks. |
| Session | Same rotation as OTP verify: Origin + CSRF required; `SessionService.replace` is inert unless the flag is on outside production, locks the current session before reading the persona identity, revokes it and issues a new one with new CSRF state; same httpOnly/SameSite cookie as OTP login (Secure on an `https:` web origin), private no-store response, IP rate limit (30/min). Blocked during maintenance. |
| Seed | `pnpm db:seed` (local/test only) adds `seed-personas.mjs`: customer `u1`, admin `ad1` (customer + admin, "Area Admin" system role, permissions, Padrauna area scopes, encrypted email) and a synthetic Super Admin. Vendor/provider personas are the existing sample owners of `b1`/`s1`. No OTP, password, session token or real recipient is seeded. |
| UI | Web renders the header switcher and Account card only when the flag is on (read server-side); after success it fences the session lifecycle, broadcasts to other tabs and opens the role home (`/`, `/vendor/media`, `/provider/media`, `/admin`, `/super-admin`). |

## Consequences

- Positive: one click opens every implemented dashboard in a local/test
  environment with real server-side authorization, mirroring the
  prototype's Demo controls.
- Negative: a login-as endpoint now exists in source. Mitigations are the
  production refusal in both config schemas, conditional registration,
  allow-listed seeded personas and the required security review. Anyone
  with access to a local/test API with the flag on can sign in as those
  synthetic personas; never enable it on a shared or internet-reachable
  environment. Start the web app through `pnpm dev`/`pnpm start` (which bind
  `localhost`), not the raw `apps/web` Next scripts, while the flag is on.
- After seeding, `admin:bootstrap` reports `SUPER_ADMIN_EXISTS` because the
  demo Super Admin is active; use a fresh database to exercise bootstrap.
- The sheet description replaces the prototype's "runs in your browser"
  copy with accurate local-demo copy; Hindi strings without prototype
  source need human review.
- Run locally: set `DEMO_LOGIN_ENABLED=true` in `.env.local`, then
  `pnpm build`, `pnpm db:seed` and restart the API and web servers.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Visual-only prototype switcher | Dashboards enforce server roles, so it could not open them. |
| Fixed OTP code or OTP shown in UI | Explicitly forbidden OTP bypass; leaks into the real login path. |
| Accept any phone/role from the client | Grants roles from the request body; violates rule 4 and BR-05. |
| Separate login-as per arbitrary user ID | Wider blast radius than a fixed persona allow-list. |
