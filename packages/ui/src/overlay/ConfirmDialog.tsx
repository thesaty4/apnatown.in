'use client';

import { Button } from '../primitives/Button.js';
import { DialogFrame, type DialogFrameProps } from './DialogFrame.js';

export type ConfirmDialogProps = Omit<
  DialogFrameProps,
  'role' | 'description' | 'closeLabel' | 'footer'
> & {
  impact: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: 'primary' | 'danger';
};

export function ConfirmDialog({
  impact,
  cancelLabel,
  confirmLabel,
  onConfirm,
  tone = 'primary',
  busy = false,
  onOpenChange,
  ...props
}: ConfirmDialogProps) {
  return (
    <DialogFrame
      {...props}
      role="alertdialog"
      description={impact}
      busy={busy}
      onOpenChange={onOpenChange}
      footer={
        <div className="flex items-center gap-row-gap">
          <Button
            autoFocus
            variant="ghost"
            className="min-w-0 flex-1"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            className="min-w-0 flex-1"
            loading={busy}
            onClick={() => onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    />
  );
}
