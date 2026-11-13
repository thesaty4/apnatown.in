'use client';

import { useTranslations } from 'next-intl';
import { failureMessageKey } from '../../shared/auth/AccessState';

const sessionCodes = new Set(['SESSION_EXPIRED', 'ACCOUNT_UNAVAILABLE']);

/** Localized message for a channel-preference write failure. */
export function useChannelError() {
  const t = useTranslations('notifications.channels.errors');
  const feedback = useTranslations('auth.feedback');
  return (code: string) =>
    code === 'NOTIFICATION_VERSION_CONFLICT'
      ? t('conflict')
      : code === 'CONSENT_REQUIRED'
        ? t('consentRequired')
        : sessionCodes.has(code)
          ? feedback(failureMessageKey(code))
          : t('saveFailed');
}
