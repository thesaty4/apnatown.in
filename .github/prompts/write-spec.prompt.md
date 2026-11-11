---
description: Write BE and FE specs for a feature in docs/FEATURE_INVENTORY.md using spec-writer.
---

Write the backend and frontend specs for the feature described below,
using `.github/agents/spec-writer.agent.md` and
`.github/skills/spec-writing/SKILL.md`.

1. Locate the feature row in `docs/FEATURE_INVENTORY.md`; if it isn't
   listed, ask before inventing an ID.
2. Read `docs/project/04-business-rules.md` and the relevant
   `.github/instructions/domain-*.instructions.md` file.
3. Ask a clarifying question (don't guess) for anything ambiguous;
   otherwise record it under `docs/project/12-decisions-assumptions-open-questions.md`.
4. Copy `specs/_templates/feature-be.md` and
   `specs/_templates/feature-fe.md` into `specs/<module>/{be,fe}/`,
   fill them in with Given/When/Then acceptance criteria, and
   cross-link them.
5. Update the `docs/FEATURE_INVENTORY.md` row (paths, status
   `spec written`).

Feature:

<!-- Feature ID or description here -->
