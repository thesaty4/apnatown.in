---
name: search-keyword-mapping
description: "Recipe for mapping a keyword to category/subcategory/product tags, with Hindi/Hinglish/typo tolerance and an admin preview."
---

# Search keyword mapping

Covers SR2-SR3, AD15, SA8 (`domain-catalog-search.instructions.md`).

## Steps

1. Model a keyword mapping as `keyword -> [{ type: category |
   subcategory | productTag, targetId }]` in the `catalog`/`search`
   schema (`packages/shared`), editable only by admins with the
   relevant permission (AD15) or super_admin (SA8).
2. Normalize incoming query text: lowercase, trim, and run through a
   transliteration/fuzzy-match step so Hindi ("एसी") and typo'd English
   ("plumbr") queries resolve against the same mapping table as "AC" —
   never hard-code a separate branch per language or per typo.
3. Resolve a query to **all** mapped targets (e.g. "AC" -> AC products +
   electronics shops + AC services + videos), returning grouped results
   (`search-result-groups` component, `docs/design-system.md`).
4. Before saving a new/edited mapping, show the admin a **preview** of
   what it will match (AD15) so they can catch an unintended match.
5. Manually verify with real Hindi/Hinglish/typo examples from `docs/glossary.md`
   and the product brief ("एसी", "plumbr", "iPhone 15").

## Skeleton

```ts
async function resolveSearchTargets(query: string): Promise<SearchTarget[]> {
  const normalized = normalizeForSearch(query); // lowercase, transliterate, fuzzy-correct
  const mapping = await keywordMappings.findByKeyword(normalized);
  return mapping?.targets ?? fallbackFreeTextSearch(normalized);
}
```

## Checklist

- [ ] One mapping table drives all language/typo variants — no
  per-language branching.
- [ ] A query resolves to all relevant target types, grouped.
- [ ] Admin sees a preview before saving a mapping.
- [ ] Manually verified against real Hindi/Hinglish/typo examples.
