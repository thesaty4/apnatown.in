---
applyTo: "docs/**,specs/**,**/*.md"
---

# Specs and docs

Builds on `.github/copilot-instructions.md`. Templates:
`specs/_templates/`. Feature list: `docs/FEATURE_INVENTORY.md`.

## Spec-driven rules

- No non-trivial feature is implemented without a spec in
  `specs/<module>/{be,fe}/` first (written by `spec-writer`,
  `.github/agents/spec-writer.agent.md`); trivial bug fixes are the
  exception (`bug-fixer` writes a regression test instead).
- `<module>` must be one of the 21 modules in `docs/architecture.md`;
  don't invent a new module name without updating
  `docs/architecture.md` and getting human sign-off (via an ADR).
- A BE spec and its FE spec link to each other. Writing a spec means
  writing only the spec files: no inventory/progress/register updates
  unless asked, and no speculative design beyond the features (KISS).

## Given/When/Then

Every acceptance criterion is written as:

```
Given <context>
When <action>
Then <outcome>
```

Include at least one negative/authorization case per spec
(`testing.instructions.md`).

## DRY for docs

- State a rule once, in the most specific file, and link to it
  elsewhere — never paste the same checklist/rule block into multiple
  `.md` files. If you find yourself copying a paragraph, replace the
  copy with a link.
- Business rules live only in `docs/project/04-business-rules.md`;
  domain instruction files reference the rule ID (`BR-xx`), they don't
  restate the full text.
- Keep `.github/copilot-instructions.md` and every
  `.github/instructions/*.instructions.md` file under **4,000
  characters** — move detail to `docs/` and link to it
  (`scripts/validate-ai-setup.mjs` enforces this).

## Markdown conventions

- Use real ApnaTown module/feature names and IDs — no lorem ipsum or
  placeholder text in anything that ships; unknown environment-specific
  values get a `TODO(verify)` comment.
- Every referenced file path must exist (or be created in the same
  change); every internal link must resolve —
  `scripts/validate-ai-setup.mjs` checks both.
- Tables over prose for anything enumerable (states, roles, modules,
  options) — easier to scan and to keep in sync with code.

## Spec coverage

`node scripts/check-spec-coverage.mjs` is the coverage gate for specs.
