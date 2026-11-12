'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SafeVideoPlaybackSchema, type VideoPlayback } from '@apnatown/shared';

const INSTAGRAM_SCRIPT = 'https://www.instagram.com/embed.js';
let instagramScript: Promise<void> | undefined;

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
}: {
  playback: VideoPlayback;
  active: boolean;
  nonce: string;
}) {
  const t = useTranslations('reels.embed');
  const blockquote = useRef<HTMLQuoteElement | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const parsed = SafeVideoPlaybackSchema.parse(playback);
  const permalink = parsed.render === 'instagram' ? parsed.permalink : undefined;
  const playbackKey = `${parsed.provider}:${parsed.render}:${parsed.render === 'iframe' ? parsed.embedUrl : parsed.openUrl}`;

  useEffect(() => { setUnavailable(false); }, [playbackKey]);

  useEffect(() => {
    if (!active || !permalink) return;
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
  }, [active, nonce, permalink]);

  if (parsed.render === 'fallback' || !active || unavailable)
    return (
      <a href={parsed.openUrl} target="_blank" rel="noopener noreferrer"
        referrerPolicy="strict-origin-when-cross-origin">
        {t(unavailable ? 'openUnavailable' : 'openProvider')}
      </a>
    );

  if (parsed.render === 'iframe')
    return (
      <iframe
        title={t('youtubeTitle')}
        src={parsed.embedUrl}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="encrypted-media; picture-in-picture"
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
