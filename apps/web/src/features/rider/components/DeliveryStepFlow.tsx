'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { RiderJob } from '@apnatown/shared/delivery';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { useOnline } from '../../../shared/hooks/use-online';
import { DirectionsAction } from '../../geo/DirectionsAction';
import { jobVersions } from '../job-api';
import { useJobCommand } from '../job-queries';
import { Notice, useKm, useMoney, useRiderError } from '../parts';
import { CompleteDeliveryForm } from './CompleteDeliveryForm';
import { FailReasonSheet } from './FailReasonSheet';
import { ItemChecklist } from './ItemChecklist';

export type FinishedJob = {
  jobId: string;
  orderNumber: string;
  kind: 'delivered' | 'failed';
};

const STEPS = [
  'accepted',
  'reached_shop',
  'picked_up',
  'reached_drop',
  'delivered',
] as const;
const stepKey = {
  accepted: 'accepted',
  reached_shop: 'reachedShop',
  picked_up: 'pickedUp',
  reached_drop: 'reachedDrop',
  delivered: 'delivered',
} as const;

/**
 * S-RIDE-04 DeliveryStepFlow: timeline (Accepted → Reached shop → Picked up →
 * Reached drop → Delivered) with exactly one primary action, chosen from the
 * server's `allowedActions`. Every command carries the rendered job/order/
 * financial versions; the checklist and cash confirmation reset themselves
 * whenever those versions change. No code or phone is shown.
 */
export function DeliveryStepFlow({
  job,
  onFinished,
}: {
  job: RiderJob;
  onFinished: (finished: FinishedJob) => void;
}) {
  const t = useTranslations('rider.active');
  const money = useMoney();
  const km = useKm();
  const [failOpen, setFailOpen] = useState(false);
  const allowed = new Set(job.allowedActions);
  const index = STEPS.indexOf(job.status as (typeof STEPS)[number]);
  const finish = (kind: FinishedJob['kind']) =>
    onFinished({ jobId: job.jobId, orderNumber: job.orderNumber, kind });

  return (
    <div className="grid min-w-0 gap-4 desktop:grid-cols-2 desktop:items-start">
      <div className="grid min-w-0 gap-4">
        <Card padded className="grid min-w-0 gap-3">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-h3 [overflow-wrap:anywhere]" dir="auto">
              {t('order', { number: job.orderNumber })}
            </h2>
            <StatusBadge
              tone="st-out"
              icon="🛵"
              label={t(
                `step.${index >= 0 ? stepKey[STEPS[index]!] : 'accepted'}`,
              )}
            />
          </div>
          {allowed.has('reached_shop') ? (
            <SimpleStep
              key="reached_shop"
              job={job}
              event="reached_shop"
              hint={t('goToShop', { shop: job.pickup.businessName })}
              label={t('reachedShopAction')}
            />
          ) : allowed.has('picked_up') ? (
            <ItemChecklist job={job} />
          ) : allowed.has('reached_drop') ? (
            <SimpleStep
              key="reached_drop"
              job={job}
              event="reached_drop"
              hint={t('goToDrop')}
              label={t('reachedDropAction')}
            />
          ) : allowed.has('complete') ? (
            <CompleteDeliveryForm
              job={job}
              onDone={() => finish('delivered')}
            />
          ) : (
            <Notice tone="info" icon="⏳" title={t('waiting')} />
          )}
          {allowed.has('fail') && (
            <Button
              variant="text"
              className="justify-self-start text-error"
              aria-haspopup="dialog"
              onClick={() => setFailOpen(true)}
            >
              {t('reportIssue')}
            </Button>
          )}
        </Card>
        <Card padded className="grid min-w-0 gap-3">
          <h2 className="m-0 text-h3">{t('details')}</h2>
          <dl className="m-0 grid gap-2 text-small tablet:grid-cols-2">
            <Detail label={t('pickup')}>
              {[job.pickup.businessName, job.pickup.area]
                .filter(Boolean)
                .join(' · ')}
            </Detail>
            <Detail label={t('drop')}>
              {job.drop.firstName && (
                <span className="block font-semibold">
                  {job.drop.firstName}
                </span>
              )}
              <span className="whitespace-pre-line font-normal">
                {job.drop.address}
              </span>
            </Detail>
            <Detail label={t('distance')}>{km(job.distanceM)}</Detail>
            <Detail label={t('estimate')}>
              {money(job.estimate.totalPaise)}
            </Detail>
          </dl>
          <div className="flex flex-wrap gap-2">
            <DirectionsAction
              destination={job.drop.location}
              placeName={t('dropPlace')}
              variant="outline"
            />
          </div>
          {!job.drop.location && (
            <p className="m-0 text-small text-text-2">{t('noLocation')}</p>
          )}
          {!job.call.available && (
            <p className="m-0 text-small text-text-2">{t('callUnavailable')}</p>
          )}
        </Card>
      </div>
      <Card padded className="grid min-w-0 gap-3">
        <h2 className="m-0 text-h3">{t('progress')}</h2>
        <ol className="m-0 grid list-none gap-3 p-0">
          {STEPS.map((step, i) => {
            const done = index >= i;
            const current = index === i - 1;
            return (
              <li
                key={step}
                className="flex min-w-0 items-center gap-3"
                aria-current={current ? 'step' : undefined}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-8 shrink-0 place-items-center rounded-pill text-small font-semibold ${
                    done
                      ? 'bg-success text-on-primary'
                      : current
                        ? 'border-2 border-primary text-primary'
                        : 'bg-surface-2 text-muted'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span
                  className={`min-w-0 [overflow-wrap:anywhere] ${current ? 'font-semibold' : ''}`}
                >
                  {t(`step.${stepKey[step]}`)}
                  <span className="sr-only">
                    {' '}
                    {t(
                      done ? 'stepDone' : current ? 'stepCurrent' : 'stepNext',
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </Card>
      <FailReasonSheet
        job={job}
        open={failOpen && allowed.has('fail')}
        onClose={() => setFailOpen(false)}
        onDone={() => {
          setFailOpen(false);
          finish('failed');
        }}
      />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="m-0 font-semibold [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** One-tap step (reached shop / reached drop) with its own error state. */
function SimpleStep({
  job,
  event,
  hint,
  label,
}: {
  job: RiderJob;
  event: 'reached_shop' | 'reached_drop';
  hint: string;
  label: string;
}) {
  const online = useOnline();
  const errorText = useRiderError('job');
  const command = useJobCommand(job.jobId);
  const pending = command.mutation.isPending;
  return (
    <div className="grid gap-3">
      <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
        {hint}
      </p>
      {command.mutation.isError && (
        <Notice tone="bad" role="alert">
          <p className="m-0">{errorText(command.mutation.error)}</p>
        </Notice>
      )}
      <Button
        disabled={!online || pending}
        loading={pending}
        onClick={() => {
          command.mutation.reset();
          void command.run({
            type: 'event',
            input: { event, ...jobVersions(job) },
          });
        }}
      >
        {label}
      </Button>
    </div>
  );
}
