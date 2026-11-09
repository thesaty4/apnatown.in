---
name: lessons-learned
description: How and when to add an entry to docs/ai/LESSONS_LEARNED.md so recurring footguns don't reappear.
---

# Lessons learned

Use at the end of a `bug-fixer` run, or any time a non-obvious mistake
was caught in review that could recur elsewhere. Target file:
`docs/ai/LESSONS_LEARNED.md`.

## When to add an entry

- The bug/mistake is a **class** of error (could recur in another
  module/screen), not a one-off typo.
- It reveals a gap in an instruction file, skill, or spec template that
  should also be fixed.

## When *not* to add an entry

- One-off typos or simple logic slips with no reusable lesson.
- Anything already covered by an existing lesson — update that entry's
  examples instead of duplicating it.

## Steps

1. Write the lesson as: **what went wrong**, **why it happened**,
   **the rule that prevents it**, **where that rule now lives**
   (instruction file/skill/spec template).
2. Add it to `docs/ai/LESSONS_LEARNED.md` in the existing format (one
   bullet per lesson, newest at the top).
3. If the rule isn't already captured in an instruction file, update the
   relevant `.github/instructions/*.instructions.md` file too (and
   re-check its 4,000-character budget).
4. Run `node scripts/validate-ai-setup.mjs` if any `.github/`/`docs/`
   file changed.

## Skeleton entry

```
## <short title>
What: <symptom> happened because <root cause>.
Rule: <the rule that prevents it>.
Enforced in: `<instruction-file>.instructions.md` / `<skill>` / spec template.
```

## Checklist

- [ ] Lesson is a reusable class of mistake, not a one-off.
- [ ] Root cause stated, not just the symptom.
- [ ] Linked to where the rule now lives (DRY — don't just restate it
  here).
