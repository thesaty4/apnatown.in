---
name: consent-and-notifications
description: "Recipe for WhatsApp/marketing opt-in, template-based sends, consent-aware audience counts, and honouring opt-outs."
---

# Consent and notifications

Covers NT1-NT4, AD12, invariant 10 in `docs/PROJECT.md`
(`domain-accounts-admin.instructions.md`, `integrations.instructions.md`).

## Steps

1. Record consent explicitly at the point of collection (signup,
   checkout, profile) with a timestamp and channel (WhatsApp/email/
   in-app) — never assume consent from account creation alone.
2. When resolving an audience for a campaign (AD12), filter to
   **consented** recipients only within the chosen scope (Overall/
   City-wise/Zone-wise) and show the admin the consent-aware count
   before send — never the raw audience size.
3. Use only provider-approved WhatsApp templates (not freeform text) for
   WhatsApp sends (`integrations.instructions.md`).
4. Require the review-before-send summary step; no direct send without
   it.
5. Provide an easy unsubscribe/opt-out path in every channel; apply
   opt-outs immediately so the very next send excludes that recipient.
6. Record a delivery report including opt-outs after sending.

## Skeleton

```ts
async function resolveAudience(scope: CampaignScope): Promise<ConsentedRecipient[]> {
  const candidates = await users.findByScope(scope); // city-wise/zone-wise/overall
  return candidates.filter(u => u.consent[scope.channel]?.granted && !u.consent[scope.channel]?.optedOut);
}
```

## Checklist

- [ ] Consent recorded with timestamp/channel at collection time.
- [ ] Audience count shown to admin is consent-aware, not raw.
- [ ] WhatsApp sends use approved templates only.
- [ ] Review-before-send step is mandatory.
- [ ] Opt-out takes effect on the very next send.
- [ ] Delivery report includes opt-outs.
