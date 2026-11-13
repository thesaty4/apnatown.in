import type { ReactNode } from 'react';

export type ToastTone = 'success' | 'info' | 'error';

export type ToastMessage = {
  /** Changes for every new message so repeated text is re-announced. */
  id: number;
  message: string;
  tone?: ToastTone;
  action?: ReactNode;
};

export type ToastRegionProps = {
  toast: ToastMessage | undefined;
  dismissLabel: string;
  onDismiss: () => void;
};

const icons: Record<ToastTone, string> = {
  success: '✓',
  info: 'ℹ',
  error: '!',
};

/** Presentational toast. The live region is always mounted so assistive tech
 * announces each new message; timing/auto-dismiss is owned by the caller. */
export function ToastRegion({
  toast,
  dismissLabel,
  onDismiss,
}: ToastRegionProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-70 flex justify-center desktop:bottom-6"
    >
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-text px-4 py-2 text-surface shadow-3"
        >
          <span aria-hidden="true" className="font-bold">
            {icons[toast.tone ?? 'success']}
          </span>
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            {toast.message}
          </span>
          {toast.action}
          <button
            type="button"
            className="min-h-touch min-w-touch shrink-0 rounded-sm font-semibold focus-visible:ring-focus"
            onClick={onDismiss}
          >
            {dismissLabel}
          </button>
        </div>
      )}
    </div>
  );
}
