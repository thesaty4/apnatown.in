'use client';

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

/** Horizontal travel (px) that counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 50;

export interface FullScreenViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Localized dialog name, e.g. "Gallery". */
  title: string;
  /** Localized, already formatted position, e.g. "3 of 12". Announced politely. */
  position: string;
  /** Whether a previous/next slide exists (the caller may load more pages). */
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** Optional Home/End jumps; omitted when the caller cannot address them. */
  onFirst?: (() => void) | undefined;
  onLast?: (() => void) | undefined;
  labels: { close: string; previous: string; next: string };
  /** Current slide (image or poster) rendered by the caller. */
  media: ReactNode;
  /** Caption, linked-item chip and actions on a readable surface panel. */
  details?: ReactNode;
  /** True while the next slide is being loaded. */
  busy?: boolean;
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const control =
  'inline-flex size-touch shrink-0 items-center justify-center rounded-pill bg-reel-surface text-reel-text ' +
  'transition-opacity duration-2 ease-standard focus-visible:ring-focus disabled:cursor-not-allowed ' +
  'disabled:opacity-40 motion-reduce:transition-none';

/**
 * Prototype PD2/PF9 full-screen media viewer. A native modal dialog makes
 * the page inert (focus stays inside), Esc closes only this top-most layer,
 * focus returns to the opener, ←/→ (and Home/End) move between slides and a
 * horizontal swipe on the stage does the same. Interactive children
 * (links/buttons) never start a swipe. Renders props only; no data access.
 */
export function FullScreenViewer({
  open,
  onOpenChange,
  title,
  position,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  labels,
  media,
  details,
  busy = false,
}: FullScreenViewerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function restoreFocus() {
    const target = opener.current;
    opener.current = null;
    if (target?.isConnected) target.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
      return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]'))
      return;
    const actions: Record<string, (() => void) | undefined> = {
      ArrowLeft: hasPrevious ? onPrevious : undefined,
      ArrowRight: hasNext ? onNext : undefined,
      Home: onFirst,
      End: onLast,
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('a, button')) return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && hasNext) onNext();
    if (dx > 0 && hasPrevious) onPrevious();
  }

  return (
    <dialog
      ref={ref}
      data-apnatown-overlay=""
      aria-modal="true"
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-reel-canvas p-0 text-reel-text backdrop:bg-overlay animate-overlay-fade motion-reduce:animate-none"
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
      }}
      onClose={(event) => {
        if (event.target !== event.currentTarget) return;
        restoreFocus();
        if (open) onOpenChange(false);
      }}
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className="flex items-center justify-between gap-3 px-3 pt-[calc(var(--spacing-sat)+--spacing(2))] pb-2">
          <h2 id={titleId} className="m-0 min-w-0 text-body font-semibold [overflow-wrap:anywhere]">
            {title}
            <span className="sr-only">, </span>
            <span aria-live="polite" aria-atomic="true" className="ms-2 font-normal text-reel-text-2">
              {position}
            </span>
          </h2>
          <button
            type="button"
            className={control}
            aria-label={labels.close}
            onClick={() => onOpenChange(false)}
          >
            <Icon path="M6 6l12 12M18 6 6 18" />
          </button>
        </header>
        <div className="relative flex min-h-0 items-center justify-center px-2">
          <div
            className="flex size-full min-h-0 items-center justify-center touch-pan-y select-none"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              swipe.current = null;
            }}
          >
            {media}
          </div>
          <button
            type="button"
            className={`${control} absolute start-2 top-1/2 -translate-y-1/2`}
            aria-label={labels.previous}
            disabled={!hasPrevious}
            onClick={onPrevious}
          >
            <Icon path="M15 5l-7 7 7 7" />
          </button>
          <button
            type="button"
            className={`${control} absolute end-2 top-1/2 -translate-y-1/2`}
            aria-label={labels.next}
            disabled={!hasNext || busy}
            aria-busy={busy || undefined}
            onClick={onNext}
          >
            <Icon path="M9 5l7 7-7 7" />
          </button>
        </div>
        {details && (
          <div className="max-h-[45dvh] overflow-y-auto overscroll-contain rounded-t-lg bg-surface px-4 pt-3 pb-sheet-bottom text-text shadow-3">
            <div className="mx-auto grid w-full max-w-page gap-3">{details}</div>
          </div>
        )}
      </div>
    </dialog>
  );
}
