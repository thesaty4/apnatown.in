---
applyTo: "**"
---

# SOLID, DRY, KISS, YAGNI

Concrete rules, with ApnaTown examples. Product context:
`docs/PROJECT.md`; module map: `docs/architecture.md`.

## Single Responsibility

- A service method does one thing: e.g. `OrderService.transition()`
  only moves an order through its state machine; it does not also send
  notifications (that's `NotificationService`, called by an event
  handler) or compute refunds (that's `RefundService`).
- A React component either fetches/owns state or renders — split
  container and presentational components for anything non-trivial
  (`frontend.instructions.md`).

## Open/Closed via strategies, not type-checks

- **Payments:** one `PaymentProvider` interface (`charge`, `refund`,
  `verifyWebhook`); add a new gateway by adding an adapter in
  `integrations`, never by branching `if (provider === 'x')` in
  `cart-checkout`/`payments` services.
- **Notifications:** one `NotificationChannel` interface (in-app,
  email, WhatsApp); `communications`/`notifications` iterate channels,
  they don't special-case each one.
- **Order state machine:** each transition (`placed -> accepted`,
  `accepted -> preparing`, ...) is a handler registered against
  `(fromState, event)`; adding a transition means adding a handler, not
  editing a giant switch. Delivery-mode (delivery vs. pickup) differs by
  which transitions exist, not by `if (mode === 'delivery')` scattered
  through one handler.
- **Repository ports:** `ProductRepository`, `OrderRepository`, etc. are
  interfaces; services depend on the interface, the database engine
  (undecided — `docs/adr/0001-tech-stack.md`) is swappable behind it
  (`database.instructions.md`).
- **Shared schemas:** one zod schema per entity/DTO in
  `packages/shared`; both `apps/api` validation and `apps/web` forms
  import the same schema — never redefine a shape twice.

## Liskov / Interface segregation

- Every `PaymentProvider`/`NotificationChannel`/repository
  implementation must be substitutable without the caller knowing which
  one it is; don't add provider-specific methods to the shared
  interface — use capability checks or separate optional interfaces.

## Dependency inversion

- Controllers depend on services; services depend on repository/
  integration **interfaces** injected, not imported concretely, so
  tests can inject fakes (`integrations.instructions.md`).

## DRY

- State a business rule once: order-splitting-per-shop logic lives only
  in `cart-checkout`/`orders`; don't re-implement it in a report query.
- State a UI rule once: the Explore Services filter (EX6) is one
  component reused on Search and category pages — never forked.
- Formatters (money, IST time, distance, phone) live only in
  `packages/shared`; never reimplement `toFixed`/manual grouping
  elsewhere.
- Don't paste the same checklist into multiple instruction files — link
  to the owning file instead.

## KISS / YAGNI

- Build only what the current spec (`specs/<module>/`) requires;
  placeholders explicitly called "future" (e.g. SV5 booking/payment,
  PV7) stay as disabled/feature-flagged UI, not partially-built
  backends.

## Size limits and naming

- Keep functions under ~40 lines and files under ~300 lines; split by
  responsibility, not by line count alone.
- Name by domain language from `docs/glossary.md` (e.g. `enquiry`, not
  `lead`; `pickupCode`, not `pin2`).
- Module/folder names match `docs/architecture.md` exactly (21 modules).

## Error handling

- Services throw typed domain errors (e.g. `OutOfStockError`,
  `InvalidTransitionError`); controllers map them to the error contract
  in `backend.instructions.md`. Never swallow errors silently; never
  leak stack traces to clients.
