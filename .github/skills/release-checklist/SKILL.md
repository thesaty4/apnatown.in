---
name: release-checklist
description: Recipe used by the release-manager agent to prepare release notes and a migration/config/rollback checklist after a batch of PRs merge.
---

# Release checklist

Used by `.github/agents/release-manager.agent.md`.

## Steps

1. List merged PRs since the last release; group by area (module/
   feature area) using their summaries and
   `docs/FEATURE_INVENTORY.md` status changes.
2. Write release notes: new features, fixed bugs, and any change to a
   product invariant or status model
   (`docs/project/04-business-rules.md`,
   `docs/project/05-domain-model.md`) that affects
   existing users/vendors/riders.
3. Config/migration checklist:
   - New/changed environment variables (diff against `.env.example`).
   - Database migrations to run, in order, forward-only
     (`database.instructions.md`).
   - New feature flags and their default state.
   - Manual admin setup needed (new permission entries, communication
     templates, category/zone data).
4. Feature-flag and rollback plan: which changes are flag-gated, the
   rollback step for each risk (flag off / revert PR / migration
   down-path), and what to monitor post-release (error rates, queue
   depth, payment/OTP failure rates — `backend.instructions.md`
   observability).
5. Hand the release notes + checklist to a human; never execute the
   release.

## Checklist

- [ ] Release notes grouped by area, written from actual merged PRs.
- [ ] Env var and migration diffs listed explicitly, in order.
- [ ] Feature flags and their default states listed.
- [ ] Rollback step defined for every flagged risk.
- [ ] Monitoring points listed for the release window.
