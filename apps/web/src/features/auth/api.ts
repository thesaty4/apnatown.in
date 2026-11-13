import { ChallengeSchema, SessionSchema } from '@apnatown/shared/auth';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

export async function requestChallenge(
  api: BrowserApi,
  phone: string,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/auth/otp/challenges', {
      params: { header },
      body: { phone },
    }),
    ChallengeSchema,
  );
}

export async function verifyChallenge(
  api: BrowserApi,
  input: { challengeId: string; code: string },
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  unwrap(
    await api.POST('/auth/otp/challenges/{challengeId}/verify', {
      params: { header, path: { challengeId: input.challengeId } },
      body: { code: input.code },
    }),
    SessionSchema,
  );
  // The live /session query owns identity. Never retain a verify response.
}
