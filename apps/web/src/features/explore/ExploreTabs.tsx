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
  const format = useFormatter();
  return (
    <div
      role="tablist"
      aria-label={t('tabs')}
      className="mb-stack-gap flex gap-1 overflow-x-auto border-b-2 border-border"
    >
      {EXPLORE_TABS.map((item, index) => (
        <button
          type="button"
          key={item}
          id={`explore-tab-${item}`}
          role="tab"
          aria-selected={tab === item}
          aria-controls="explore-panel"
          tabIndex={tab === item ? 0 : -1}
          className={`-mb-0.5 inline-flex min-h-explore-tab shrink-0 items-center gap-1.5 border-b-3 px-field-inline font-semibold ${buttonInteractionClassName} ${tab === item ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => onChange(item)}
          onKeyDown={(event) => {
            const targetIndex =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? EXPLORE_TABS.length - 1
                  : event.key === 'ArrowRight'
                    ? (index + 1) % EXPLORE_TABS.length
                    : event.key === 'ArrowLeft'
                      ? (index + EXPLORE_TABS.length - 1) % EXPLORE_TABS.length
                      : null;
            if (targetIndex === null) return;
            event.preventDefault();
            const target = EXPLORE_TABS[targetIndex]!;
            document.getElementById(`explore-tab-${target}`)?.focus();
            onChange(target);
          }}
        >
          {t(`tab.${item}`)}
          {counts && (
            <span
              className={`inline-grid h-5.5 min-w-5.5 place-items-center rounded-pill px-1.5 text-tab-count ${tab === item ? 'bg-primary text-on-primary' : 'bg-surface-2 text-text'}`}
            >
              {format.number(counts[item])}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
