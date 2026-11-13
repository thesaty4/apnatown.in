'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import {
  ACTION_VARIANT,
  CONFIRM_ONLY,
  REASON_MAX,
  REASON_MIN,
  REASON_REQUIRED,
} from './decision-actions';
import { actionKey } from './parts';
import type { DecisionFlow } from './use-decision-flow';

/**
 * Approve/restore: ConfirmDialog with impact copy. Reject/request changes
 * (required reason) and suspend/deactivate (optional note): a Sheet. Both are
 * native modal dialogs, so focus returns to the triggering button on close.
 */
export function DecisionDialog({
  flow,
  conflict,
  failure,
}: {
  flow: DecisionFlow;
  conflict: boolean;
  failure: ReactNode;
}) {
  const t = useTranslations('admin.approvals');
  const { intent, pending, close, confirm } = flow;
  if (!intent) return null;

  if (CONFIRM_ONLY.has(intent))
    return (
      <ConfirmDialog
        open
        onOpenChange={(next) => !next && close()}
        title={t(`actions.${actionKey[intent]}.title`)}
        impact={t(`actions.${actionKey[intent]}.impact`)}
        cancelLabel={t('cancel')}
        confirmLabel={t(`actions.${actionKey[intent]}.confirm`)}
        busy={pending}
        onConfirm={confirm}
      >
        {failure}
      </ConfirmDialog>
    );

  const required = REASON_REQUIRED.has(intent);
  return (
    <Sheet
      open
      onOpenChange={(next) => !next && close()}
      title={t(`actions.${actionKey[intent]}.title`)}
      description={t(`actions.${actionKey[intent]}.impact`)}
      closeLabel={t('cancel')}
      busy={pending}
      footer={
        <div className="flex items-center gap-row-gap">
          <Button
            variant="ghost"
            className="min-w-0 flex-1"
            disabled={pending}
            onClick={close}
          >
            {t('cancel')}
          </Button>
          <Button
            variant={
              ACTION_VARIANT[intent] === 'outline'
                ? 'primary'
                : ACTION_VARIANT[intent]
            }
            className="min-w-0 flex-1"
            loading={pending}
            disabled={conflict}
            onClick={confirm}
          >
            {t(`actions.${actionKey[intent]}.confirm`)}
          </Button>
        </div>
      }
    >
      <form
        noValidate
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          confirm();
        }}
      >
        <TextArea
          ref={flow.reasonRef}
          label={t(required ? 'reason.label' : 'reason.optionalLabel')}
          hint={t('reason.hint', { min: REASON_MIN, max: REASON_MAX })}
          error={flow.reasonError}
          required={required}
          maxLength={REASON_MAX}
          value={flow.reason}
          onChange={(event) => flow.changeReason(event.target.value)}
        />
        <p className="m-0 text-caption text-text-2" aria-live="polite">
          {t('reason.count', {
            count: flow.reason.trim().length,
            max: REASON_MAX,
          })}
        </p>
        {failure}
      </form>
    </Sheet>
  );
}
