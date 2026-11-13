'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';

/**
 * Dirty-form leave guard: the browser prompt on reload/close, and a confirm
 * dialog for in-app links (dashboard nav, Back link) clicked while dirty.
 * Returns `leave(href)` for programmatic exits and the dialog to render.
 */
export function useLeaveGuard(dirty: boolean) {
  const t = useTranslations('products.editor');
  const router = useRouter();
  const [target, setTarget] = useState<string>();

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank')
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;
      event.preventDefault();
      event.stopPropagation();
      setTarget(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', click, true);
    };
  }, [dirty]);

  const leave = useCallback(
    (href: string) => (dirty ? setTarget(href) : router.push(href)),
    [dirty, router],
  );

  const dialog = (
    <ConfirmDialog
      open={target !== undefined}
      onOpenChange={(open) => !open && setTarget(undefined)}
      title={t('leaveTitle')}
      impact={t('leaveImpact')}
      cancelLabel={t('leaveStay')}
      confirmLabel={t('leaveDiscard')}
      tone="danger"
      onConfirm={() => {
        const href = target;
        setTarget(undefined);
        if (href) router.push(href);
      }}
    />
  );
  return { leave, dialog };
}
