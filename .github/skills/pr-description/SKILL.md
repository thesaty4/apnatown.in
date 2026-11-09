---
name: pr-description
description: Recipe for filling the PR template honestly and completely, used by the pr-creator agent.
---

# PR description

Used by `.github/agents/pr-creator.agent.md`. Template:
`.github/pull_request_template.md`.

## Steps

1. Summary: what changed and why, in one or two sentences, linking the
   feature ID(s)/spec path(s).
2. Acceptance criteria: list each Given/When/Then from the spec and
   mark it met.
3. Test evidence: paste the **actual** commands run and their output/
   summary — never claim a test passed without having run it.
4. Security notes: state what was checked
   (`secure-coding-review` skill) and, if required, quote the
   `security-auditor` verdict.
5. UI states and screenshots (frontend changes): attach 360px +
   desktop, light + dark, EN + HI screenshots covering at least the
   default and one non-default UX state.
6. Assumptions: anything interpreted from an ambiguous spec, with a
   link to the "Open questions" entry if one was raised.
7. Risk and rollback: what could break, and how to revert (feature
   flag off, revert commit, migration down-path).
8. Agent review summary: `code-reviewer` verdict and
   `security-auditor` verdict (if applicable), quoted verbatim.
9. Human review guide/checklist: 3-5 specific things a human reviewer
   should pay attention to for this change.

## Checklist

- [ ] Every section of the PR template is filled, none left as
  placeholder text.
- [ ] Test evidence is real (commands + output), not asserted.
- [ ] Screenshots attached for frontend UI changes.
- [ ] Both required agent verdicts are quoted, not summarized away.
