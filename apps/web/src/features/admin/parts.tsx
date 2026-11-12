'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  ADMIN_ACTIONS,
  ADMIN_MODULES,
  type PermissionMatrix,
} from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import {
  PermissionMatrix as Matrix,
  type PermissionMatrixProps,
} from '@apnatown/ui/admin/PermissionMatrix';

const errors: Record<string, string> = {
  ADMIN_EXISTS: 'exists',
  ADMIN_VERSION_CONFLICT: 'conflict',
  ROLE_VERSION_CONFLICT: 'conflict',
  COMMON_CONFLICT: 'inProgress',
  ADMIN_SELF_ACTION: 'self',
  ADMIN_INACTIVE: 'inactive',
  ADMIN_NOT_FOUND: 'adminNotFound',
  ADMIN_SCOPE_FORBIDDEN: 'forbidden',
  COMMON_FORBIDDEN: 'forbidden',
  FORBIDDEN: 'forbidden',
  ROLE_NOT_FOUND: 'roleNotFound',
  ROLE_NAME_TAKEN: 'roleNameTaken',
  ROLE_SYSTEM_LOCKED: 'systemLocked',
  ROLE_IN_USE: 'roleInUse',
  AREA_NOT_FOUND: 'areaNotFound',
  USER_NOT_FOUND: 'accountUnavailable',
  COMMON_RATE_LIMITED: 'rateLimited',
  RATE_LIMITED: 'rateLimited',
  COMMON_UNAVAILABLE: 'unavailable',
  SESSION_EXPIRED: 'expired',
  VALIDATION_ERROR: 'validation',
  COMMON_VALIDATION_FAILED: 'validation',
};
/** `admin.errors` key for a normalized code; never server text. */
export const adminErrorKey = (code: string) => errors[code] ?? 'failed';
/** Codes where the current authority must be re-read before anything else. */
export const isDenied = (code: string) =>
  ['forbidden', 'inactive'].includes(adminErrorKey(code));

/** Compact problem message; the text states the problem, never colour alone. */
export function Alert({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="grid gap-2 rounded-md border border-error bg-error-soft p-3 text-text"
    >
      <p className="flex gap-2">
        <span aria-hidden="true">⚠️</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{message}</span>
      </p>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function AdminFailure({
  code,
  retry,
  busy = false,
}: {
  code: string;
  /** Only for reads or an unchanged command that may safely repeat. */
  retry?: (() => void) | undefined;
  busy?: boolean;
}) {
  const t = useTranslations('admin.errors');
  return (
    <Alert
      message={t(adminErrorKey(code))}
      action={
        retry && (
          <Button variant="outline" disabled={busy} onClick={retry}>
            {t('retry')}
          </Button>
        )
      }
    />
  );
}

/** Polite success/progress feedback (no toast component exists yet). */
export function Notice({ message }: { message: string | undefined }) {
  return (
    <p role="status" className="min-h-0 text-small text-text-2">
      {message && (
        <span className="inline-flex gap-2 rounded-md bg-success-soft px-3 py-2 text-text">
          <span aria-hidden="true">✓</span>
          {message}
        </span>
      )}
    </p>
  );
}

export function usePermissionLabels() {
  const t = useTranslations('admin.permissions');
  const modules = ADMIN_MODULES.map((key) => ({
    key,
    label: t(`modules.${key}`),
  }));
  const actions = ADMIN_ACTIONS.map((key) => ({
    key,
    label: t(`actions.${key}`),
  }));
  const label = (list: typeof modules | typeof actions, key: string) =>
    list.find((item) => item.key === key)?.label ?? key;
  return {
    modules,
    actions,
    module: (key: string) => label(modules, key),
    /** "View, Edit" or an em dash when the module has no actions. */
    summary: (matrix: PermissionMatrix, key: (typeof ADMIN_MODULES)[number]) =>
      matrix[key].length
        ? matrix[key].map((action) => label(actions, action)).join(', ')
        : '—',
    granted: (matrix: PermissionMatrix) =>
      ADMIN_MODULES.filter((key) => matrix[key].length > 0),
    cellLabel: (module: string, action: string) =>
      t('cell', {
        module: label(modules, module),
        action: label(actions, action),
      }),
    t,
  };
}

/** Localized wrapper around the shared matrix. Normalization stays with callers. */
export function PermissionGrid({
  value,
  onToggle,
  disabled,
}: Pick<PermissionMatrixProps, 'onToggle' | 'disabled'> & {
  value: PermissionMatrix;
}) {
  const labels = usePermissionLabels();
  return (
    <div className="grid gap-2">
      <Matrix
        caption={labels.t('matrix')}
        moduleHeading={labels.t('module')}
        modules={labels.modules}
        actions={labels.actions}
        value={value}
        cellLabel={labels.cellLabel}
        {...(onToggle && { onToggle })}
        {...(disabled !== undefined && { disabled })}
      />
      {onToggle && !disabled && (
        <p className="text-small text-muted">{labels.t('rule')}</p>
      )}
    </div>
  );
}
