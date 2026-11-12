---
description: Implement one task (feature spec or bug) end to end following the AGENTS.md lifecycle.
---

Implement the task described below, following `AGENTS.md`'s read order
and lifecycle.

1. If no spec exists yet for a non-trivial feature, invoke
   `architect` in specification mode (`.github/agents/architect.agent.md`,
   `.github/skills/spec-writing/SKILL.md`).
2. Implement with `developer-backend` and/or `developer-frontend`
   (`.github/agents/developer-backend.agent.md`,
   `.github/agents/developer-frontend.agent.md`), using the relevant
   skills (`api-endpoint`, `ui-component`, `write-tests`, and any
   domain skill that matches the module).
3. If the task touches auth, payments, uploads/CSV, embeds, admin
   permissions, or communications, run `security-auditor` before
   review.
4. Run `architect` in read-only code-review mode; address any Blocker and re-submit (max 3
   loops, then escalate).
5. On architect `APPROVE` (and `security-auditor` `PASS` if required),
   the owning developer uses `.github/skills/pr-description/SKILL.md`
   to open the PR and request human review. Select one PR owner for
   combined BE/FE work; agents never approve or merge their own PRs.

Task:

<!-- Describe the feature ID / bug / change here -->
