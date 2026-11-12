---
description: Reproduce, fix and manually verify a bug with the owning developer agent, then obtain architect and required security review.
---

Fix the bug with `.github/agents/developer-backend.agent.md` or
`.github/agents/developer-frontend.agent.md`, according to the affected
area, and `.github/skills/bug-triage/SKILL.md`. For a spec gap, ask
`architect` to clarify the intended behavior before implementing.

For media/maps-related work, read and follow the
[canonical media/maps contract](../../specs/_foundation/media-and-maps.md)
and its [manual acceptance criteria](../../specs/_foundation/media-and-maps.md#manual-acceptance)
alongside the owning module specs. Preserve this prompt's lifecycle mode,
React Query requirements and verification policy; do not reopen settled
provider choices or enable direct video-file uploads.

1. Reproduce it; if you can't, ask for more detail instead of guessing.
2. Classify severity/area and check `docs/ai/LESSONS_LEARNED.md` for a
   similar prior issue.
3. Record the exact failing reproduction first; do not generate regression
   test files (`testing.instructions.md`, `verify-change` skill).
4. Apply the smallest correct fix; do not refactor unrelated code.
5. Repeat the reproduction and run relevant existing non-test checks.
6. Add/update a `docs/ai/LESSONS_LEARNED.md` entry if this reveals a
   reusable lesson (`.github/skills/lessons-learned/SKILL.md`).
7. If the bug/fix touches auth, payments, uploads/CSV, embeds, admin
   permissions, or communications, run `security-auditor`.
8. Run `architect` in read-only code-review mode for every fix; address
   Blockers and re-submit, escalating to a human after three unresolved loops.
9. The owning developer opens the PR only after architect `APPROVE` and
   required security `PASS`, following the `pr-description` skill.

Bug:

<!-- Describe the bug / link the issue here -->
