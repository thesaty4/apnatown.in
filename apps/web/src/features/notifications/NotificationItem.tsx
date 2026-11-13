'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { NotificationItem as Item } from '@apnatown/shared/notifications';
import { NavIcon } from '../../shared/ui/NavIcon';
import { categoryIcon, safeNotificationLink } from './links';

/** Client clock for relative times; `undefined` during SSR/hydration so the
 * first client render matches the server (absolute IST date). */
export function useNow() {
  const [now, setNow] = useState<number>();
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** Prototype `ago()`: Just now / N min ago / N hr ago / IST date. */
function useAgo() {
  const t = useTranslations('notifications.time');
  const format = useFormatter();
  return (iso: string, now: number | undefined) => {
    const at = Date.parse(iso);
    const minutes =
      now === undefined ? Infinity : Math.floor((now - at) / 60_000);
    if (minutes < 1) return t('justNow');
    if (minutes < 60) return t('minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('hoursAgo', { count: hours });
    return format.dateTime(new Date(at), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  };
}

/**
 * One feed card (prototype `.card.notif`). Unread is conveyed by the primary
 * border AND the "New" badge AND screen-reader text, never colour alone.
 * Title/body are server plain text rendered as React text, never HTML.
 */
export function NotificationItem({
  item,
  now,
  onOpen,
}: {
  item: Item;
  now: number | undefined;
  /** Marks the item read (optimistic); navigation is the link's default. */
  onOpen: (item: Item) => void;
}) {
  const t = useTranslations('notifications.feed');
  const ago = useAgo();
  const href = safeNotificationLink(item.link);
  const content = (
    <>
      <span
        aria-hidden="true"
        className="art-fill grid size-10 shrink-0 place-items-center rounded-md text-art"
      >
        <NavIcon name={categoryIcon[item.category]} className="size-5" />
      </span>
      <span className="grid min-w-0 flex-1 gap-1 text-start">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {item.title && (
            <span className="min-w-0 font-bold [overflow-wrap:anywhere]">
              {item.title}
            </span>
          )}
          {!item.read && (
            <span className="rounded-pill bg-primary px-2 text-caption font-semibold text-on-primary">
              {t('new')}
            </span>
          )}
        </span>
        <span className="text-small text-text-2 [overflow-wrap:anywhere]">
          {item.body}
        </span>
        <time
          dateTime={item.createdAt}
          className="text-caption text-muted"
          suppressHydrationWarning
        >
          {ago(item.createdAt, now)}
        </time>
        <span className="sr-only">{item.read ? t('read') : t('unread')}</span>
      </span>
    </>
  );
  const frame = `flex min-h-touch w-full min-w-0 items-start gap-3 rounded-md border bg-surface p-3 text-text no-underline ${item.read ? 'border-border' : 'border-primary'}`;
  const interactive = `${frame} hover:bg-surface-2 focus-visible:ring-focus`;
  if (href)
    return (
      <Link className={interactive} href={href} onClick={() => onOpen(item)}>
        {content}
      </Link>
    );
  if (!item.read)
    return (
      <button
        type="button"
        className={`${interactive} cursor-pointer`}
        onClick={() => onOpen(item)}
      >
        {content}
        <span className="sr-only">{t('markRead')}</span>
      </button>
    );
  return <div className={frame}>{content}</div>;
}
