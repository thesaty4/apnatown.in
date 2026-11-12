'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { buttonInteractionClassName } from '@apnatown/ui/primitives/Button';
import { savedHref, type SavedView } from './saved-state';

const tabs = ['shops', 'services', 'media'] as const;
const filters = ['all', 'photos', 'videos', 'reels'] as const;

export function SavedNavigation({ view }: { view: SavedView }) {
  const t = useTranslations('engagement.saved');
  const router = useRouter();
  function select(tab: SavedView['tab']) {
    router.push(savedHref({ ...view, tab }), { scroll: false });
  }
  return (
    <div className="grid gap-3">
      <div
        role="tablist"
        aria-label={t('title')}
        className="flex flex-wrap gap-2 border-b border-border"
      >
        {tabs.map((tab, index) => (
          <button
            type="button"
            key={tab}
            id={`saved-tab-${tab}`}
            role="tab"
            aria-selected={view.tab === tab}
            aria-controls="saved-panel"
            tabIndex={view.tab === tab ? 0 : -1}
            className={`min-h-touch min-w-touch rounded-sm px-3 py-2 font-semibold whitespace-normal ${buttonInteractionClassName} ${view.tab === tab ? 'border-b-2 border-primary text-primary' : 'text-text-2'}`}
            onClick={() => select(tab)}
            onKeyDown={(event) => {
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? tabs.length - 1
                    : event.key === 'ArrowRight'
                      ? (index + 1) % tabs.length
                      : event.key === 'ArrowLeft'
                        ? (index + tabs.length - 1) % tabs.length
                        : null;
              if (next === null) return;
              event.preventDefault();
              const target = tabs[next];
              if (!target) return;
              document.getElementById(`saved-tab-${target}`)?.focus();
              select(target);
            }}
          >
            {t(tab)}
          </button>
        ))}
      </div>
      {view.tab === 'media' && (
        <div
          role="group"
          aria-label={t('filterLabel')}
          className="flex flex-wrap gap-2"
        >
          {filters.map((media) => (
            <Chip
              key={media}
              label={t(media)}
              selected={view.media === media}
              onClick={() =>
                router.push(savedHref({ ...view, media }), { scroll: false })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
