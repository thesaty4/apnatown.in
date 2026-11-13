'use client';

import { useFormatter, useTranslations } from 'next-intl';
import {
  BUSINESS_ORDER_TABS,
  type BusinessOrderCounts,
  type BusinessOrderTab,
} from '@apnatown/shared/orders';
import { buttonInteractionClassName } from '@apnatown/ui/primitives/Button';

export const tabKey = {
  new: 'new',
  in_progress: 'inProgress',
  ready_out: 'readyOut',
  completed: 'completed',
  cancelled: 'cancelled',
} as const satisfies Record<
  BusinessOrderTab,
  keyof Omit<BusinessOrderCounts, 'asOf'>
>;

/** Validated `?tab=`; anything else falls back to New. */
export function readTab(value: string | null): BusinessOrderTab {
  return (BUSINESS_ORDER_TABS as readonly string[]).includes(value ?? '')
    ? (value as BusinessOrderTab)
    : 'new';
}

/** ARIA tabs (arrows/Home/End move and activate; only the active tab is in
 * the tab order). Activation is a URL change, so Back restores the tab. */
export function OrderTabs({
  id,
  value,
  counts,
  onChange,
}: {
  id: string;
  value: BusinessOrderTab;
  counts: BusinessOrderCounts | undefined;
  onChange: (tab: BusinessOrderTab) => void;
}) {
  const t = useTranslations('ownerOrders.tabs');
  const format = useFormatter();
  return (
    <div
      role="tablist"
      aria-label={t('label')}
      className="flex gap-1 overflow-x-auto border-b-2 border-border"
    >
      {BUSINESS_ORDER_TABS.map((tab, index) => {
        const count = counts?.[tabKey[tab]];
        const highlight = tab === 'new' && (count ?? 0) > 0;
        return (
          <button
            type="button"
            key={tab}
            id={`${id}-tab-${tab}`}
            role="tab"
            aria-selected={value === tab}
            aria-controls={`${id}-panel`}
            tabIndex={value === tab ? 0 : -1}
            className={`-mb-0.5 inline-flex min-h-explore-tab shrink-0 items-center gap-1.5 border-b-3 px-field-inline font-semibold ${buttonInteractionClassName} ${value === tab ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
            onClick={() => onChange(tab)}
            onKeyDown={(event) => {
              const last = BUSINESS_ORDER_TABS.length - 1;
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
              const next = BUSINESS_ORDER_TABS[target]!;
              document.getElementById(`${id}-tab-${next}`)?.focus();
              onChange(next);
            }}
          >
            {t(tabKey[tab])}
            {count !== undefined && (
              <span
                className={`rounded-pill px-badge-inline text-caption-min ${highlight ? 'bg-primary text-on-primary' : 'bg-surface-2 text-text'}`}
              >
                {format.number(count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
