---
description: Run the code-reviewer (and security-auditor if required) against an open pull request.
---

Review the pull request described below using
`.github/agents/code-reviewer.agent.md`.

1. Read the linked spec(s) in `specs/<module>/` and confirm every
   acceptance criterion is met.
2. Check the product invariants in `docs/PROJECT.md` relevant to the
   touched module(s) (`docs/ai/COVERAGE_MATRIX.md` maps invariants to
   modules).
3. Check `solid-dry-design.instructions.md` and the relevant
   `frontend`/`backend`/`domain-*` instruction files.
4. Re-run the tests; don't trust the PR description alone.
5. If the change touches auth, payments, uploads/CSV, embeds, admin
   permissions, or communications and no `security-auditor` `PASS` is
   attached, that is a Blocker by itself — request it before
   proceeding.
6. Output the structured Blocker/Major/Minor/Nit review with a verdict
   (`code-reviewer.agent.md` output format).

Pull request:

<!-- Link or paste the PR / diff here -->
