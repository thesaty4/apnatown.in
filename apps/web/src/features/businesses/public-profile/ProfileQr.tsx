'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useQrSvg } from '../qr';

/** Locally generated QR of the canonical profile URL (no CDN, no stored asset). */
export function ProfileQr({ url, name }: { url: string; name: string }) {
  const t = useTranslations('business.publicProfile.contact');
  const qr = useQrSvg(url);
  return (
    <figure className="m-0 grid justify-items-center gap-2">
      <div className="grid size-40 place-items-center rounded-md border border-border bg-surface p-2">
        {qr.isPending ? (
          <Skeleton label={t('qrLoading')} shape="block" />
        ) : qr.isError ? (
          <div className="grid justify-items-center gap-2 text-center text-small">
            <p role="alert" className="m-0">{t('qrError')}</p>
            <Button variant="text" size="small" onClick={() => void qr.refetch()}>
              {t('retry')}
            </Button>
          </div>
        ) : (
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.data)}`}
            alt={t('qrAlt', { name })}
            width={144}
            height={144}
            className="size-36"
          />
        )}
      </div>
      <figcaption className="text-small text-text-2">{t('qrHint')}</figcaption>
    </figure>
  );
}
