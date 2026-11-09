---
applyTo: "apps/api/**,packages/shared/**"
---

# Backend

Builds on `.github/copilot-instructions.md` and
`solid-dry-design.instructions.md`. Module map: `docs/architecture.md`.

## Layers

`controller -> service -> repository -> integration port`. Controllers
validate DTOs (zod, from `packages/shared`) and map domain errors to
the error contract below; they never touch a repository directly.
Services hold business rules and call repositories/integration ports
via interfaces (dependency inversion). Repositories are the **only**
place that talks to the database (`database.instructions.md`).

## DTO validation

- Every request body/query is validated against a `packages/shared` zod
  schema before reaching a service — explicit allow-listed fields only,
  no pass-through objects.
- Query filters/sort fields are validated against an enum of allowed
  values, never accepted as free-form strings used directly in a query.

## Response DTOs

- Responses are explicit DTOs (never leak ORM/DB entities); money as
  integer paise, timestamps as ISO-8601 UTC, enums as the shared
  string union — client formats for IST/locale display.

## Pagination and filtering

- Cursor or offset+limit pagination with a sane max page size; always
  return a `hasMore`/`nextCursor` or total count.
- Every filterable/sortable field used in Explore/Search/admin lists is
  indexed (`database.instructions.md`) and allow-listed here.

## Error contract

```
{ "error": { "code": "ORDER_NOT_FOUND", "message": "...", "details"?: {} } }
```

- Stable machine-readable `code` per error type; human `message` safe
  to show (or mapped to an i18n key by the client); never a raw stack
  trace or DB error to the client.
- Map domain errors (e.g. `InvalidTransitionError`, `OutOfStockError`,
  `OutOfDeliveryRangeError`) to specific codes and appropriate HTTP
  status (400/403/404/409/422).

## Idempotency and transactions

- State-changing writes that can be retried (checkout, payment
  webhooks, refund actions) accept/require an idempotency key or are
  naturally idempotent by state-machine guard.
- Multi-step writes (e.g. create order + decrement stock + create
  delivery job) run in a single transaction; never leave partial state
  on failure.

## Background jobs

- Long-running or external-dependent work (notifications, media
  processing, communications sends) goes through the queue, not inline
  in the request/response cycle.
- Jobs are idempotent (safe to redeliver) and have bounded retries with
  backoff; failures after max retries go to a dead-letter path that
  surfaces in `admin`/`audit`.

## Timeouts and retries

- Every outbound integration call (`integrations.instructions.md`) has
  an explicit timeout and bounded retry with backoff; never an
  unbounded retry loop.

## Observability

- Structured logs per request (no secrets/PII,
  `security.instructions.md`); correlate logs across a request with a
  request id.
- Emit metrics for queue depth, job failures, and integration latency/
  error rate; audit-log admin-triggered data changes (`audit` module).
