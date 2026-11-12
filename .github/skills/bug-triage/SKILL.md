---
name: bug-triage
description: Recipe for inspecting a reported bug before fixing it — classify severity/area and find the right spec/instruction context without service setup.
---

# Bug triage

Used by `.github/agents/developer-backend.agent.md` or
`.github/agents/developer-frontend.agent.md` before the fix step.

## Steps

1. Inspect the reported evidence and affected source; if details are
   missing, ask for exact steps, role, device and EN/HI context rather
   than starting Docker/services to reproduce it.
2. Classify severity: **Blocker** (data loss, security, money
   incorrect, invariant violated), **Major** (feature broken for a
   role/journey), **Minor** (cosmetic/edge case), and area (which of
   the 21 modules in `docs/architecture.md`).
3. Find the owning spec (`specs/<module>/`) and the relevant
   `.github/instructions/domain-*.instructions.md` file to understand
   intended behaviour before concluding it's actually a bug (vs. a
   spec gap — hand that to `architect` in specification mode instead).
4. Check `docs/ai/LESSONS_LEARNED.md` for a similar past issue.
5. If it's a security-sensitive area (auth/payments/uploads/admin-
   permission/communications), flag that `security-auditor` will be
   required after the fix.
6. Continue with the owning developer's fix step using: root cause
   hypothesis, severity/area classification, and the spec/instruction
   references used.

## Checklist

- [ ] Reported failure evidence inspected (or clarifying question asked).
- [ ] Severity and module classified.
- [ ] Confirmed against the spec that this is a bug, not a spec gap.
- [ ] Checked `docs/ai/LESSONS_LEARNED.md` for a prior similar issue.
- [ ] Security-sensitivity flagged if applicable.
