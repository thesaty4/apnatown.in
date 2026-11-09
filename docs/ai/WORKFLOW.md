# AI Workflow

Practical "which prompt/file do I use" guide. The canonical lifecycle
diagram, agent roster, and hard limits are in `AGENTS.md` — this file
only adds what that diagram doesn't: which `.github/prompts/*` to
start from, and who to ask when stuck.

## Which prompt to start from

| Situation | Prompt | Leads to |
|---|---|---|
| New feature, no spec yet | `.github/prompts/write-spec.prompt.md` | `spec-writer` (-> `architect` if cross-module) |
| Spec exists, ready to build | `.github/prompts/implement-task.prompt.md` | `developer-backend`/`developer-frontend` -> (`security-auditor` if sensitive) -> `code-reviewer` -> `pr-creator` |
| Reviewing an open PR | `.github/prompts/review-pr.prompt.md` | `code-reviewer` |
| A bug report | `.github/prompts/fix-bug.prompt.md` | `bug-fixer` -> same security/review/PR steps as above |

## Keeping the setup itself healthy

- Run `node scripts/validate-ai-setup.mjs` after any change under
  `.github/` or `docs/` (also runs in CI —
  `.github/workflows/validate-ai-setup.yml`).
- Adding a feature ID, invariant, module, instruction, skill, or agent
  requires updating `docs/ai/COVERAGE_MATRIX.md` so no row is empty.
- Record durable lessons in `docs/ai/LESSONS_LEARNED.md`
  (`.github/skills/lessons-learned/SKILL.md`).

## Who to ask

- Product ambiguity -> add to `docs/PROJECT.md` "Open questions" and
  ask a human, don't guess.
- Design/module-boundary conflict -> `architect`.
- Security trade-off -> `security-auditor`.
- Still blocked after 3 `code-reviewer` loops -> escalate to a human
  (`AGENTS.md` escalation rules).
