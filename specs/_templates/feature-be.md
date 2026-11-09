# BE Spec: <Feature ID> — <Feature name>

- **Feature ID:** <e.g. CK2>
- **Module:** `<one of the 21 modules in docs/architecture.md>`
- **FE spec:** `specs/<module>/fe/<id>-<slug>.md`
- **Role(s):** <from docs/FEATURE_INVENTORY.md>
- **Status:** draft | ready for dev | in review | done

## 1. Summary

One paragraph: what this endpoint/service does and why, referencing the
relevant `docs/FEATURE_INVENTORY.md` row and any product invariant
(`docs/PROJECT.md`) it must preserve.

## 2. API contract

- **Endpoint(s):** `METHOD /path`
- **Request DTO:** fields, types, validation rules (allow-listed
  values called out explicitly)
- **Response DTO:** fields, types
- **Error contract:** status codes and error shapes (see
  `backend.instructions.md`)
- **Pagination / filtering / sorting:** allow-listed fields only

## 3. States and transitions

If this feature touches a status model (order, delivery job, approval,
payment, refund, review, offer, video, enquiry, subcategory suggestion,
comment, campaign — `docs/PROJECT.md`), state the exact states and
allowed transitions here.

## 4. Acceptance criteria (Given/When/Then)

```
Given <context>
When <action>
Then <outcome>
```

Include at least one negative/authorization case and one
invalid-input case.

## 5. Authorization

Role(s) allowed, ownership check, admin scope check (city/area +
permission module/action) if applicable.

## 6. Security notes

Call out anything from `security.instructions.md` that applies
specifically here (e.g. OTP handling, upload validation, webhook
verification).

## 7. i18n / formatting

Any money/date/distance formatting or EN/HI message keys this endpoint
drives in the response.

## 8. Test plan

- Unit tests: <list>
- Integration tests: <list>
- Negative/authorization tests: <list>

## 9. Open questions

Anything ambiguous — record here and in `docs/PROJECT.md` "Open
questions" instead of guessing.
