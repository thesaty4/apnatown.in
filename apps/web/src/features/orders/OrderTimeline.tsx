'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { OrderDetail } from '@apnatown/shared/orders';
import { reasonKey } from './format';
import { isTerminal, statusFlow, statusKey } from './status';

/** Delivery/pickup progress with persisted event times (IST). Cancelled and
 * refunded orders keep their reached steps and add a distinct final step. */
export function OrderTimeline({ order }: { order: OrderDetail }) {
  const t = useTranslations('orders.detail');
  const status = useTranslations('orders.status');
  const reasons = useTranslations('orders.reasons');
  const format = useFormatter();
  const flow = statusFlow[order.mode];
  const stopped = order.status === 'cancelled' || order.status === 'refunded';
  const reached = flow.indexOf(order.status);
  const time = (at: string) =>
    format.dateTime(new Date(at), {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    });
  const entry = (step: string) =>
    [...order.timeline].reverse().find((item) => item.status === step);
  const end = entry(order.status === 'refunded' ? 'refunded' : 'cancelled');
  const reason = end?.reasonKey ? reasonKey(end.reasonKey) : null;
  return (
    <section aria-labelledby="order-progress" className="grid gap-3">
      <h2 id="order-progress" className="m-0 text-h4">
        {t(order.mode === 'pickup' ? 'pickupProgress' : 'deliveryProgress')}
      </h2>
      <ol className="m-0 grid list-none gap-3 p-0">
        {flow.map((step, index) => {
          const at = entry(step);
          const done = stopped ? at !== undefined : index <= reached;
          const current =
            !stopped && index === reached && !isTerminal(order.status);
          return (
            <li
              key={step}
              aria-current={current ? 'step' : undefined}
              className="flex items-start gap-3"
            >
              <span
                aria-hidden="true"
                className={`grid size-7 shrink-0 place-items-center rounded-pill border-2 text-small font-bold ${done ? 'border-success bg-success text-on-primary' : current ? 'border-primary text-primary' : 'border-border-strong text-muted'}`}
              >
                {done ? '✓' : index + 1}
              </span>
              <div className="grid min-w-0 gap-0.5">
                <b className={done || current ? 'text-text' : 'text-text-2'}>
                  {status(statusKey(step, order.mode))}
                  <span className="sr-only">
                    {' '}
                    {t(
                      done ? 'stepDone' : current ? 'stepCurrent' : 'stepNext',
                    )}
                  </span>
                </b>
                {at && (
                  <time dateTime={at.at} className="text-caption text-muted">
                    {time(at.at)}
                  </time>
                )}
              </div>
            </li>
          );
        })}
        {stopped && (
          <li className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-pill border-2 border-error bg-error text-small font-bold text-on-primary"
            >
              {order.status === 'refunded' ? '↺' : '✕'}
            </span>
            <div className="grid min-w-0 gap-0.5">
              <b>{status(statusKey(order.status, order.mode))}</b>
              {end && (
                <span className="text-small text-text-2">
                  {t(`cancelledBy.${end.actorKind}`)}
                </span>
              )}
              {reason && (
                <span className="text-small text-text-2 [overflow-wrap:anywhere]">
                  {t('cancelReason', { reason: reasons(reason) })}
                </span>
              )}
              {end && (
                <time dateTime={end.at} className="text-caption text-muted">
                  {time(end.at)}
                </time>
              )}
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}
