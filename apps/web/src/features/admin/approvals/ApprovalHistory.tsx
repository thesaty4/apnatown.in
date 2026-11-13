'use client';

import { useTranslations } from 'next-intl';
import type { AuditEntrySummary } from '@apnatown/shared/admin';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { roleKey } from '../audit/filters';
import { useIstTime } from './parts';

/** Prototype "History" timeline: this application's audit entries, newest
 * first, with stored summaries (never raw diffs). */
export function ApprovalHistory({
  items,
  hasMore,
  loadingMore,
  moreFailed,
  loadMore,
}: {
  items: AuditEntrySummary[];
  hasMore: boolean;
  loadingMore: boolean;
  moreFailed: boolean;
  loadMore: () => void;
}) {
  const t = useTranslations('admin.approvals.history');
  const ta = useTranslations('admin.audit');
  const time = useIstTime();
  return (
    <Card padded className="grid min-w-0 gap-3">
      <h2 className="m-0 text-h3">{t('title')}</h2>
      {items.length === 0 ? (
        <p className="m-0 text-small text-text-2">{t('empty')}</p>
      ) : (
        <ol className="m-0 grid list-none gap-0 p-0">
          {items.map((entry) => (
            <li
              key={entry.id}
              className="relative grid gap-0.5 border-s-2 border-border pb-3 ps-4 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="absolute -start-1.5 top-1 size-2.5 rounded-pill bg-primary"
              />
              <span className="text-small font-semibold [overflow-wrap:anywhere]">
                {entry.summary || entry.action}
              </span>
              <span className="text-caption text-text-2 [overflow-wrap:anywhere]">
                {ta('actor', {
                  actor: entry.actorLabel,
                  role: ta(roleKey(entry.actorRole)),
                })}
                {' · '}
                <time dateTime={entry.occurredAt}>
                  {time(entry.occurredAt)}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}
      {moreFailed && (
        <p role="alert" className="m-0 text-small text-error">
          {t('moreFailed')}
        </p>
      )}
      {hasMore && (
        <Button
          variant="outline"
          className="justify-self-start"
          loading={loadingMore}
          onClick={loadMore}
        >
          {moreFailed ? t('retry') : t('more')}
        </Button>
      )}
    </Card>
  );
}
