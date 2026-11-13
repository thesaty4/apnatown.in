'use client';

import { useFormatter, useTranslations } from 'next-intl';
import {
  EXPLORE_TABS,
  type ExploreResponse,
  type ExploreTab,
} from '@apnatown/shared/search';
import { buttonInteractionClassName } from '@apnatown/ui/primitives/Button';

export function ExploreTabs({
  tab,
  counts,
  onChange,
}: {
  tab: ExploreTab;
  counts: ExploreResponse['counts'] | undefined;
  onChange: (tab: ExploreTab) => void;
}) {
  const t = useTranslations('explore.screen');
  return <DiscoveryTabs tab={tab} id="explore" label={t('tabs')}
    items={EXPLORE_TABS.map((value) => ({
      value, label: t(`tab.${value}`), count: counts?.[value],
    }))} onChange={onChange} />;
}

/** Shared roving keyboard pattern; Search supplies its own five-tab model. */
export function DiscoveryTabs<T extends string>({
  tab, id, label, items, onChange, countTone = 'selected',
}: {
  tab: T;
  id: string;
  label: string;
  items: readonly { value: T; label: string; count?: number | undefined }[];
  onChange: (tab: T) => void;
  /** Search (js23 `stab`) keeps every count neutral; Explore highlights the selected one. */
  countTone?: 'selected' | 'neutral';
}) {
  const format = useFormatter();
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-stack-gap flex gap-1 overflow-x-auto border-b-2 border-border"
    >
      {items.map((item, index) => (
        <button
          type="button"
          key={item.value}
          id={`${id}-tab-${item.value}`}
          role="tab"
          aria-selected={tab === item.value}
          aria-controls={`${id}-panel`}
          tabIndex={tab === item.value ? 0 : -1}
          className={`-mb-0.5 inline-flex min-h-explore-tab shrink-0 items-center gap-1.5 border-b-3 px-field-inline font-semibold ${buttonInteractionClassName} ${tab === item.value ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => onChange(item.value)}
          onKeyDown={(event) => {
            const targetIndex =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? items.length - 1
                  : event.key === 'ArrowRight'
                    ? (index + 1) % items.length
                    : event.key === 'ArrowLeft'
                      ? (index + items.length - 1) % items.length
                      : null;
            if (targetIndex === null) return;
            event.preventDefault();
            const target = items[targetIndex]!.value;
            document.getElementById(`${id}-tab-${target}`)?.focus();
            onChange(target);
          }}
        >
          {item.label}
          {/* Separates "Products 12" in the accessible name; flex ignores it visually. */}
          {item.count !== undefined && ' '}
          {item.count !== undefined && (
            <span
              className={`inline-grid h-5.5 min-w-5.5 place-items-center rounded-pill px-1.5 text-tab-count ${tab === item.value && countTone === 'selected' ? 'bg-primary text-on-primary' : 'bg-surface-2 text-text'}`}
            >
              {format.number(item.count)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
