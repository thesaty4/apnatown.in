'use client';

import { useTranslations } from 'next-intl';
import type { AdminApprovalType } from '@apnatown/shared/admin';
import { buttonInteractionClassName } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import {
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
  type ApprovalStatus,
} from './filters';
import { statusKey } from './parts';

/** ARIA tabs: arrows move and activate, Home/End jump; only the active tab is
 * in the tab order. Activation is a URL change, so Back restores the tab. */
export function ApprovalTypeTabs({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: AdminApprovalType;
  onChange: (type: AdminApprovalType) => void;
  /** Localized tablist name for reuse outside the approvals queue. */
  label?: string;
}) {
  const t = useTranslations('admin.approvals');
  return (
    <div
      role="tablist"
      aria-label={label ?? t('tabsLabel')}
      className="flex gap-1 overflow-x-auto border-b-2 border-border"
    >
      {APPROVAL_TYPES.map((type, index) => (
        <button
          type="button"
          key={type}
          id={`${id}-tab-${type}`}
          role="tab"
          aria-selected={value === type}
          aria-controls={`${id}-panel`}
          tabIndex={value === type ? 0 : -1}
          className={`-mb-0.5 inline-flex min-h-explore-tab shrink-0 items-center gap-1.5 border-b-3 px-field-inline font-semibold ${buttonInteractionClassName} ${value === type ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
          onClick={() => onChange(type)}
          onKeyDown={(event) => {
            const last = APPROVAL_TYPES.length - 1;
            const target =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? last
                  : event.key === 'ArrowRight'
                    ? index === last
                      ? 0
                      : index + 1
                    : event.key === 'ArrowLeft'
                      ? index === 0
                        ? last
                        : index - 1
                      : null;
            if (target === null) return;
            event.preventDefault();
            const next = APPROVAL_TYPES[target]!;
            document.getElementById(`${id}-tab-${next}`)?.focus();
            onChange(next);
          }}
        >
          {t(`types.${type}`)}
        </button>
      ))}
    </div>
  );
}

/** Status filter chips (`aria-pressed`); the API has no "All" status. */
export function ApprovalStatusFilter({
  value,
  onChange,
}: {
  value: ApprovalStatus;
  onChange: (status: ApprovalStatus) => void;
}) {
  const t = useTranslations('admin.approvals');
  return (
    <div
      role="group"
      aria-label={t('statusFilterLabel')}
      className="flex gap-2 overflow-x-auto pb-1 tablet:flex-wrap"
    >
      {APPROVAL_STATUSES.map((status) => (
        <Chip
          key={status}
          className="shrink-0"
          label={t(`status.${statusKey[status]}`)}
          selected={status === value}
          onClick={() => onChange(status)}
        />
      ))}
    </div>
  );
}
