import type { components } from '@apnatown/api-client';

export type Session = components['schemas']['SessionDto'];
export function accountScope(session: Session, epoch: number) {
  return {
    userId: session.userId,
    roles: [...session.roles].sort(),
    approvalStates: session.approvalStates,
    epoch,
  };
}
export type AccountScope = ReturnType<typeof accountScope>;

// These endpoints return locale-independent identity/preferences, not translated
// content. Never include phone, email, OTP, CSRF or other credentials in keys.
export const queryKeys = {
  session: ['auth', 'session'] as const,
  private: ['private'] as const,
  profile: (scope: AccountScope) => ['private', scope, 'profile'] as const,
  preferences: (scope: AccountScope) =>
    ['private', scope, 'preferences'] as const,
  pendingPreferences: (epoch: number) =>
    ['private', 'login-preferences', epoch] as const,
};
