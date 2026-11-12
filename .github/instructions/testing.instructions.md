---
description: "Verification policy: no automated test files for frontend, backend or database work."
applyTo: "apps/**,packages/**,specs/**,.github/**,docs/prompts/**"
---

# Verification without automated test files

## Authoring policy

- Do not create, regenerate or expand automated test files for FE, BE or
  DB work. This includes unit, integration, component, repository,
  migration, E2E and Playwright tests, plus test-only fixtures, mocks,
  harnesses, runner configuration and dependencies.
- Do not move tests into scripts, inline snippets or another runner to
  work around this policy. Existing application tests were removed at the
  user's request; do not restore them.
- This policy supersedes older test-authoring requirements and test-code
  examples in specs, prompts and reference documents. Acceptance criteria
  and product/security invariants still apply; retain their scenarios as
  manual verification cases, not executable test deliverables.
- Keep runtime validation, DTO schemas, authorization, migrations, seeds,
  local integration adapters and non-test repository validators intact.
  A file containing "test" is not automatically a test artifact.

## Required verification

1. Map each changed acceptance criterion to an available non-test check
   or a reproducible manual observation; record expected versus observed
   results. For bugs, capture reproduction evidence before the fix and
   repeat the same steps afterward.
2. Run the smallest relevant existing lint, type-check, build,
   generated-contract and documentation-validation commands. Do not
   introduce test runners or test scripts.
3. For FE, manually check affected flows, React Query states, EN/HI,
   keyboard/focus, responsive layouts and light/dark appearance using the
   existing browser and screenshot tools, without authoring test code.
4. For BE/DB, inspect DTO/error/authorization boundaries and, where safe,
   manually exercise local API/SQL scenarios against an explicitly
   isolated disposable database. Use synthetic data, real guards and
   approved local adapters; never contact real recipients/providers.
5. Preserve database isolation and explicit approval for destructive
   actions. Never reset a shared/production DB for verification.
6. Report exact commands, outcomes, manual evidence, unavailable checks
   and residual coverage risks honestly. Build/lint success is not proof
   of runtime behavior or security.

Security-auditor review, architect review and human-only merging remain
required by [AGENTS.md](../../AGENTS.md). Missing automated tests alone
is not a blocker under this policy; failing required non-test checks,
unverified acceptance criteria and security findings still are.
