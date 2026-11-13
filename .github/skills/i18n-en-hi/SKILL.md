---
name: i18n-en-hi
description: Recipe for adding translation keys for a new screen/component and checking long-Hindi-text behaviour before shipping.
---

# i18n EN/HI

Covers X1, `i18n-a11y.instructions.md`. Terms/tone:
`docs/design-context/09-content-and-i18n.md`.

## Steps

1. Name keys `<feature>.<screen>.<element>` and check
   `docs/design-context/09-content-and-i18n.md`/existing catalogs for a reusable key before adding
   a new one.
2. Add the English string to `en.json` first; never hard-code it in a
   component.
3. Add the Hindi string to `hi.json` — reviewed translation, not raw
   machine translation, for anything shipping to production; use
   the approved content terms for consistency (e.g. always "ऑर्डर" for
   Order).
4. Run all money/date/distance/phone values through `packages/shared`
   formatters inside the translated string (interpolation), never
   concatenate a formatted value with translated text manually.
5. Render the screen with the Hindi catalog active and check: no
   truncation, no overlapping layout, buttons/labels wrap instead of
   clipping (Hindi runs 30-60% longer).
6. Verify status indicators show icon + text in both languages, not
   colour alone.

## Skeleton

```json
// en.json
{ "checkout.address.addLabel": "Add a new address" }
// hi.json
{ "checkout.address.addLabel": "नया पता जोड़ें" }
```

```tsx
<Button>{t('checkout.address.addLabel')}</Button>
```

## Checklist

- [ ] Key added to both `en.json` and `hi.json`, reviewed Hindi text.
- [ ] No hard-coded user-facing strings remain.
- [ ] Screen checked with Hindi active for wrapping/overflow.
- [ ] Money/date/distance/phone formatted via shared formatters inside
  the string.
- [ ] Status shown with icon + text in both languages.
