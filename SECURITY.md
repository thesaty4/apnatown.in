# Security Policy

ApnaTown.in handles payments, personal data (including KYC documents
for vendor/provider/rider onboarding), and location data. We take
security seriously and follow OWASP ASVS / OWASP Top 10 guidance — see
[docs/security/security-guidelines.md](docs/security/security-guidelines.md)
for the detailed engineering guidance and
[.github/instructions/security.instructions.md](.github/instructions/security.instructions.md)
for the enforced rules applied to every change.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for a suspected security
vulnerability. Instead:

1. Email the maintainers at `security@apnatown.in`
   <!-- TODO(verify): confirm the real security contact address/alias -->
   with a description, reproduction steps, and impact assessment.
2. Allow a reasonable time for triage and a fix before any public
   disclosure (coordinated disclosure).
3. Do not access, modify, or exfiltrate data beyond what is needed to
   demonstrate the issue.

## Scope

In scope: this repository's application code and infrastructure-as-code
once added, including `apps/web`, `apps/api`, `packages/shared`,
`packages/ui`. Out of scope: third-party integrations themselves
(payments, WhatsApp, SMS/OTP providers) — report those to the provider,
but do tell us if ApnaTown's integration with them is insecure.

## Supported versions

This project has not yet had a stable release; until then, only the
`main` branch is supported.

## Our commitments

- Every change touching `auth`, `payments`, uploads/CSV, embeds, admin
  permissions, or `communications` goes through a `security-auditor`
  agent review (see [AGENTS.md](AGENTS.md)) before merge.
- CodeQL runs on every pull request (`.github/workflows/codeql.yml`).
- Dependabot keeps dependencies patched (`.github/dependabot.yml`).
