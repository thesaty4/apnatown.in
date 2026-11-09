## Summary

<!-- What changed and why. Link the feature ID(s) / spec path(s). -->

## Spec link

- BE spec: `specs/<module>/be/<id>-<slug>.md`
- FE spec: `specs/<module>/fe/<id>-<slug>.md`

## Acceptance criteria met

<!-- Copy each Given/When/Then from the spec and mark it met. -->

- [ ] Given ... When ... Then ...

## Real test evidence

<!-- Paste actual commands run and their output/summary. Never claim a
test passed without having run it — see AGENTS.md "how to work". -->

```
$ <command>
<output summary>
```

## Security notes

<!-- What was checked (secure-coding-review skill). Required for
auth/payments/uploads/admin-permission/communications changes: quote
the security-auditor verdict. -->

## UI states and screenshots (frontend changes)

<!-- 360px + desktop, light + dark, EN + HI. Cover default + at least
one non-default UX state (skeleton/empty/error/no-permission). -->

## Assumptions

<!-- Anything interpreted from an ambiguous spec. Link the
docs/PROJECT.md "Open questions" entry if one was raised. -->

## Risk and rollback

<!-- What could break, and how to revert (feature flag off, revert
commit, migration down-path). -->

## Agent review summary

- `code-reviewer` verdict: <!-- APPROVE / CHANGES_REQUESTED -->
- `security-auditor` verdict (if required): <!-- PASS / FAIL / n/a -->

## Human review guide

<!-- 3-5 specific things a human reviewer should pay attention to. -->

- [ ]
- [ ]
- [ ]

## Checklist

- [ ] Spec acceptance criteria met
- [ ] Product invariants preserved (`docs/PROJECT.md`)
- [ ] Tests added/passing (including negative/security cases)
- [ ] `docs/FEATURE_INVENTORY.md` status updated
- [ ] `node scripts/validate-ai-setup.mjs` passes (if `.github/`/`docs/`
  changed)
- [ ] No secrets/PII in this diff
