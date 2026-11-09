---
name: api-endpoint
description: Recipe for adding one backend endpoint following the layered architecture, DTO validation, and error contract.
---

# API endpoint

Use when implementing a BE spec's endpoint(s)
(`backend.instructions.md`).

## Steps

1. Find or write the zod DTO schemas in `packages/shared` for request
   and response — reuse existing entity schemas where possible.
2. Add/extend the repository interface method needed (parameterized
   query only, allow-listed sort/filter — `database.instructions.md`).
3. Implement the service method: business rules, calls the repository
   and any integration ports via their interfaces, throws typed domain
   errors on failure.
4. Add the controller: validates the DTO, calls the service, maps
   domain errors to the error contract, never touches the repository
   directly.
5. Authorize: role + ownership + scope check before the service call
   (`secure-coding-review` skill).
6. Register the route and update the OpenAPI contract.
7. Write unit tests (service, with fakes) and integration tests
   (controller -> service -> repository), including authorization
   negatives and malicious input (`testing.instructions.md`).
8. Link the implementation back to its BE spec; update
   `docs/FEATURE_INVENTORY.md` status.

## Skeleton

```ts
// controller
router.post('/orders/:id/cancel', async (req, res) => {
  const dto = CancelOrderDto.parse(req.body);
  authorize(req.ctx, { roles: ['customer'], ownerCheck: ownsOrder(req.params.id) });
  const result = await orderService.cancel(req.params.id, dto, req.ctx);
  res.json(CancelOrderResponseDto.parse(result));
});

// service
async cancel(orderId: string, dto: CancelOrderDto, ctx: RequestContext) {
  const order = await this.orders.findById(orderId);
  if (!order) throw new NotFoundError('ORDER_NOT_FOUND');
  if (!canTransition(order.status, 'cancelled')) throw new InvalidTransitionError();
  return this.orders.update(orderId, { status: 'cancelled', cancelReason: dto.reason });
}
```

## Checklist

- [ ] DTOs in `packages/shared`, no inline shapes.
- [ ] Repository method is the only DB access point.
- [ ] Authorization checked before any state change.
- [ ] Error contract followed (`backend.instructions.md`).
- [ ] Tests cover acceptance criteria + negatives.
