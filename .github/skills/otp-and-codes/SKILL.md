---
name: otp-and-codes
description: "Recipe for implementing any one-time code flow (login OTP, delivery OTP, pickup code) with server-side-only generation and verification."
---

# OTP and codes

Covers AU4, RD4, OR3-OR4 (`domain-delivery-riders.instructions.md`,
`security.instructions.md` invariant 5).

## Steps

1. Generate the code server-side (login OTP, delivery OTP, or pickup
   code) when its triggering event occurs (login attempt, delivery job
   reaching `picked_up`, or order marked for self-pickup); never let
   the client generate or choose a code.
2. Store the code hashed (not plaintext) with an expiry and an attempt
   counter, scoped to the specific login attempt/order/delivery job.
3. Send it only through its intended channel (SMS for login OTP, shown
   to the customer in-app for delivery OTP/pickup code) —
   `integrations.instructions.md` `SmsOtpProvider` for SMS sends.
4. Verify server-side only: compare hashes, increment the attempt
   counter on mismatch, lock out after the configured attempt limit,
   and enforce a resend cooldown on regeneration.
5. Never log the code, never return it in any API response other than
   its intended delivery channel, never accept a code match performed
   client-side as sufficient to transition order/delivery state.
6. Gate the relevant state transition (`order-state-machine` skill) on
   successful verification only.

## Skeleton

```ts
async function verifyOtp(sessionId: string, submitted: string): Promise<void> {
  const record = await otpStore.get(sessionId);
  if (!record || record.expiresAt < now()) throw new OtpExpiredError();
  if (record.attempts >= MAX_ATTEMPTS) throw new OtpLockedError();
  const match = await compareHash(submitted, record.codeHash);
  if (!match) {
    await otpStore.incrementAttempts(sessionId);
    throw new OtpMismatchError();
  }
  await otpStore.markVerified(sessionId);
}
```

## Checklist

- [ ] Code generated and verified server-side only.
- [ ] Stored hashed, with expiry and attempt limit.
- [ ] Never logged or returned outside its delivery channel.
- [ ] Resend has a cooldown.
- [ ] State transition only happens after successful verification.
