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
      className="flex flex-wrap gap-2 border-b border-border"
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
          className={`inline-flex min-h-touch min-w-touch items-center gap-2 rounded-sm px-3 py-2 font-semibold whitespace-normal ${buttonInteractionClassName} ${tab === item ? 'border-b-2 border-primary text-primary' : 'text-text-2'}`}
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
            <span className="min-w-count rounded-pill bg-surface-2 px-2 text-caption text-text">
              {format.number(counts[item])}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
