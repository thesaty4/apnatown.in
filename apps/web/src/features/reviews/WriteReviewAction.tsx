'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import {
  Button,
  buttonClassName,
  buttonVariantClassName,
} from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { loginHref } from '../../shared/auth/return-to';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';

/**
 * Prototype "Write a review". BR-09: only verified buyers can review, and
 * order proof needs Orders, so the sheet explains eligibility (and asks
 * guests to log in) instead of accepting an unverifiable review.
 */
export function WriteReviewAction({
  name,
  returnPath,
}: {
  name: string;
  returnPath: string;
}) {
  const t = useTranslations('reviews.write');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { state } = useSession();
  const [open, setOpen] = useState(false);
  const guest = state.kind !== 'ready';
  return (
    <>
      <Button
        variant="outline"
        size="small"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <NavIcon name="edit" className="size-4" />
        {t('action')}
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t('title', { name })}
        closeLabel={t('close')}
      >
        <div className="grid gap-3">
          <p className="m-0 flex items-start gap-3 rounded-md border border-info bg-info-soft px-3.5 py-3 text-small">
            <span aria-hidden="true" className="shrink-0">
              🛡️
            </span>
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {t('verifiedOnly')}
            </span>
          </p>
          <p className="m-0 text-small text-text-2">
            {guest ? t('guestHint') : t('noPurchase')}
          </p>
          {guest ? (
            <Link
              href={loginHref(locale, returnPath)}
              className={buttonClassName}
            >
              {t('login')}
            </Link>
          ) : (
            <Link
              href={publicHref('/explore', locale)}
              className={buttonVariantClassName('outline')}
              onClick={() => setOpen(false)}
            >
              {t('keepShopping')}
            </Link>
          )}
        </div>
      </Sheet>
    </>
  );
}
