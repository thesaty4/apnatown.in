---
name: write-tests
description: Recipe for writing the right tests for a change — pyramid level, required case categories, and journey coverage.
---

# Write tests

Use alongside `api-endpoint`/`ui-component` and for any bug fix.
Full rules: `testing.instructions.md`.

## Steps

1. Identify the pyramid level: pure logic/formatters/state machines ->
   unit; controller+service+repository -> integration; a full critical
   journey (J1-J14 in `docs/project/06-user-journeys.md`) -> Playwright
   E2E.
2. Map every acceptance criterion in the spec (Given/When/Then) to at
   least one test.
3. Add the required case categories where relevant to this change:
   - Authorization negatives (wrong role, wrong ownership, wrong admin
     scope).
   - Malicious input (injection attempts, oversized payloads, invalid
     enums, script tags).
   - Money/time (paise rounding, UTC vs. IST, midnight boundaries).
   - Concurrency/idempotency (double-submit, duplicate webhook, race on
     limited stock).
   - Accessibility (automated a11y check + keyboard-only pass) for new
     interactive UI.
   - Frontend API integration: cover the relevant [React Query acceptance cases](../../../specs/_foundation/frontend-shared.md#api-integration-acceptance-and-tests).
     Use an isolated `QueryClient`/provider and fake typed transport;
     exercise actual query/mutation hooks, errors, keys and invalidation.
4. Use fakes for integration ports (`integrations.instructions.md`);
   never call real external providers in tests.
5. Run the full relevant suite, not just the new test, before handing
   off.

## Skeleton (unit, state machine)

```ts
describe('order state machine', () => {
  it('rejects an invalid transition', () => {
    expect(() => transition(order({ status: 'placed' }), 'delivered'))
      .toThrow(InvalidTransitionError);
  });
  it('does not oversell stock on concurrent checkout', async () => {
    const results = await Promise.allSettled([checkout(cartA), checkout(cartB)]);
    expect(stockRemaining()).toBeGreaterThanOrEqual(0);
  });
});
```

## Checklist

- [ ] Every acceptance criterion has a test.
- [ ] Authorization-negative cases included for new/changed endpoints.
- [ ] Malicious-input cases included for new input fields.
- [ ] Money/time edge cases included for money- or time-sensitive logic.
- [ ] Concurrency/idempotency case included for stock/payment/webhook
  changes.
- [ ] a11y check included for new interactive UI.
- [ ] Changed frontend API operations cover the shared React Query cases.
