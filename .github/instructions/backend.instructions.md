---
applyTo: 'apps/api/**,packages/shared/**'
---

# Backend

Builds on `AGENTS.md` and
`solid-dry-design.instructions.md`. Implementation contracts:
`specs/_foundation/backend-shared.md` and `specs/_foundation/architecture.md`.
Implementation verification: run the affected build and fix related
build errors. Do not start Docker/runtime services, apply migrations or
seeds, or run manual API/DB checks.

## Layers

`controller -> service -> repository -> integration port`. Controllers
validate DTOs (zod, from `packages/shared`) and map domain errors to
the error contract below; they never touch a repository directly.
Services hold business rules and call repositories/integration ports
via interfaces (dependency inversion). Only owning repository adapters
and shared persistence infrastructure import Prisma; use-cases own
transactions through ports (`database.instructions.md`).

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
- Public image DTOs use `MediaGatewayPathSchema` root-relative paths;
  never return absolute provider URLs that bypass Media authorization.

## Pagination and filtering

- Opaque keyset pagination with a stable tie-breaker, explicit default
  and hard cap 50; return the owning DTO's `nextCursor` and required
  counts. Never substitute offset pagination for feeds/queues.
- Every filterable/sortable field used in Explore/Search/admin lists is
  indexed (`database.instructions.md`) and allow-listed here.

## Error contract

```json
{
  "code": "COMMON_NOT_FOUND",
  "message_key": "errors.common.notFound",
  "status": 404,
  "details": {},
  "correlationId": "request-id"
}
```

- All five fields are required; HTTP status matches `status`. The
  client localizes `message_key`; details contain only safe allow-listed
  parameters, never submitted PII, a stack or SQL error.
- Preserve module-owned codes; use the canonical catalogue and wire
  rules in `specs/_foundation/backend-shared.md` and `data-model.md`.
- Map domain errors (e.g. `InvalidTransitionError`, `OutOfStockError`,
  `OutOfDeliveryRangeError`) to specific codes and appropriate HTTP
  status (400/403/404/409/422).

## Idempotency and transactions

- State-changing writes that can be retried (checkout, payment
  webhooks, refund actions) accept/require an idempotency key or are
  naturally idempotent by state-machine guard.
- Commit the domain write, outbox, required audit and non-secret
  idempotency result atomically through the shared unit of work.
  External calls happen outside the transaction and use the owning
  reconciliation flow; never hold DB locks across provider calls.

## Background jobs

- Long-running or external-dependent work (notifications, media
  processing, communications sends) goes through the queue, not inline
  in the request/response cycle.
- Use pg-boss plus the PostgreSQL transactional outbox, no Redis at
  launch. Jobs deduplicate at-least-once delivery and use bounded
  retries; terminal failures are observable with explicit operator
  replay, not an invented admin queue screen.

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
