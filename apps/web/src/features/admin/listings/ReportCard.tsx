'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AdminListingReport } from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { failureCode } from '../../../shared/api/result';
import { useAdmin } from '../AdminShell';
import { Alert, Notice } from '../parts';
import { useIstTime } from '../approvals/parts';
import { resolveListingReport } from './api';
import {
  isListingConflict,
  ReportReasonLabel,
  ReportStatusBadge,
  useListingError,
} from './parts';
import { useListingCommand } from './queries';

/**
 * One listing report. Reporter details are untrusted: rendered as inert text
 * only (React escapes; never HTML, never linkified). Resolution is a
 * separate decision from any listing action, which uses its own command.
 */
export function ReportCard({
  report,
  headingLevel = 'h4',
  onResolved,
}: {
  report: AdminListingReport;
  headingLevel?: 'h3' | 'h4';
  /** Lets a list announce the result after the card leaves the open list. */
  onResolved?: (message: string) => void;
}) {
  const context = useAdmin();
  const { me } = context;
  const t = useTranslations('admin.listings.reports');
  const message = useListingError();
  const time = useIstTime();
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<string>();
  const canResolve =
    report.status === 'open' &&
    (me.isSuper || me.permissions.catalog.includes('edit'));
  const resolve = useListingCommand(
    context,
    (api, input: Parameters<typeof resolveListingReport>[2], command) =>
      resolveListingReport(api, report.id, input, command),
  );
  const busy = resolve.mutation.isPending;
  const code = resolve.mutation.error
    ? failureCode(resolve.mutation.error)
    : undefined;
  const Heading = headingLevel;

  function submit(resolution: 'dismissed' | 'action_taken') {
    const trimmed = note.trim();
    setNotice(undefined);
    resolve.submit(
      {
        resolution,
        expectedVersion: report.version,
        ...(trimmed ? { note: trimmed } : {}),
      },
      () => (onResolved ?? setNotice)(t('resolved')),
    );
  }

  return (
    <article className="grid gap-2 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading className="m-0 text-body font-semibold">
          <ReportReasonLabel reason={report.reason} />
        </Heading>
        <ReportStatusBadge report={report} />
      </div>
      <p className="m-0 text-small text-text-2">
        {t('meta', {
          reporter: t(`reporter.${report.reporter}`),
          time: time(report.createdAt),
        })}
      </p>
      <div className="grid gap-1">
        <p className="m-0 text-small font-semibold">{t('details')}</p>
        <p className="m-0 whitespace-pre-wrap text-small [overflow-wrap:anywhere]">
          {report.details ?? t('noDetails')}
        </p>
      </div>
      {report.resolutionNote && (
        <p className="m-0 whitespace-pre-wrap text-small text-text-2 [overflow-wrap:anywhere]">
          {t('resolutionNote', { note: report.resolutionNote })}
        </p>
      )}
      {code && (
        <Alert
          message={
            isListingConflict(code)
              ? t('reloaded', { reason: message(code) })
              : message(code)
          }
        />
      )}
      <Notice message={notice} />
      {canResolve && (
        <div className="grid gap-2">
          <TextArea
            label={t('note')}
            hint={t('noteHint')}
            value={note}
            maxLength={500}
            disabled={busy}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              size="small"
              disabled={busy}
              onClick={() => submit('dismissed')}
            >
              {t('dismiss')}
            </Button>
            <Button
              size="small"
              disabled={busy}
              loading={busy}
              onClick={() => submit('action_taken')}
            >
              {t('actionTaken')}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
