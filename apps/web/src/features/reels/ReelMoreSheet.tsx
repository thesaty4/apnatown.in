'use client';

import { useTranslations } from 'next-intl';
import { SafeVideoPlaybackSchema, type VideoFeedItem } from '@apnatown/shared';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { NavIcon } from '../../shared/ui/NavIcon';
import type { ReelGate } from './ReelGateSheet';
import { useReelSave } from './use-reel-save';

function SaveAction({
  item,
  onGate,
}: {
  item: VideoFeedItem;
  onGate: (gate: ReelGate) => void;
}) {
  const t = useTranslations('engagement.heart');
  const save = useReelSave(item, onGate);
  if (save.hidden) return null;
  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start"
        aria-pressed={save.saved}
        loading={save.busy}
        onClick={save.toggle}
      >
        <NavIcon name="bookmark" filled={save.saved} className="size-4.5" />
        {t(save.saved ? 'saved' : 'save')}
      </Button>
      {save.errorKey && (
        <p role="alert" className="m-0 text-small text-error">
          {t(save.errorKey)}
        </p>
      )}
    </>
  );
}

/** Prototype `vmore` sheet: save, report and open on the original platform. */
export function ReelMoreSheet({
  item,
  open,
  onOpenChange,
  onReport,
  onGate,
}: {
  item: VideoFeedItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: () => void;
  onGate: (gate: ReelGate) => void;
}) {
  const t = useTranslations('reels.feed');
  const report = useTranslations('reels.viewer.report');
  const embed = useTranslations('reels.embed');
  const playback = item
    ? SafeVideoPlaybackSchema.safeParse(item.playback)
    : undefined;

  return (
    <Sheet
      open={open && item !== null}
      onOpenChange={onOpenChange}
      title={t('moreOptions')}
      closeLabel={t('close')}
    >
      {item && (
        <div className="grid gap-2">
          <SaveAction
            key={item.id}
            item={item}
            onGate={(gate) => {
              onOpenChange(false);
              onGate(gate);
            }}
          />
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={onReport}
          >
            <NavIcon name="flag" className="size-4.5" />
            {report('open')}
          </Button>
          {playback?.success && (
            <a
              className={`${buttonVariantClassName('ghost')} w-full justify-start`}
              href={playback.data.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="strict-origin-when-cross-origin"
            >
              <NavIcon name="play" className="size-4.5" />
              {embed('openProvider')}
            </a>
          )}
        </div>
      )}
    </Sheet>
  );
}
