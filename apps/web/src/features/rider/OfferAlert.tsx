'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DialogFrame } from '@apnatown/ui/overlay/DialogFrame';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import { startOfferChime } from '../../shared/audio/alert-chime';
import {
  RequestCountdownCard,
  useOfferRemaining,
} from './components/RequestCountdownCard';
import { useOfferResponse, type OfferDecision } from './job-queries';
import { Notice, riderBase, useRiderError } from './parts';
import {
  noActiveJob,
  useActiveJob,
  useCurrentOffer,
  useRiderSummary,
} from './queries';

/** Keeps the expired state readable before the alert clears itself. */
const CLEAR_AFTER_EXPIRY_MS = 2_500;

/**
 * S-RIDE-03 in every rider screen: a new offer opens a top-layer alert and
 * repeats "tudun tudun tudun" until it is accepted, rejected or expires. The
 * dialog is native `<dialog>` (top layer, above heads-up toasts, sheets and
 * the Reels overlay) and has no close action, so the offer cannot be lost by
 * dismissing it.
 */
export function RiderOfferAlert() {
  const path = usePathname();
  const { state } = useSession();
  const enabled =
    state.kind === 'ready' &&
    state.data.roles.includes('rider') &&
    path.startsWith(riderBase);
  return enabled ? <OfferAlert /> : null;
}

function OfferAlert() {
  const t = useTranslations('rider.requests');
  const errorText = useRiderError('job');
  const router = useRouter();
  const offer = useCurrentOffer();
  const active = useActiveJob();
  const summary = useRiderSummary();
  const response = useOfferResponse();
  const [answered, setAnswered] = useState<string | null>(null);
  const [decision, setDecision] = useState<OfferDecision | null>(null);
  const current = offer.data?.offer ?? null;
  const remaining = useOfferRemaining(current);
  const offerId = current?.offerId ?? null;
  const expired = Boolean(current) && remaining === 0;
  const visible = Boolean(current) && offerId !== answered;
  const sounding = visible && !expired;

  useEffect(() => {
    if (!sounding) return;
    return startOfferChime();
  }, [sounding]);

  useEffect(() => {
    if (!expired || !offerId) return;
    const timer = window.setTimeout(
      () => setAnswered(offerId),
      CLEAR_AFTER_EXPIRY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [expired, offerId]);

  const error = response.mutation.isError ? response.mutation.error : null;
  const code = error ? failureCode(error) : null;
  const hasActive = Boolean(active.data) && !noActiveJob(active.error);
  const busy = response.mutation.isPending;

  const respond = (next: OfferDecision) => {
    if (!current || busy) return;
    setDecision(next);
    response.mutation.reset();
    void response.respond(current, next, (job) => {
      setAnswered(current.offerId);
      if (next === 'accept' && job) router.push(`${riderBase}/active`);
    });
  };

  return (
    <DialogFrame
      open={visible}
      onOpenChange={() => undefined}
      role="alertdialog"
      title={t('alertTitle')}
      description={t('alertDescription')}
    >
      {current && (
        <RequestCountdownCard
          key={current.offerId}
          offer={current}
          busy={busy}
          pending={busy ? decision : null}
          canAccept={summary.data?.online !== false && !hasActive}
          onRespond={respond}
        />
      )}
      {code && (
        <Notice tone="bad" role="alert" title={t('respondFailed')}>
          <p className="m-0">{errorText(error)}</p>
        </Notice>
      )}
    </DialogFrame>
  );
}
