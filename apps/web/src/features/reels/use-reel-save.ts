'use client';

import { useTranslations } from 'next-intl';
import type { VideoFeedItem } from '@apnatown/shared';
import { useVideoSaveAction } from '../engagement';
import type { ReelGate } from './ReelGateSheet';

/**
 * One reel Save behavior for the rail icon and the overflow sheet: guests get
 * the login gate, owner-only accounts the restricted gate, and a failed
 * relationship read retries instead of silently toggling.
 */
export function useReelSave(
  item: VideoFeedItem,
  onGate: (gate: ReelGate) => void,
) {
  const t = useTranslations('engagement.heart');
  const save = useVideoSaveAction(item.id, item.businessId);
  const hidden =
    save.access === 'customer' && save.query.isSuccess && !save.available;
  const loading =
    save.access === 'pending' ||
    (save.access === 'customer' && save.query.isPending);
  return {
    hidden,
    saved: save.saved,
    busy: loading || save.busy,
    errorKey: save.errorKey,
    toggle() {
      if (save.access === 'guest' || save.access === 'unavailable')
        onGate({ kind: 'login', message: t('loginPrompt') });
      else if (save.access === 'forbidden')
        onGate({
          kind: 'restricted',
          title: t('restrictedTitle'),
          message: t('restrictedMessage'),
        });
      else if (save.query.isError) void save.query.refetch();
      else save.toggle();
    },
  };
}
