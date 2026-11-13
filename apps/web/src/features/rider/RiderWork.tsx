'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import {
  DeliveryStepFlow,
  type FinishedJob,
} from './components/DeliveryStepFlow';
import { RequestCountdownCard } from './components/RequestCountdownCard';
import { useOfferResponse, type OfferDecision } from './job-queries';
import { Notice, ReadState, riderBase, useRiderError } from './parts';
import { ScreenHeader } from './RiderShell';
import {
  noActiveJob,
  useActiveJob,
  useCurrentOffer,
  useRiderSummary,
} from './queries';

const linkClass = buttonVariantClassName('outline');

/**
 * S-RIDE-03: the current offer with Accept/Reject, or an explicit "no
 * requests" empty state. Realtime `delivery` hints, focus and reconnect
 * re-read the offer; navigation to the active delivery happens only after
 * the accept commits. Expired/taken outcomes stay visible after the card
 * clears.
 */
export function RiderRequests() {
  const t = useTranslations('rider.requests');
  const router = useRouter();
  const online = useOnline();
  const errorText = useRiderError('job');
  const offer = useCurrentOffer();
  const active = useActiveJob();
  const summary = useRiderSummary();
  const response = useOfferResponse();
  const [decision, setDecision] = useState<OfferDecision | null>(null);
  const [rejected, setRejected] = useState(false);
  const busy = response.mutation.isPending;
  const error = response.mutation.isError ? response.mutation.error : null;
  const code = error ? failureCode(error) : null;
  const hasActive = Boolean(active.data) && !noActiveJob(active.error);
  const offDuty = summary.data?.online === false;
  const current = offer.data?.offer ?? null;

  const respond = (next: OfferDecision) => {
    if (!current || busy) return;
    setDecision(next);
    setRejected(false);
    response.mutation.reset();
    void response.respond(current, next, () => {
      if (next === 'accept') router.push(`${riderBase}/active`);
      else setRejected(true);
    });
  };

  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      {hasActive && (
        <Notice
          tone="info"
          icon="🚚"
          title={t('finishActive')}
          action={
            <Link href={`${riderBase}/active`} className={linkClass}>
              {t('openActive')}
            </Link>
          }
        />
      )}
      {offDuty && (
        <Notice
          tone="warn"
          title={t('offDuty')}
          action={
            <Link href={`${riderBase}/home`} className={linkClass}>
              {t('backHome')}
            </Link>
          }
        />
      )}
      <div role="status" aria-live="polite" className="empty:hidden">
        {rejected && <Notice tone="ok" title={t('rejectedDone')} />}
      </div>
      {code && (
        <Notice
          tone={code === 'DELIVERY_OFFER_TAKEN' ? 'warn' : 'bad'}
          icon={code === 'DELIVERY_OFFER_EXPIRED' ? '⌛' : undefined}
          role="alert"
          title={
            code === 'DELIVERY_OFFER_TAKEN'
              ? t('taken')
              : code === 'DELIVERY_OFFER_EXPIRED'
                ? t('expired')
                : t('respondFailed')
          }
        >
          <p className="m-0">{errorText(error)}</p>
        </Notice>
      )}
      {!offer.data ? (
        <ReadState query={offer} />
      ) : current ? (
        <RequestCountdownCard
          key={current.offerId}
          offer={current}
          busy={busy || !online}
          pending={busy ? decision : null}
          canAccept={!offDuty && !hasActive}
          onRespond={respond}
        />
      ) : (
        <EmptyState
          headingLevel="h2"
          icon="🛵"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={
            <Link href={`${riderBase}/home`} className={linkClass}>
              {t('backHome')}
            </Link>
          }
        />
      )}
    </div>
  );
}

/**
 * S-RIDE-04: 404 DELIVERY_JOB_NOT_FOUND is the "no active delivery" answer
 * (checked before any retained job data). A committed completion/failure
 * keeps its outcome on screen after the job leaves the active read.
 */
export function RiderActive() {
  const t = useTranslations('rider.active');
  const job = useActiveJob();
  const [finished, setFinished] = useState<FinishedJob | null>(null);
  const live =
    job.data && !(job.isError && noActiveJob(job.error)) ? job.data : null;
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      {finished && (!live || live.jobId === finished.jobId) ? (
        <FinishedNotice finished={finished} />
      ) : live ? (
        <DeliveryStepFlow job={live} onFinished={setFinished} />
      ) : job.isError && noActiveJob(job.error) ? (
        <EmptyState
          headingLevel="h2"
          icon="🛵"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={
            <Link href={`${riderBase}/requests`} className={linkClass}>
              {t('openRequests')}
            </Link>
          }
        />
      ) : (
        <ReadState query={job} />
      )}
    </div>
  );
}

function FinishedNotice({ finished }: { finished: FinishedJob }) {
  const t = useTranslations('rider.active');
  const delivered = finished.kind === 'delivered';
  return (
    <div role="status" aria-live="polite">
      <Notice
        tone={delivered ? 'ok' : 'warn'}
        icon={delivered ? '🎉' : '⚠️'}
        title={t(delivered ? 'deliveredTitle' : 'failedTitle', {
          number: finished.orderNumber,
        })}
        action={
          <>
            <Link
              href={`${riderBase}/${delivered ? 'earnings' : 'home'}`}
              className={linkClass}
            >
              {t(delivered ? 'viewEarnings' : 'backHome')}
            </Link>
            <Link
              href={`${riderBase}/requests`}
              className={buttonVariantClassName('primary')}
            >
              {t('openRequests')}
            </Link>
          </>
        }
      >
        <p className="m-0">{t(delivered ? 'deliveredBody' : 'failedBody')}</p>
      </Notice>
    </div>
  );
}
