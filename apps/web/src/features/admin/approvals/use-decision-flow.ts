'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { AdminBusinessApprovalType } from '@apnatown/shared/admin';
import type {
  BusinessAdminDetail,
  BusinessDecision,
  BusinessDecisionAction,
} from '@apnatown/shared/businesses';
import { useAdmin } from '../AdminShell';
import {
  ACTION_ORDER,
  CONFIRM_ONLY,
  REASON_MIN,
  REASON_REQUIRED,
} from './decision-actions';
import { approvalDetailHref, approvalsHref } from './filters';
import { statusKey } from './parts';
import type { useApprovalDecision } from './queries';
import { useApprovalsToast } from './Toast';

export type Decision = ReturnType<typeof useApprovalDecision>;

/**
 * Decision intent state for one application: which dialog is open, the note,
 * its inline validation, and what happens after the API accepts a decision
 * (toast, then auto-open the next pending item when this one left Pending).
 */
export function useDecisionFlow({
  type,
  application,
  decision,
  reload,
}: {
  type: AdminBusinessApprovalType;
  application: BusinessAdminDetail;
  decision: Decision;
  reload: () => void;
}) {
  const { me, scope } = useAdmin();
  const t = useTranslations('admin.approvals');
  const tStatus = useTranslations('admin.approvals.status');
  const toast = useApprovalsToast();
  const router = useRouter();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [intent, setIntent] = useState<BusinessDecisionAction>();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();
  const { mutation } = decision;

  const canEdit = me.isSuper || me.permissions.approvals.includes('edit');
  const own = application.ownerUserId === scope.userId;
  const blocked = !canEdit
    ? t('decision.viewOnly')
    : own
      ? t('decision.self')
      : undefined;
  const actions = ACTION_ORDER.filter((action) =>
    application.allowedActions.includes(action),
  );

  function open(action: BusinessDecisionAction) {
    mutation.reset();
    setReason('');
    setReasonError(undefined);
    setIntent(action);
  }
  function close() {
    if (mutation.isPending) return;
    setIntent(undefined);
  }
  function reloadItem() {
    mutation.reset();
    setIntent(undefined);
    reload();
  }
  function changeReason(value: string) {
    setReason(value);
    if (reasonError) setReasonError(undefined);
  }

  function confirm() {
    if (!intent) return;
    const note = reason.trim();
    const required = REASON_REQUIRED.has(intent);
    if ((required || note) && note.length < REASON_MIN) {
      setReasonError(
        t(required ? 'reason.required' : 'reason.tooShort', {
          min: REASON_MIN,
        }),
      );
      reasonRef.current?.focus();
      return;
    }
    const body: BusinessDecision = {
      action: intent,
      expectedVersion: application.version,
      ...(note && !CONFIRM_ONLY.has(intent) ? { reason: note } : {}),
    };
    decision.submit(application.id, body, async (result) => {
      setIntent(undefined);
      const status = tStatus(statusKey[result.status]);
      if (result.previousStatus !== 'pending') {
        toast(t('toast.saved', { status }));
        return;
      }
      // The decided item left Pending: open the oldest remaining one.
      const next = await decision.nextPending(type, application.id);
      if (next) {
        toast(t('toast.savedNext', { status }));
        router.replace(approvalDetailHref(next.type, next.id));
      } else {
        toast(t('toast.savedDone', { status }));
        router.replace(approvalsHref({ type, status: 'pending' }));
      }
    });
  }

  return {
    intent,
    reason,
    reasonError,
    reasonRef,
    blocked,
    actions,
    pending: mutation.isPending,
    open,
    close,
    reloadItem,
    changeReason,
    confirm,
  };
}

export type DecisionFlow = ReturnType<typeof useDecisionFlow>;
