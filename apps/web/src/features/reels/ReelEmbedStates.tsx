'use client';

import { useTranslations } from 'next-intl';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { NavIcon } from '../../shared/ui/NavIcon';

const providerLink = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'strict-origin-when-cross-origin',
} as const;

/** Prototype `.rpp`: idle play glyph while a reel is off-screen. */
export function ReelPoster() {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      aria-hidden="true"
    >
      <span className="grid size-18 place-items-center rounded-pill bg-reel-canvas/55 text-reel-text">
        <NavIcon name="play" filled className="size-7.5" />
      </span>
    </div>
  );
}

/** Prototype `.rsave`: data saver / slow network / reduced motion gate. */
export function ReelTapToPlay({
  dataSaver,
  onPlay,
}: {
  dataSaver: boolean;
  onPlay: () => void;
}) {
  const t = useTranslations('reels.embed');
  return (
    <div className="absolute inset-0 z-1 grid place-items-center bg-reel-canvas/55">
      <Button variant="inverse" onClick={onPlay}>
        <NavIcon name="play" filled className="size-4.5" />
        {t('tapToPlay')}
      </Button>
      {dataSaver && (
        <p className="absolute bottom-reel-rail-bottom m-0 text-caption text-reel-text-2">
          {t('dataSaverOn')}
        </p>
      )}
    </div>
  );
}

/** Provider does not allow embedding: open the validated provider URL. */
export function ReelOpenOnProvider({ openUrl }: { openUrl: string }) {
  const t = useTranslations('reels.embed');
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <a
        className={`${buttonVariantClassName('inverse')} max-w-reel-state-copy`}
        href={openUrl}
        {...providerLink}
      >
        <NavIcon name="play" filled className="size-4.5" />
        {t('openProvider')}
      </a>
    </div>
  );
}

/** Prototype `.rstate` failure: retry plus open on the original platform. */
export function ReelEmbedFailure({
  openUrl,
  onRetry,
}: {
  openUrl: string;
  onRetry: () => void;
}) {
  const t = useTranslations('reels.embed');
  return (
    <div
      role="alert"
      className="absolute inset-0 z-4 grid content-center justify-items-center gap-2.5 bg-reel-canvas/72 p-6 text-center"
    >
      <span aria-hidden="true" className="text-art">
        ⚠️
      </span>
      <p className="m-0 max-w-reel-state-copy font-bold">{t('failedTitle')}</p>
      <Button variant="inverse" onClick={onRetry}>
        <NavIcon name="refresh" className="size-4" />
        {t('retry')}
      </Button>
      <a
        className="text-small text-reel-text underline underline-offset-2"
        href={openUrl}
        {...providerLink}
      >
        {t('openProvider')}
      </a>
    </div>
  );
}
