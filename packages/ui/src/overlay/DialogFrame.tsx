'use client';

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Button } from '../primitives/Button.js';

export interface DialogFrameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel?: string;
  children?: ReactNode;
  footer?: ReactNode;
  stickyFooter?: boolean;
  wide?: boolean;
  busy?: boolean;
  role?: 'dialog' | 'alertdialog';
}

function backdrop(event: MouseEvent<HTMLDialogElement>): boolean {
  if (event.target !== event.currentTarget) return false;
  const box = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX >= box.right ||
    event.clientY < box.top ||
    event.clientY >= box.bottom
  );
}

export function DialogFrame({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  footer,
  stickyFooter = false,
  wide = false,
  busy = false,
  role = 'dialog',
}: DialogFrameProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      data-apnatown-overlay=""
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={busy || undefined}
      className={`fixed inset-x-0 top-auto bottom-0 m-0 h-fit max-h-sheet-max w-full max-w-none overflow-y-auto overscroll-contain rounded-t-lg border-0 bg-surface px-4 pt-2 pb-sheet-bottom text-text shadow-3 animate-sheet-up backdrop:bg-overlay backdrop:animate-overlay-fade sheet:inset-0 sheet:m-auto sheet:rounded-lg sheet:animate-sheet-pop motion-reduce:animate-none motion-reduce:backdrop:animate-none ${wide ? 'sheet:w-sheet-wide' : 'sheet:w-sheet'}`}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) onOpenChange(false);
      }}
      onClose={(event) => {
        if (
          event.target === event.currentTarget &&
          !event.currentTarget.open &&
          open
        )
          onOpenChange(false);
      }}
      onPointerDown={(event) => {
        backdropPress.current = backdrop(event);
      }}
      onClick={(event) => {
        const dismiss = backdropPress.current && backdrop(event);
        backdropPress.current = false;
        if (dismiss && !busy) onOpenChange(false);
      }}
    >
      <div
        aria-hidden="true"
        className="mx-auto mt-1 mb-3 h-sheet-grab-height w-sheet-grab-width rounded-sheet-grab bg-border-strong sheet:hidden"
      />
      <div className="grid gap-stack-gap">
        <header className="flex items-center justify-between gap-row-gap">
          <h3 id={titleId} className="min-w-0 font-display text-h3 break-words">
            {title}
          </h3>
          {closeLabel && (
            <Button
              variant="ghost"
              className="size-touch shrink-0 p-0"
              aria-label={closeLabel}
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </Button>
          )}
        </header>
        {description && (
          <p id={descriptionId} className="text-text-2 break-words">
            {description}
          </p>
        )}
        {children}
        {footer && <footer className={stickyFooter ? 'sticky bottom-0 z-10 bg-surface' : undefined}>{footer}</footer>}
      </div>
    </dialog>
  );
}
