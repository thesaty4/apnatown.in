'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { failureCode } from '../../shared/api/result';
import { publicHref } from '../../shared/i18n/preferences';
import { useVideoShare } from './shares-queries';

export function ShareSheet({ videoId }: { videoId: string }) {
  const t = useTranslations('engagement.share');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [nativeFailed, setNativeFailed] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const share = useVideoShare();
  const error = share.mutation.isError
    ? failureCode(share.mutation.error)
    : undefined;

  useEffect(() => {
    setNativeAvailable(typeof navigator.share === 'function');
  }, []);

  function canonicalUrl() {
    return new URL(
      publicHref(`/videos/${videoId}`, locale),
      window.location.origin,
    ).toString();
  }

  function record(
    channel: 'whatsapp' | 'copy' | 'native',
    success?: () => void,
  ) {
    share.record({ targetType: 'video', targetId: videoId, channel }, () =>
      success?.(),
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(canonicalUrl());
      setCopied(true);
      setCopyFailed(false);
      record('copy', () => setCopied(true));
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    setNativeFailed(false);
    try {
      await navigator.share({ title: t('title'), url: canonicalUrl() });
      setNativeFailed(false);
      record('native');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setNativeFailed(true);
    }
  }

  const whatsappUrl = `https://wa.me/?${new URLSearchParams({
    text: canonicalUrl(),
  })}`;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t('open')}
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t('title')}
        description={t('description')}
        closeLabel={t('close')}
        busy={share.mutation.isPending}
      >
        <div className="grid gap-3">
          <a
            className={buttonClassName}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              record('whatsapp');
            }}
          >
            {t('whatsapp')}
          </a>
          <Button
            variant="outline"
            loading={share.mutation.isPending}
            disabled={share.mutation.isPending}
            onClick={() => void copyLink()}
          >
            {t('copy')}
          </Button>
          <Button
            variant="outline"
            disabled={!nativeAvailable || share.mutation.isPending}
            onClick={() => void nativeShare()}
          >
            {t('native')}
          </Button>
          {copied && (
            <p role="status" className="m-0 text-text-2">
              {t('copied')}
            </p>
          )}
          {copyFailed && (
            <p role="alert" className="m-0 text-error">
              {t('copyFailed')}
            </p>
          )}
          {nativeFailed && (
            <p role="alert" className="m-0 text-error">
              {t('failed')}
            </p>
          )}
          {error && (
            <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
              {t(error === 'COMMON_RATE_LIMITED' ? 'rateLimited' : 'failed')}
            </p>
          )}
        </div>
      </Sheet>
    </>
  );
}
