'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { EnquiryStatus } from '@apnatown/shared/services';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Avatar } from '@apnatown/ui/data/Avatar';

/** Prototype `EST`: tone + icon + localized text (never colour alone, BR-22). */
const statusPresentation: Record<
  EnquiryStatus,
  { tone: BadgeTone; icon: string }
> = {
  new: { tone: 'info', icon: '✦' },
  contacted: { tone: 'warn', icon: '📞' },
  converted: { tone: 'ok', icon: '✓' },
  closed: { tone: 'neutral', icon: '○' },
};

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const t = useTranslations('service.enquiries.status');
  const { tone, icon } = statusPresentation[status];
  return (
    <StatusBadge
      tone={tone}
      icon={icon}
      label={t(status)}
      className="shrink-0"
    />
  );
}

/** Prototype round initial avatar; hue derived from the first character. */
export function InitialAvatar({ name }: { name: string }) {
  const initial = [...name.trim()][0]?.toLocaleUpperCase() ?? '?';
  const hue = ((initial.codePointAt(0) ?? 0) * 9) % 360;
  return (
    <Avatar label="" emoji={initial} hue={hue} className="rounded-pill!" />
  );
}

/** IST, 12-hour date-time (`Received`, tooltips). */
export function useIstDateTime() {
  const format = useFormatter();
  return (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
}

/** A stored `YYYY-MM-DD` IST calendar date, formatted without zone shifts. */
export function usePreferredDate() {
  const format = useFormatter();
  return (date: string) =>
    format.dateTime(new Date(`${date}T00:00:00Z`), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
}

/** Prototype `ago`: just now / N min ago / N hr ago, else the IST date. */
export function useReceivedAgo() {
  const t = useTranslations('service.enquiries');
  const format = useFormatter();
  return (iso: string, now: number) => {
    const minutes = Math.round((now - Date.parse(iso)) / 60_000);
    if (minutes < 1) return t('justNow');
    if (minutes < 60) return t('minutesAgo', { count: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t('hoursAgo', { count: hours });
    return format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  };
}

const TOAST_MS = 6_000;

/** Screen-local polite toast. The live region is always mounted so each new
 * message is announced; it auto-dismisses and can be dismissed by keyboard. */
export function useToast() {
  const [toast, setToast] = useState<{ id: number; message: string }>();
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const show = useCallback(
    (message: string) =>
      setToast((current) => ({ id: (current?.id ?? 0) + 1, message })),
    [],
  );
  const dismiss = useCallback(() => setToast(undefined), []);
  return { toast, show, dismiss };
}

export function ToastRegion({
  toast,
  dismiss,
  dismissLabel,
}: {
  toast: { id: number; message: string } | undefined;
  dismiss: () => void;
  dismissLabel: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-70 flex justify-center desktop:bottom-6"
    >
      {toast && (
        <p
          key={toast.id}
          className="pointer-events-auto m-0 flex max-w-full items-center gap-3 rounded-md bg-text px-4 py-3 text-surface shadow-3"
        >
          <span aria-hidden="true">✓</span>
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {toast.message}
          </span>
          <button
            type="button"
            className="min-h-touch min-w-touch shrink-0 rounded-sm font-semibold focus-visible:ring-focus"
            onClick={dismiss}
          >
            {dismissLabel}
          </button>
        </p>
      )}
    </div>
  );
}
