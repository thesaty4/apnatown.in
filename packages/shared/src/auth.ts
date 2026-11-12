import { z } from 'zod';
import { IdSchema, TimestampSchema } from './wire.js';
import {
  AccountStatusSchema,
  PhoneInputSchema,
  UserRoleSchema,
} from './users.js';

export const ChallengeInputSchema = z.strictObject({ phone: PhoneInputSchema });
export const VerifyInputSchema = z.strictObject({
  code: z.string().regex(/^\d{6}$/),
});
export const ChallengeParamsSchema = z.strictObject({ challengeId: IdSchema });
export const ChallengeSchema = z.strictObject({
  challengeId: IdSchema,
  resendAfter: TimestampSchema,
  expiresAt: TimestampSchema,
});
export const CsrfSchema = z.strictObject({
  csrfToken: z.string().regex(/^[a-f0-9]{256}$/),
});
// Missing owner modules cannot establish approval. 'unavailable' grants no capability.
export const ApprovalStatesSchema = z.strictObject({
  businesses: z.literal('unavailable'),
  rider: z.literal('unavailable'),
});
export const PrincipalSchema = z.strictObject({
  userId: IdSchema,
  roles: z.array(UserRoleSchema),
  approvalStates: ApprovalStatesSchema,
  accountStatus: AccountStatusSchema,
});
export const SessionSchema = PrincipalSchema.extend({
  expiresAt: TimestampSchema,
});
export const LogoutSchema = z.strictObject({ loggedOut: z.literal(true) });
/** Local/test-only demo personas (ADR 0002). Rider has no owner module yet. */
export const DemoPersonaSchema = z.enum([
  'customer',
  'vendor',
  'provider',
  'admin',
  'super_admin',
]);
export const DemoSessionInputSchema = z.strictObject({
  persona: DemoPersonaSchema,
});
export type DemoPersona = z.infer<typeof DemoPersonaSchema>;
export type DemoSessionInput = z.infer<typeof DemoSessionInputSchema>;
export type Principal = z.infer<typeof PrincipalSchema>;
export type SessionResponse = z.infer<typeof SessionSchema>;
export type ChallengeInput = z.infer<typeof ChallengeInputSchema>;
export type VerifyInput = z.infer<typeof VerifyInputSchema>;
