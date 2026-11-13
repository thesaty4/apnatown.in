import type { ReactNode } from 'react';

export type NoticeTone = 'ok' | 'warn' | 'bad' | 'info';

const tones: Record<NoticeTone, { box: string; icon: string }> = {
  ok: { box: 'border-success bg-success-soft', icon: '✓' },
  warn: { box: 'border-warning bg-warning-soft', icon: '⚠️' },
  bad: { box: 'border-error bg-error-soft', icon: '⛔' },
  info: { box: 'border-info bg-info-soft', icon: 'ℹ️' },
};

/** Tinted, bordered inline note: icon + localized text, never colour-only.
 * Content wraps (long Hindi) and an optional action row follows the text. */
export function Notice({
  tone,
  title,
  children,
  action,
  role,
  id,
}: {
  tone: NoticeTone;
  title?: string | undefined;
  children?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert' | 'note' | undefined;
  id?: string | undefined;
}) {
  return (
    <div
      id={id}
      role={role}
      className={`flex min-w-0 flex-wrap items-start gap-3 rounded-md border px-3.5 py-3 text-small text-text ${tones[tone].box}`}
    >
      <span aria-hidden="true" className="shrink-0">
        {tones[tone].icon}
      </span>
      <div className="grid min-w-0 flex-1 basis-48 gap-1 [overflow-wrap:anywhere]">
        {title && <p className="m-0 font-semibold">{title}</p>}
        {children}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
