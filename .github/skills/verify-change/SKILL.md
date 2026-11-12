---
name: verify-change
description: Verify FE, BE and DB changes through existing non-test checks and manual acceptance scenarios without creating automated test files.
---

# Verify a change

Use alongside `api-endpoint`/`ui-component` and for any bug fix.
Follow the [verification policy](../../instructions/testing.instructions.md).
Do not create automated tests, test-only fixtures or runner configuration.

## Steps

1. Identify the changed surface and its acceptance criteria. For a bug,
   capture the exact reproduction and observed failure before fixing it.
2. Choose available lint/type-check/build/generated-contract checks and
   manual API, UI or DB observations; retain Given/When/Then scenarios.
3. Verify the relevant case categories without generating test files:
   - Authorization negatives (wrong role, wrong ownership, wrong admin
     scope).
   - Malicious input (injection attempts, oversized payloads, invalid
     enums, script tags).
   - Money/time (paise rounding, UTC vs. IST, midnight boundaries).
   - Concurrency/idempotency (double-submit, duplicate webhook, race on
     limited stock).
   - Accessibility: keyboard, focus, labels, contrast and responsive
     EN/HI/light/dark appearance using browser inspection.
   - Frontend API integration: cover the relevant [React Query acceptance cases](../../../specs/_foundation/frontend-shared.md#api-integration-acceptance-and-verification).
     Exercise the actual local app's pending/error states, scope changes,
     hydration and invalidation; do not substitute success-shaped mocks.
4. Use existing approved local adapters and isolated synthetic data
   (`integrations.instructions.md`); never contact real providers or
   mutate shared/production data.
5. Run the selected existing commands, repeat reproduction after a fix,
   and record actual results. Explicitly list scenarios not exercised
   and remaining risks; do not claim automated coverage.

## Checklist

- [ ] Changed acceptance criteria have evidence or an explicit gap.
- [ ] Authorization-negative cases included for new/changed endpoints.
- [ ] Malicious-input cases included for new input fields.
- [ ] Money/time edge cases included for money- or time-sensitive logic.
- [ ] Concurrency/idempotency case included for stock/payment/webhook
  changes.
- [ ] Manual a11y checks included for new interactive UI.
- [ ] Changed frontend API operations cover the shared React Query cases.
- [ ] No automated test files, test harnesses or runners added.
