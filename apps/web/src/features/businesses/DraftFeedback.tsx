'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { Alert, errorKey } from './parts';
import type { ProfileDraft } from './use-profile-draft';

/** Save outcome for a profile draft: conflict recovery and request errors. */
export function DraftAlerts({ draft }: { draft: ProfileDraft }) {
  const t = useTranslations('business.profile');
  const te = useTranslations('business.errors');
  if (draft.conflict)
    return (
      <Alert
        tone="warn"
        role="alert"
        title={te('versionConflict')}
        action={
          <>
            <Button
              size="small"
              disabled={draft.reloading}
              onClick={() => void draft.reloadKeep()}
            >
              {t('reloadKeep')}
            </Button>
            <Button
              size="small"
              variant="outline"
              disabled={draft.reloading}
              onClick={() => void draft.discard()}
            >
              {t('discard')}
            </Button>
          </>
        }
      >
        <p className="m-0">{t('versionConflict')}</p>
      </Alert>
    );
  if (draft.status === 'invalid')
    return (
      <Alert tone="bad" role="alert">
        <p className="m-0">{t('fixErrors')}</p>
      </Alert>
    );
  if (draft.code)
    return (
      <Alert tone="bad" role="alert">
        <p className="m-0">{te(errorKey(draft.code))}</p>
      </Alert>
    );
  return null;
}

/** Polite live region announcing save progress. */
export function DraftStatusText({
  draft,
  savedKey = 'profile.saved',
}: {
  draft: ProfileDraft;
  savedKey?: 'profile.saved' | 'onboarding.draftSaved';
}) {
  const t = useTranslations('business');
  const text = draft.saving
    ? t('profile.saving')
    : draft.status === 'saved'
      ? t(savedKey)
      : draft.status === 'noChanges'
        ? t('profile.noChanges')
        : draft.dirty
          ? t('profile.unsaved')
          : '';
  return (
    <p
      role="status"
      aria-live="polite"
      className="m-0 min-h-5 text-small text-text-2"
    >
      {text && (
        <>
          {draft.status === 'saved' && !draft.saving && (
            <span aria-hidden="true">✓ </span>
          )}
          {text}
        </>
      )}
    </p>
  );
}
