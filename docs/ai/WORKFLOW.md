# AI Workflow

Practical "which prompt/file do I use" guide. The canonical lifecycle
diagram, agent roster, and hard limits are in `AGENTS.md` — this file
only adds what that diagram doesn't: which `.github/prompts/*` to
start from, and who to ask when stuck.

## Which prompt to start from

| Situation | Prompt | Leads to |
|---|---|---|
| New feature, no spec yet | `.github/prompts/write-spec.prompt.md` | `architect` in specification/design mode |
| Spec exists, ready to build | `.github/prompts/implement-task.prompt.md` | `developer-backend`/`developer-frontend` -> (`security-auditor` if sensitive) -> `architect` code review -> owning developer opens PR |
| Reviewing an open PR | `.github/prompts/review-pr.prompt.md` | `architect` in read-only code-review mode |
| A bug report | `.github/prompts/fix-bug.prompt.md` | Owning developer -> same security/review/PR steps as above |
| Release preparation after merge | `.github/skills/release-checklist/SKILL.md` | `architect` prepares notes/checklists -> human executes release |

The roster has four agents; their responsibilities and PR gates are in
[AGENTS.md](../../AGENTS.md#3-agent-roster). A developer resumes PR creation
only after architect `APPROVE` and required security `PASS`; review is a
separate read-only stage, not self-approval. For combined BE/FE tasks, select
one developer as PR owner.

## Keeping the setup itself healthy

- Run `node scripts/validate-ai-setup.mjs` after any change under
  `.github/` or `docs/` (also runs in CI —
  `.github/workflows/validate-ai-setup.yml`).
- Adding a feature ID, invariant, module, instruction, skill, or agent
  requires updating `docs/ai/COVERAGE_MATRIX.md` so no row is empty.
- Record durable lessons in `docs/ai/LESSONS_LEARNED.md`
  (`.github/skills/lessons-learned/SKILL.md`).

## Who to ask

- Product ambiguity -> add to `docs/project/12-decisions-assumptions-open-questions.md` and
  ask a human, don't guess.
- Design/module-boundary conflict -> `architect`.
- Security trade-off -> `security-auditor`.
- Still blocked after 3 architect code-review loops -> escalate to a human
  (`AGENTS.md` escalation rules).
