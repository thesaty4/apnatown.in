---
description: Run architect in read-only code-review mode, with security-auditor when required, against an open pull request.
---

Review the pull request described below using
`.github/agents/architect.agent.md` in **read-only code-review mode**.

For media/maps-related work, read and follow the
[canonical media/maps contract](../../specs/_foundation/media-and-maps.md)
and its [manual acceptance criteria](../../specs/_foundation/media-and-maps.md#manual-acceptance)
alongside the owning module specs. Preserve this prompt's lifecycle mode,
React Query requirements and verification policy; do not reopen settled
provider choices or enable direct video-file uploads.

1. Read the linked spec(s) in `specs/<module>/` and confirm every
   acceptance criterion is met.
2. Check the business rules in `docs/project/04-business-rules.md`
   relevant to the touched module(s) (`docs/ai/COVERAGE_MATRIX.md`
   maps invariants to modules).
3. Check `solid-dry-design.instructions.md` and the relevant
   `frontend`/`backend`/`domain-*` instruction files.
4. Re-run relevant non-test checks and inspect manual acceptance evidence;
   don't trust the PR description alone or request automated test files.
5. If the change touches auth, payments, uploads/CSV, embeds, admin
   permissions, or communications and no `security-auditor` `PASS` is
   attached, that is a Blocker by itself — request it before
   proceeding.
6. Output the structured Blocker/Major/Minor/Nit review with a verdict
   (`architect.agent.md` code-review output format).

Pull request:

<!-- Link or paste the PR / diff here -->
