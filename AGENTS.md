# AGENTS.md

Agent-wide rules for working in the ApnaTown.in repository. Every agent
and every human contributor using an AI agent follows this file first.

## 1. Read order (before any change)

1. This file (`AGENTS.md`).
2. `.github/copilot-instructions.md` — top-priority repo-wide rules.
3. `docs/PROJECT.md` — index into the product knowledge base
   (`docs/project/`): what to build, roles, rules, journeys, screens,
   design, copy.
4. `docs/architecture.md` — module map and layering.
5. The relevant `.github/instructions/*.instructions.md` file(s) for the
   path you are touching (matched by `applyTo`).
6. The feature's spec in `specs/<module>/{be,fe}/` (or
   `docs/FEATURE_INVENTORY.md` to find/create it).
7. The relevant skill in `.github/skills/` for a step-by-step recipe.

Do not skip ahead to code before steps 1-4 are understood; they contain
the product invariants (`docs/project/04-business-rules.md`)
that every change must preserve.

## 2. Lifecycle

```
docs/FEATURE_INVENTORY.md (not started)
        |
        v
  architect -> linked BE/FE specs; design review for cross/new-module work
        |
        v
  developer-backend  and/or  developer-frontend
        |
        v
  security-auditor (required for sensitive changes; see security.instructions.md)
        |
        v
  architect (read-only code review)
        |        -- Blocker found? --> developer-* (max 3 loops, then human)
        |
        v  APPROVE
  owning developer-backend/frontend -> opens PR, requests human review
        |
        v
      human merges (agents never merge)
        |
        v
  architect (optional release notes/checklist) -> human executes release
```

Existing regressions enter at the relevant developer agent: reproduce ->
recorded failure -> minimal fix -> repeat verification -> reusable lesson, then the same
security/review/PR gates. For combined BE/FE work, choose one developer as
PR owner. Spec writing and read-only code review are separate architect
modes; release preparation is only performed when requested after merge.

## 3. Agent roster

The four agents in `.github/agents/` are:

| Agent | Responsibilities |
|---|---|
| [architect](.github/agents/architect.agent.md) | BE/FE specs, architecture/ADRs, read-only general code review, release preparation |
| [developer-backend](.github/agents/developer-backend.agent.md) | Backend implementation, bug fixes and PR creation after review |
| [developer-frontend](.github/agents/developer-frontend.agent.md) | Frontend implementation, bug fixes and PR creation after review |
| [security-auditor](.github/agents/security-auditor.agent.md) | Required read-only security review for sensitive changes |

## 4. Hard limits (non-negotiable)

- **Humans merge.** No agent merges a PR, force-pushes to `main`, or
  deletes a branch other than its own working branch.
- **No placeholders/lorem ipsum** in anything that ships; use real
  ApnaTown names, roles, statuses (`docs/PROJECT.md`,
  `docs/FEATURE_INVENTORY.md`). Unknown values get a `TODO(verify)`
  comment, not an invented one.
- **No secrets, tokens, or real PII** in code, commits, logs, or test
  fixtures. Use `.env.example` and fakes (`integrations.instructions.md`).
- **Small PRs.** One feature/task/bug per PR; link its spec.
- **No automated test files** for frontend, backend or database work.
  Follow the [verification policy](.github/instructions/testing.instructions.md):
  existing non-test checks and manual acceptance evidence, not unit,
  integration, component, DB or Playwright test generation.
- **Media/map choices are fixed:** use the
  [integration contract](specs/_foundation/media-and-maps.md), not a new
  provider proposal. Public Cloudinary images, private documents, link-only
  video and policy-compliant Leaflet/OSM maps have separate boundaries.
- **Security-auditor is required**, not optional, before PR creation
  for sensitive changes defined in `security.instructions.md`.
- **Don't invent product behaviour.** If section 2 of the original
  product brief (now `docs/PROJECT.md`/`docs/FEATURE_INVENTORY.md`) is
  ambiguous, add it to `docs/project/12-decisions-assumptions-open-questions.md` and ask,
  rather than guessing.
- **Preserve invariants.** The business rules (BR-01..BR-22) in
  `docs/project/04-business-rules.md` are enforced by `architect` review
  on every PR; a Blocker there always means CHANGES_REQUESTED.
- **PR gates:** the owning developer opens a PR only after `architect`
  returns `APPROVE` and `security-auditor` returns `PASS` when required.
  The developer never approves or merges their own PR.

## 5. Escalation rules

- `architect` escalates to a human after 3 code-review loops with
  unresolved Blockers.
- Any agent escalates immediately (instead of guessing) when: a product
  invariant conflicts with a request, a change would touch
  payments/auth/admin-RBAC without a security-auditor pass available,
  or a spec is missing for a non-trivial change.
- `architect` is the escalation point for cross-module design
  conflicts; `security-auditor` is the escalation point for any
  security trade-off.

## 6. Memory rule

Record durable lessons (bugs that recurred, footguns, conventions that
prevented a bug class) in `docs/ai/LESSONS_LEARNED.md` — not in PR
descriptions alone. Every agent reads it before starting non-trivial
work in a module it covers. Developer bug-fix runs add or update an entry
when they reveal a reusable lesson, per the `lessons-learned` skill.

## 7. How the pieces fit together

- **Instructions** (`.github/instructions/`) are enforced, specific,
  path-scoped rules — kept under 4,000 characters each; link to
  `docs/` for longer detail instead of repeating it (DRY).
- **Skills** (`.github/skills/`) are step-by-step recipes for a
  specific recurring task; agents invoke them instead of re-deriving
  the steps.
- **Agents** (`.github/agents/`) are the roles that carry out the
  lifecycle above using instructions + skills + specs.
- **`scripts/validate-ai-setup.mjs`** keeps this whole setup internally
  consistent (front matter, size budget, skill naming, path references,
  links) — run it after editing anything under `.github/` or `docs/`.
