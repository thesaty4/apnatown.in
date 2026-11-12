'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SafeVideoPlaybackSchema, type VideoPlayback } from '@apnatown/shared';
import { Button } from '@apnatown/ui/primitives/Button';

const INSTAGRAM_SCRIPT = 'https://www.instagram.com/embed.js';
let instagramScript: Promise<void> | undefined;

type NetworkInformation = EventTarget & {
  saveData?: boolean;
  effectiveType?: string;
};

function getRequestedPlaybackUrl(embedUrl: string) {
  const url = new URL(embedUrl);
  url.searchParams.set('autoplay', '1');
  url.searchParams.set('mute', '0');
  url.searchParams.set('playsinline', '1');
  return url.toString();
}

function loadInstagramScript(nonce: string) {
  if (!instagramScript) {
    instagramScript = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${INSTAGRAM_SCRIPT}"]`,
      );
      if (existing?.dataset.loaded === 'true') return resolve();
      const script = existing ?? document.createElement('script');
      script.async = true;
      script.src = INSTAGRAM_SCRIPT;
      script.nonce = nonce;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => {
        instagramScript = undefined;
        reject(new Error('INSTAGRAM_EMBED_UNAVAILABLE'));
      };
      if (!existing) document.head.append(script);
    });
  }
  return instagramScript;
}

/** Render only server-validated playback DTOs; raw submitted URLs are never accepted. */
export function EmbedCard({
  playback,
  active,
  nonce,
  showTapToPlayWhenRestricted = false,
}: {
  playback: VideoPlayback;
  active: boolean;
  nonce: string;
  showTapToPlayWhenRestricted?: boolean;
}) {
  const t = useTranslations('reels.embed');
  const blockquote = useRef<HTMLQuoteElement | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);
  const [preferences, setPreferences] = useState({
    ready: false,
    dataSaver: false,
    slowConnection: false,
    reducedMotion: false,
  });
  const parsed = SafeVideoPlaybackSchema.parse(playback);
  const permalink = parsed.render === 'instagram' ? parsed.permalink : undefined;
  const playbackKey = `${parsed.provider}:${parsed.render}:${parsed.render === 'iframe' ? parsed.embedUrl : parsed.openUrl}`;
  const tapRequired = showTapToPlayWhenRestricted && (
    !preferences.ready ||
    preferences.dataSaver ||
    preferences.slowConnection ||
    preferences.reducedMotion
  );

  useEffect(() => {
    setUnavailable(false);
    setPlayRequested(false);
  }, [playbackKey]);

  useEffect(() => {
    if (!active) setPlayRequested(false);
  }, [active]);

  useEffect(() => {
    if (!showTapToPlayWhenRestricted || !active) return;
    const connection = (navigator as Navigator & {
      connection?: NetworkInformation;
    }).connection;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreferences = () => {
      const dataSaver = Boolean(connection?.saveData);
      const slowConnection = ['2g', 'slow-2g'].includes(connection?.effectiveType ?? '');
      const reducedMotion = motion.matches;
      setPreferences({ ready: true, dataSaver, slowConnection, reducedMotion });
      if (dataSaver || slowConnection || reducedMotion) setPlayRequested(false);
    };

    updatePreferences();
    connection?.addEventListener('change', updatePreferences);
    motion.addEventListener('change', updatePreferences);
    return () => {
      connection?.removeEventListener('change', updatePreferences);
      motion.removeEventListener('change', updatePreferences);
    };
  }, [active, showTapToPlayWhenRestricted]);

  useEffect(() => {
    if (!active || !permalink || (tapRequired && !playRequested)) return;
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let observer: MutationObserver | undefined;
    void loadInstagramScript(nonce).then(() => {
      if (!mounted || !blockquote.current) return;
      const element = blockquote.current;
      const instagram = (window as Window & {
        instgrm?: { Embeds?: { process: () => void } };
      }).instgrm;
      instagram?.Embeds?.process();
      if (element.querySelector('iframe')) return;
      observer = new MutationObserver(() => {
        if (element.querySelector('iframe')) {
          clearTimeout(timeout);
          observer?.disconnect();
        }
      });
      observer.observe(element, { childList: true, subtree: true });
      timeout = setTimeout(() => setUnavailable(true), 8_000);
    }).catch(() => {
      if (mounted) setUnavailable(true);
    });
    return () => {
      mounted = false;
      clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [active, nonce, permalink, playRequested, tapRequired]);

  if (parsed.render === 'fallback' || !active || unavailable)
    return (
      <a href={parsed.openUrl} target="_blank" rel="noopener noreferrer"
        referrerPolicy="strict-origin-when-cross-origin">
        {t(unavailable ? 'openUnavailable' : 'openProvider')}
      </a>
    );

  if (tapRequired && !playRequested)
    return (
      <div className="grid justify-items-center gap-3 text-center">
        <Button onClick={() => setPlayRequested(true)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
          {t('tapToPlay')}
        </Button>
        {preferences.dataSaver && (
          <p className="m-0 rounded-md bg-surface px-3 py-1 text-small text-text">
            {t('dataSaverOn')}
          </p>
        )}
      </div>
    );

  if (parsed.render === 'iframe')
    return (
      <iframe
        title={t('youtubeTitle')}
        src={playRequested ? getRequestedPlaybackUrl(parsed.embedUrl) : parsed.embedUrl}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow={playRequested
          ? 'autoplay; encrypted-media; picture-in-picture'
          : 'encrypted-media; picture-in-picture'}
        allowFullScreen
        onError={() => setUnavailable(true)}
        className="aspect-video w-full"
      />
    );

  return (
    <blockquote
      ref={blockquote}
      className="instagram-media w-full"
      data-instgrm-permalink={parsed.permalink}
      data-instgrm-version="14"
    >
      <a href={parsed.openUrl} target="_blank" rel="noopener noreferrer"
        referrerPolicy="strict-origin-when-cross-origin">
        {t('openProvider')}
      </a>
    </blockquote>
  );
}
