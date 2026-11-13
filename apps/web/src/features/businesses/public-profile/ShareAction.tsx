'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { NavIcon } from '../../../shared/ui/NavIcon';

const TOAST_MS = 5_000;

/**
 * Profile Share: native share sheet when available, otherwise copies the
 * canonical profile URL. Video shares stay engagement-owned (ShareSheet);
 * profile shares are not recorded. Dismissing the native sheet is not an error.
 */
export function ShareAction({
  name,
  path,
  label,
}: {
  name: string;
  path: string;
  /** Visible label override (e.g. product detail "Share product"). */
  label?: string;
}) {
  const t = useTranslations('business.publicProfile.actions');
  const [toast, setToast] = useState<{ id: number; ok: boolean }>();
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const notify = (ok: boolean) =>
    setToast((current) => ({ id: (current?.id ?? 0) + 1, ok }));

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: name,
          text: t('shareText', { name }),
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      notify(true);
    } catch {
      notify(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${buttonVariantClassName('ghost')} min-w-0`}
        aria-label={t('shareNamed', { name })}
        onClick={() => void share()}
      >
        <NavIcon name="share" className="size-4.5 shrink-0" />
        {label ?? t('share')}
      </button>
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
            <span aria-hidden="true">{toast.ok ? '✓' : '⚠'}</span>
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {toast.ok ? t('linkCopied') : t('copyFailed')}
            </span>
            <button
              type="button"
              className="min-h-touch min-w-touch shrink-0 rounded-sm font-semibold focus-visible:ring-focus"
              onClick={() => setToast(undefined)}
            >
              {t('dismiss')}
            </button>
          </p>
        )}
      </div>
    </>
  );
}
