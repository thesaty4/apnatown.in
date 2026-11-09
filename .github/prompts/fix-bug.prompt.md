---
description: Reproduce, write a failing regression test, and minimally fix a reported bug using bug-fixer.
---

Fix the bug described below using `.github/agents/bug-fixer.agent.md`
and `.github/skills/bug-triage/SKILL.md`.

1. Reproduce it; if you can't, ask for more detail instead of guessing.
2. Classify severity/area and check `docs/ai/LESSONS_LEARNED.md` for a
   similar prior issue.
3. Write a failing regression test for the exact bug first
   (`testing.instructions.md`).
4. Apply the smallest correct fix; do not refactor unrelated code.
5. Verify the full relevant test suite passes.
6. Add/update a `docs/ai/LESSONS_LEARNED.md` entry if this reveals a
   reusable lesson (`.github/skills/lessons-learned/SKILL.md`).
7. If the bug/fix touches auth, payments, uploads/CSV, embeds, admin
   permissions, or communications, run `security-auditor` before
   `code-reviewer`.

Bug:

<!-- Describe the bug / link the issue here -->
