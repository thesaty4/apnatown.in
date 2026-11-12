# Specs templates

Every feature in `docs/FEATURE_INVENTORY.md` gets a backend spec and a
frontend spec before implementation, written by `architect` in specification mode
(see `.github/agents/architect.agent.md` and
`.github/skills/spec-writing/SKILL.md`).

- Copy `feature-be.md` to `specs/<module>/be/<id>-<slug>.md`.
- Copy `feature-fe.md` to `specs/<module>/fe/<id>-<slug>.md`.
- `<module>` must be one of the 21 modules in `docs/architecture.md`.
- `<id>` is the feature ID from `docs/FEATURE_INVENTORY.md` (e.g.
  `ck2`, `rd4`).
- The BE and FE spec for the same feature must link to each other
  ("BE spec" / "FE spec" fields) and to the same feature ID row.
- Given/When/Then is mandatory for every acceptance criterion
  (`specs-and-docs.instructions.md`).
- Write only requested specs; update inventory status/paths only when
  explicitly asked, per the `spec-writing` skill.
