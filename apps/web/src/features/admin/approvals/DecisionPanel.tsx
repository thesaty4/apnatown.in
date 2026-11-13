'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type { AdminBusinessApprovalType } from '@apnatown/shared/admin';
import type { BusinessAdminDetail } from '@apnatown/shared/businesses';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Alert } from '../parts';
import { ACTION_VARIANT } from './decision-actions';
import { DecisionDialog } from './DecisionDialog';
import {
  actionKey,
  isApprovalConflict,
  isApprovalDenied,
  statusKey,
  useApprovalError,
} from './parts';
import {
  useDecisionFlow,
  type Decision,
  type DecisionFlow,
} from './use-decision-flow';

/**
 * Prototype "Decision" card plus a mobile sticky action bar. Only actions the
 * API grants for this status are rendered; without approvals:edit (or on the
 * reviewer's own application) they stay visible but disabled, with the reason
 * linked through aria-describedby. The API re-checks everything.
 */
export function DecisionPanel({
  type,
  application,
  decision,
  writeCode,
  reload,
}: {
  type: AdminBusinessApprovalType;
  application: BusinessAdminDetail;
  decision: Decision;
  writeCode: string | undefined;
  reload: () => void;
}) {
  const t = useTranslations('admin.approvals');
  const tStatus = useTranslations('admin.approvals.status');
  const message = useApprovalError();
  const noteId = useId();
  const flow = useDecisionFlow({ type, application, decision, reload });
  const { intent, blocked, actions } = flow;

  const conflict = writeCode !== undefined && isApprovalConflict(writeCode);
  const failure = writeCode && !isApprovalDenied(writeCode) && (
    <Alert
      message={message(writeCode)}
      action={
        conflict && (
          <Button variant="outline" onClick={flow.reloadItem}>
            {t('reloadItem')}
          </Button>
        )
      }
    />
  );

  return (
    <>
      <Card padded className="grid min-w-0 gap-3">
        <h2 className="m-0 text-h3">{t('decision.title')}</h2>
        {actions.length === 0 ? (
          <p className="m-0 text-small text-text-2">
            {t('decision.none', {
              status: tStatus(statusKey[application.status]),
            })}
          </p>
        ) : (
          <>
            <p className="m-0 text-small text-text-2">{t('decision.hint')}</p>
            <div className="hidden gap-2 desktop:grid desktop:grid-cols-2">
              <DecisionButtons flow={flow} noteId={noteId} placement="card" />
            </div>
          </>
        )}
        {blocked && actions.length > 0 && (
          <p
            id={noteId}
            className="m-0 rounded-md bg-surface-2 px-3 py-2 text-small text-text-2"
          >
            <span aria-hidden="true">🔒 </span>
            {blocked}
          </p>
        )}
        {!intent && failure}
      </Card>

      {actions.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap gap-2 border-t border-border bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-3 desktop:hidden">
          <DecisionButtons flow={flow} noteId={noteId} placement="bar" />
        </div>
      )}

      <DecisionDialog flow={flow} conflict={conflict} failure={failure} />
    </>
  );
}

/** The granted actions, as a 2-column grid in the desktop card (first action
 * full width) or as equal flexible cells in the mobile bar. */
function DecisionButtons({
  flow,
  noteId,
  placement,
}: {
  flow: DecisionFlow;
  noteId: string;
  placement: 'card' | 'bar';
}) {
  const t = useTranslations('admin.approvals');
  const { actions, blocked } = flow;
  return actions.map((action) => {
    const button = (
      <Button
        key={action}
        variant={ACTION_VARIANT[action]}
        disabled={Boolean(blocked) || flow.pending}
        aria-describedby={blocked ? noteId : undefined}
        className={
          placement === 'card' && actions.length > 1 && action === actions[0]
            ? 'col-span-full'
            : 'min-w-0'
        }
        onClick={() => flow.open(action)}
      >
        {t(`actions.${actionKey[action]}.label`)}
      </Button>
    );
    return placement === 'bar' ? (
      <div key={action} className="grid min-w-0 flex-1 basis-28">
        {button}
      </div>
    ) : (
      button
    );
  });
}
