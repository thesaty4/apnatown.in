'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { reelPillClassName } from './reel-styles';

export type ReelPill = {
  key: string;
  label: string;
  selected: boolean;
  /** Translated reason when the filter is not available yet. */
  unavailable?: string | undefined;
  onSelect: () => void;
};

/** Prototype `.rpills`: one roving-focus tab row for feed filters. */
export function ReelPills({
  pills,
  controls,
}: {
  pills: ReelPill[];
  controls: string;
}) {
  const t = useTranslations('reels.feed');
  const noticeId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [notice, setNotice] = useState<string>();
  const selectedIndex = Math.max(
    0,
    pills.findIndex((pill) => pill.selected),
  );

  useEffect(() => {
    refs.current[selectedIndex]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }, [selectedIndex, pills.length]);

  function focusPill(index: number) {
    const next = (index + pills.length) % pills.length;
    refs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight') focusPill(index + 1);
    else if (event.key === 'ArrowLeft') focusPill(index - 1);
    else if (event.key === 'Home') focusPill(0);
    else if (event.key === 'End') focusPill(pills.length - 1);
    else return;
    event.preventDefault();
  }

  return (
    <div className="grid min-w-0 flex-1 gap-1">
      <div
        role="tablist"
        aria-label={t('pillsLabel')}
        className="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pills.map((pill, index) => (
          <button
            key={pill.key}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={pill.selected}
            aria-controls={controls}
            aria-disabled={pill.unavailable ? true : undefined}
            aria-describedby={
              pill.unavailable && notice === pill.unavailable
                ? noticeId
                : undefined
            }
            title={pill.unavailable}
            tabIndex={index === selectedIndex ? 0 : -1}
            className={reelPillClassName(pill.selected)}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => {
              if (pill.unavailable) {
                setNotice(pill.unavailable);
                return;
              }
              setNotice(undefined);
              if (!pill.selected) pill.onSelect();
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>
      <p
        id={noticeId}
        role="status"
        className={
          notice
            ? 'm-0 text-small text-reel-text-2 [overflow-wrap:anywhere]'
            : 'sr-only'
        }
      >
        {notice}
      </p>
    </div>
  );
}
