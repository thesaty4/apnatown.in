---
name: pr-description
description: Recipe for developer-backend or developer-frontend to fill the PR template and open a PR after architect and required security approval.
---

# PR description

Used by the owning `.github/agents/developer-backend.agent.md` or
`.github/agents/developer-frontend.agent.md`. Template:
`.github/pull_request_template.md`.

## Preconditions

- `architect` code-review verdict for the current diff is `APPROVE`.
- `security-auditor` verdict for the current diff is `PASS` when sensitive.
- If either required verdict is missing or failing, return to that review
  stage; do not open the PR. For combined BE/FE work, use one developer PR owner.

## Steps

1. Summary: what changed and why, in one or two sentences, linking the
   feature ID(s)/spec path(s).
2. Acceptance criteria: list each Given/When/Then from the spec and
   mark it met.
3. Verification evidence: paste the **actual** commands run and their output/
   summary plus manual observations and gaps; never claim an unrun check passed.
4. Security notes: state what was checked
   (`secure-coding-review` skill) and, if required, quote the
   `security-auditor` verdict.
5. UI states and screenshots (frontend changes): attach 360px +
   desktop, light + dark, EN + HI screenshots covering at least the
   default and one non-default UX state.
6. Assumptions: anything interpreted from an ambiguous spec, with a
   link to the "Open questions" entry if one was raised.
7. Risk and rollback: what could break, and how to revert (feature
   flag off, revert commit, forward-fix migration or documented recovery).
8. Agent review summary: `architect` code-review verdict and
   `security-auditor` verdict (if applicable), quoted verbatim.
9. Human review guide/checklist: 3-5 specific things a human reviewer
   should pay attention to for this change.
10. Push the task branch and open the PR against `main`. Apply appropriate
    area/review labels and request human review from `.github/CODEOWNERS`;
    never approve or merge the PR yourself.

Output the PR URL/number and the quoted required verdicts. If publication
is blocked by missing access/tooling, report it explicitly rather than
claiming the PR was created.

## Checklist

- [ ] Every section of the PR template is filled, none left as
  placeholder text.
- [ ] Verification evidence is real (commands + output), not asserted.
- [ ] Screenshots attached for frontend UI changes.
- [ ] Both required agent verdicts are quoted, not summarized away.
