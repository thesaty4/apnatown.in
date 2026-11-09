# AI Workflow

How `docs/`, `.github/instructions/`, `.github/agents/`, and
`.github/skills/` fit together day to day. See `AGENTS.md` for the
canonical lifecycle diagram and hard limits; this file is the
practical "how do I start" guide.

## Starting a new feature

1. Find the feature's row in `docs/FEATURE_INVENTORY.md`. If its status
   is `not started`, run `spec-writer`
   (`.github/prompts/write-spec.prompt.md`) to produce
   `specs/<module>/be/*.md` and `specs/<module>/fe/*.md`.
2. If the feature needs a new module or crosses module boundaries,
   `spec-writer` hands off to `architect` first
   (`.github/agents/architect.agent.md`).
3. Once specs exist, run `developer-backend` and/or
   `developer-frontend` (`.github/prompts/implement-task.prompt.md`),
   which use the matching `.github/instructions/*.instructions.md`
   files and `.github/skills/*` recipes.
4. If the change touches `auth`, `payments`, uploads/CSV, embeds, admin
   permissions, or `communications`, `security-auditor` runs before
   `code-reviewer` — this is enforced, not optional.
5. `code-reviewer` runs (`.github/prompts/review-pr.prompt.md`);
   Blockers send it back to the developer agent (max 3 loops, then
   escalate to a human).
6. On `APPROVE`, `pr-creator` opens the PR
   (`.github/pull_request_template.md`); a human merges.

## Fixing a bug

Use `.github/prompts/fix-bug.prompt.md` ->
`.github/agents/bug-fixer.agent.md` ->
`.github/skills/bug-triage/SKILL.md`, then the same
security-auditor/code-reviewer/pr-creator steps as above if the area is
sensitive.

## Keeping the setup itself healthy

- Any change under `.github/` or `docs/` should be followed by
  `node scripts/validate-ai-setup.mjs` (also runs in CI —
  `.github/workflows/validate-ai-setup.yml`).
- Adding a new feature ID, invariant, module, instruction, skill, or
  agent requires updating `docs/ai/COVERAGE_MATRIX.md` so no row is
  left empty.
- Record durable lessons in `docs/ai/LESSONS_LEARNED.md` — read before
  starting non-trivial work in a module it covers.

## Who to ask

- Product ambiguity -> add to `docs/PROJECT.md` "Open questions" and
  ask a human (don't guess).
- Design/module-boundary conflict -> `architect`.
- Security trade-off -> `security-auditor`.
- Anything else blocking after 3 review loops -> escalate to a human
  per `AGENTS.md`.
