# Specs templates

Every feature in `docs/design-context/01-feature-inventory.md` gets a backend spec and a
frontend spec before implementation. Follow `AGENTS.md` and use the linked
templates below.

- Copy `feature-be.md` to `specs/<module>/be/<id>-<slug>.md`.
- Copy `feature-fe.md` to `specs/<module>/fe/<id>-<slug>.md`.
- `<module>` must be one of the 21 modules in `specs/_foundation/architecture.md`.
- `<id>` is the feature ID from `docs/design-context/01-feature-inventory.md` (e.g.
  `ck2`, `rd4`).
- The BE and FE spec for the same feature must link to each other
  ("BE spec" / "FE spec" fields) and to the same feature ID row.
- Given/When/Then is mandatory for every acceptance criterion.
- Write only requested specs; update inventory status/paths only when
  explicitly asked.
