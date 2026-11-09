---
description: Implement one task (feature spec or bug) end to end following the AGENTS.md lifecycle.
---

Implement the task described below, following `AGENTS.md`'s read order
and lifecycle.

1. If no spec exists yet for a non-trivial feature, invoke
   `spec-writer` first (`.github/agents/spec-writer.agent.md`,
   `.github/skills/spec-writing/SKILL.md`).
2. Implement with `developer-backend` and/or `developer-frontend`
   (`.github/agents/developer-backend.agent.md`,
   `.github/agents/developer-frontend.agent.md`), using the relevant
   skills (`api-endpoint`, `ui-component`, `write-tests`, and any
   domain skill that matches the module).
3. If the task touches auth, payments, uploads/CSV, embeds, admin
   permissions, or communications, run `security-auditor` before
   review.
4. Run `code-reviewer`; address any Blocker and re-submit (max 3
   loops, then escalate).
5. On `APPROVE` (and `security-auditor` `PASS` if required), run
   `pr-creator` to open the PR.

Task:

<!-- Describe the feature ID / bug / change here -->
