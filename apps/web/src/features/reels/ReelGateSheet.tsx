'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Button,
  buttonVariantClassName,
} from '@apnatown/ui/primitives/Button';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { useLoginHref } from '../../shared/auth/AccessState';

export type ReelGate =
  | { kind: 'login'; message: string }
  | { kind: 'restricted'; title: string; message: string };

/** Prototype `needLogin()` sheet: guests log in and return to this video. */
export function ReelGateSheet({
  gate,
  onClose,
}: {
  gate: ReelGate | null;
  onClose: () => void;
}) {
  const t = useTranslations('reels.feed');
  const auth = useTranslations('auth.feedback');
  const loginHref = useLoginHref();
  // Keep the last gate's copy while the sheet animates closed.
  const [shown, setShown] = useState(gate);
  if (gate && gate !== shown) setShown(gate);

  return (
    <Sheet
      open={gate !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={shown?.kind === 'restricted' ? shown.title : t('loginTitle')}
      description={shown?.message ?? ''}
      closeLabel={t('notNow')}
    >
      <div className="grid gap-2">
        {shown?.kind === 'login' && (
          <Link className={`${buttonVariantClassName()} w-full`} href={loginHref}>
            {auth('login')}
          </Link>
        )}
        <Button variant="text" className="w-full" onClick={onClose}>
          {t('notNow')}
        </Button>
      </div>
    </Sheet>
  );
}
