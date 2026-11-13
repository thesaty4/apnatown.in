'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';

type Toast = { id: number; message: string };
const Context = createContext<((message: string) => void) | null>(null);
const VISIBLE_MS = 6_000;

/** Approvals-wide polite toast. Lives in the approvals layout so a message
 * survives the queue → detail → next-item navigation. The live region is
 * always mounted, so screen readers announce each new message. */
export function ApprovalsToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('admin.approvals');
  const [toast, setToast] = useState<Toast>();
  const show = useCallback(
    (message: string) =>
      setToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message,
      })),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return (
    <Context.Provider value={show}>
      {children}
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
              onClick={() => setToast(undefined)}
            >
              {t('toast.dismiss')}
            </button>
          </p>
        )}
      </div>
    </Context.Provider>
  );
}

export function useApprovalsToast() {
  const show = useContext(Context);
  if (!show) throw new Error('ApprovalsToastProvider required');
  return show;
}
