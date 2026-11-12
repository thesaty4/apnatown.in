---
description: Write linked BE and FE specs using architect in specification mode and the spec-writing skill.
---

Write the backend and frontend specs for the feature described below,
using `.github/agents/architect.agent.md` in specification mode and
`.github/skills/spec-writing/SKILL.md`.

1. Locate the feature row in `docs/FEATURE_INVENTORY.md`; if it isn't
   listed, ask before inventing an ID.
2. Read `docs/project/04-business-rules.md` and the relevant
   `.github/instructions/domain-*.instructions.md` file.
3. Ask a clarifying question (don't guess) for anything ambiguous;
   record an open question and any stated assumption in the owning spec.
4. Copy `specs/_templates/feature-be.md` and
   `specs/_templates/feature-fe.md` into `specs/<module>/{be,fe}/`,
   fill them in with Given/When/Then acceptance criteria, and
   cross-link them.
5. Run `node scripts/check-spec-coverage.mjs`. Write only requested
   specs; update inventories or other documentation only if explicitly asked.

Feature:

<!-- Feature ID or description here -->
