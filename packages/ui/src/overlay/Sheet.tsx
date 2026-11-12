'use client';

import { DialogFrame, type DialogFrameProps } from './DialogFrame.js';

export type SheetProps = Omit<DialogFrameProps, 'role' | 'closeLabel'> & {
  closeLabel: string;
};

export function Sheet(props: SheetProps) {
  return <DialogFrame {...props} />;
}

export { Sheet as Modal };
export type ModalProps = SheetProps;
