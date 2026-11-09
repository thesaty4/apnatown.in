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
  spec-writer  -> specs/<module>/be/*.md + fe/*.md (BE<->FE linked)
        |
        v
  architect (for cross-module or new-module work; otherwise skip)
        |
        v
  developer-backend  and/or  developer-frontend
        |
        v
  security-auditor  (required for auth/payments/uploads/admin-permissions/communications)
        |
        v
  code-reviewer   -- Blocker found? --> back to developer-* (max 3 loops, then escalate to a human)
        |
        v  APPROVE
  pr-creator  -> opens PR, requests human review
        |
        v
      human merges (agents never merge)
```

`bug-fixer` enters this lifecycle at `developer-*` for an existing
regression (reproduce -> failing test -> minimal fix -> verify ->
lesson entry). `release-manager` runs after merge, never deploys.

## 3. Agent roster

See `.github/agents/*.agent.md` for each agent's full instructions:
`spec-writer`, `architect`, `developer-backend`, `developer-frontend`,
`code-reviewer`, `security-auditor`, `bug-fixer`, `pr-creator`,
`release-manager`.

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
- **Security-auditor is required**, not optional, before `pr-creator`
  for any change touching `auth`, `payments`, uploads/CSV, embeds,
  admin permissions, or `communications`.
- **Don't invent product behaviour.** If section 2 of the original
  product brief (now `docs/PROJECT.md`/`docs/FEATURE_INVENTORY.md`) is
  ambiguous, add it to `docs/project/12-decisions-assumptions-open-questions.md` and ask,
  rather than guessing.
- **Preserve invariants.** The business rules (BR-01..BR-22) in
  `docs/project/04-business-rules.md` are enforced by `code-reviewer`
  on every PR; a Blocker there always means CHANGES_REQUESTED.

## 5. Escalation rules

- `code-reviewer` escalates to a human after 3 review loops with
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
work in a module it covers, and every `bug-fixer` run ends by adding or
updating an entry there.

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
