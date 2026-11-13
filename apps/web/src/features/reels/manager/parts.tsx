'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { Video } from '@apnatown/shared';
import { Badge, StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { failureCode } from '../../../shared/api/result';

const statusChip: Record<Video['status'], { icon: string; tone: BadgeTone }> = {
  pending: { icon: '⏳', tone: 'ap-pending' },
  approved: { icon: '✓', tone: 'ap-approved' },
  rejected: { icon: '✕', tone: 'ap-rejected' },
  removed: { icon: '⊘', tone: 'ap-rejected' },
};

/** Moderation state as icon + localized text, never colour alone. */
export function VideoStatusChip({ status }: { status: Video['status'] }) {
  const t = useTranslations('reels.manager.status');
  const chip = statusChip[status];
  return <StatusBadge tone={chip.tone} icon={chip.icon} label={t(status)} />;
}

/** "YouTube · Shorts" / "Instagram · Reel". */
export function ProviderBadge({ video }: { video: Pick<Video, 'provider' | 'kind'> }) {
  const t = useTranslations('vendor.media.provider');
  return (
    <Badge
      tone="neutral"
      icon="▶"
      label={`${t(video.provider)} · ${t(`kind.${video.kind}`)}`}
    />
  );
}

const denied = new Set([
  'COMMON_FORBIDDEN',
  'BUSINESS_NOT_OWNED',
  'BUSINESS_NOT_FOUND',
]);

export const isDenied = (error: unknown) => denied.has(failureCode(error));

const messageKey: Record<string, string> = {
  MEDIA_VERSION_CONFLICT: 'conflict',
  VIDEO_INVALID_TRANSITION: 'transition',
  MEDIA_VIDEO_SOURCE_INVALID: 'sourceInvalid',
  MEDIA_NOT_FOUND: 'notFound',
  COMMON_RATE_LIMITED: 'rateLimited',
  USERS_APPROVAL_REQUIRED: 'approvalRequired',
  COMMON_VALIDATION_FAILED: 'validation',
  COMMON_FORBIDDEN: 'forbidden',
  BUSINESS_NOT_OWNED: 'forbidden',
};

/** Localized, code-based message; server text is never shown. */
export function useMediaError() {
  const t = useTranslations('vendor.media.errors');
  const tm = useTranslations('errors.media');
  return (error: unknown, conflictKey = 'conflict') => {
    const code = failureCode(error);
    if (code === 'MEDIA_LINK_TARGET_INVALID') return tm('linkTargetInvalid');
    if (code === 'COMMON_CONFLICT') return t(conflictKey);
    return t(messageKey[code] ?? 'failed');
  };
}

export type Segment = 'videos' | 'gallery';

/** Prototype `.seg` as an ARIA tablist with roving focus and arrow keys. */
export function SegmentTabs({
  value,
  onChange,
  label,
  tabs,
  idPrefix,
}: {
  value: Segment;
  onChange: (next: Segment) => void;
  label: string;
  tabs: { id: Segment; label: string; count?: number | undefined }[];
  idPrefix: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === value);
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    let next: number | undefined;
    if (step) next = (index + step + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    const tab = next === undefined ? undefined : tabs[next];
    if (!tab) return;
    event.preventDefault();
    onChange(tab.id);
    refs.current[tab.id]?.focus();
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex w-full max-w-full gap-1 rounded-md bg-surface-2 p-1 tablet:w-fit"
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-touch min-w-0 flex-1 items-center justify-center gap-2 rounded-sm px-4 text-small font-semibold transition-colors duration-2 ease-standard focus-visible:ring-focus motion-reduce:transition-none tablet:flex-none ${selected ? 'bg-surface text-text shadow-1' : 'text-text-2 hover:text-text'}`}
          >
            <span className="[overflow-wrap:anywhere]">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="rounded-pill bg-primary-soft px-2 text-caption-min text-primary">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  idPrefix,
  hidden,
  children,
}: {
  id: Segment;
  idPrefix: string;
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      hidden={hidden}
      className="grid min-w-0 gap-4"
    >
      {!hidden && children}
    </div>
  );
}

/** Return focus to a move control after the list re-renders in a new order. */
export function refocus(selector: string) {
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>(selector)?.focus(),
  );
}
