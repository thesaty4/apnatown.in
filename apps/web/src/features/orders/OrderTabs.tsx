'use client';

import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import {
  CUSTOMER_ORDER_GROUPS,
  type CustomerOrderGroup,
  type CustomerOrderPage,
} from '@apnatown/shared/orders';
import { buttonInteractionClassName } from '@apnatown/ui/primitives/Button';

export const ORDERS_PANEL_ID = 'orders-panel';
const tabId = (group: CustomerOrderGroup) => `orders-tab-${group}`;

/** Active / Completed / Cancelled tabs (URL `?group=`), roving tabindex with
 * Arrow/Home/End. Counts are the server's, shown once a page has loaded. */
export function OrderTabs({
  group,
  counts,
}: {
  group: CustomerOrderGroup;
  counts: CustomerOrderPage['counts'] | undefined;
}) {
  const t = useTranslations('orders.list');
  const format = useFormatter();
  const router = useRouter();
  const groups = CUSTOMER_ORDER_GROUPS;
  function select(next: CustomerOrderGroup) {
    if (next === group) return;
    router.push(`/orders?${new URLSearchParams({ group: next })}`, {
      scroll: false,
    });
  }
  return (
    <div
      role="tablist"
      aria-label={t('tabsLabel')}
      className="flex flex-wrap gap-2 border-b border-border"
    >
      {groups.map((item, index) => {
        const selected = item === group;
        return (
          <button
            type="button"
            key={item}
            id={tabId(item)}
            role="tab"
            aria-selected={selected}
            aria-controls={ORDERS_PANEL_ID}
            tabIndex={selected ? 0 : -1}
            className={`inline-flex min-h-touch min-w-touch items-center gap-2 rounded-sm px-3 py-2 font-semibold whitespace-normal ${buttonInteractionClassName} ${selected ? 'border-b-2 border-primary text-primary' : 'text-text-2'}`}
            onClick={() => select(item)}
            onKeyDown={(event) => {
              const last = groups.length - 1;
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? last
                    : event.key === 'ArrowRight'
                      ? (index + 1) % groups.length
                      : event.key === 'ArrowLeft'
                        ? (index + last) % groups.length
                        : null;
              if (next === null) return;
              event.preventDefault();
              const target = groups[next];
              if (!target) return;
              document.getElementById(tabId(target))?.focus();
              select(target);
            }}
          >
            {t(`tabs.${item}`)}
            {counts && (
              <span className="min-w-count rounded-pill bg-surface-2 px-2 py-count-block text-caption font-semibold text-text">
                {format.number(counts[item])}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export const orderTabId = tabId;
