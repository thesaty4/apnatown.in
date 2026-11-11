---
name: order-state-machine
description: "Recipe for implementing or extending the order state machine: per-shop split, explicit transition handlers, and required tests."
---

# Order state machine

Covers CK2, OR2 (`domain-commerce.instructions.md`, BR-03/BR-04 in
`docs/project/04-business-rules.md`).

## Steps

1. Confirm the order is already split per shop at checkout
   (`cart-checkout`) — never add a transition that assumes one order
   spans multiple shops.
2. Define/extend transitions as explicit handlers keyed by
   `(fromState, event)`, not a single `switch` — delivery mode:
   `placed -> accepted -> preparing -> ready -> out_for_delivery ->
   delivered`; pickup mode: `placed -> accepted -> ready -> picked_up`;
   both also allow `cancelled`/`refunded` from eligible states.
3. Each handler: validates the transition is allowed from the order's
   current state, applies side effects (stock adjustment, delivery job
   creation/update, notification), and persists atomically in one
   transaction.
4. Invalid transitions throw `InvalidTransitionError`
   (`backend.instructions.md` error contract) — never silently no-op.
5. Add a test per transition (happy path) plus at least one invalid
   transition test and one concurrency test (two simultaneous
   transition attempts on the same order).

## Skeleton

```ts
const transitions: Record<OrderStatus, Partial<Record<OrderEvent, (order: Order) => Order>>> = {
  placed: { accept: acceptOrder, cancel: cancelOrder },
  accepted: { prepare: markPreparing, cancel: cancelOrder },
  preparing: { ready: markReady },
  ready: { out_for_delivery: dispatchForDelivery, picked_up: markPickedUp },
  out_for_delivery: { deliver: markDelivered },
};

function transition(order: Order, event: OrderEvent): Order {
  const handler = transitions[order.status]?.[event];
  if (!handler) throw new InvalidTransitionError(order.status, event);
  return handler(order);
}
```

## Checklist

- [ ] One order per shop preserved end-to-end.
- [ ] Transitions are explicit handlers, not a growing switch/if-chain.
- [ ] Invalid transitions throw, never no-op.
- [ ] Stock/delivery-job side effects happen in the same transaction.
- [ ] Tests cover each transition, an invalid one, and a concurrency
  case.
