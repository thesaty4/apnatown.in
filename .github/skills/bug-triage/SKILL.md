---
name: bug-triage
description: Recipe for triaging a reported bug before fixing it — reproduce, classify severity/area, and find the right spec/instruction context.
---

# Bug triage

Used by `.github/agents/bug-fixer.agent.md` before the fix step.

## Steps

1. Reproduce the bug from the report; if it can't be reproduced, ask
   for more detail (exact steps, role, device, EN/HI) rather than
   guessing a fix.
2. Classify severity: **Blocker** (data loss, security, money
   incorrect, invariant violated), **Major** (feature broken for a
   role/journey), **Minor** (cosmetic/edge case), and area (which of
   the 21 modules in `docs/architecture.md`).
3. Find the owning spec (`specs/<module>/`) and the relevant
   `.github/instructions/domain-*.instructions.md` file to understand
   intended behaviour before concluding it's actually a bug (vs. a
   spec gap — hand that to `spec-writer` instead).
4. Check `docs/ai/LESSONS_LEARNED.md` for a similar past issue.
5. If it's a security-sensitive area (auth/payments/uploads/admin-
   permission/communications), flag that `security-auditor` will be
   required after the fix.
6. Hand off to the fix step (`bug-fixer` agent) with: root cause
   hypothesis, severity/area classification, and the spec/instruction
   references used.

## Checklist

- [ ] Reproduced (or clarifying question asked instead of guessing).
- [ ] Severity and module classified.
- [ ] Confirmed against the spec that this is a bug, not a spec gap.
- [ ] Checked `docs/ai/LESSONS_LEARNED.md` for a prior similar issue.
- [ ] Security-sensitivity flagged if applicable.
