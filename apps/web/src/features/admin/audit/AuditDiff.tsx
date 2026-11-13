'use client';

import { useTranslations } from 'next-intl';
import type { AuditEntryDetail } from '@apnatown/shared/admin';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';

type Snapshot = AuditEntryDetail['before'];

/** Inert text only: JSON values (including redaction markers) are shown exactly
 * as the server returned them, never interpreted as HTML or links. */
function Value({ snapshot, field }: { snapshot: Snapshot; field: string }) {
  const t = useTranslations('admin.audit');
  if (!snapshot || !Object.hasOwn(snapshot, field))
    return <span className="text-muted">{t('notRecorded')}</span>;
  return (
    <pre className="m-0 max-w-full text-small whitespace-pre-wrap [overflow-wrap:anywhere]">
      <code dir="ltr">{JSON.stringify(snapshot[field], null, 2)}</code>
    </pre>
  );
}

/** S-ADMN-16 / S-SUPR-08 before/after, side by side; changed fields carry the
 * text "Changed" (never colour only). */
export function AuditDiff({
  before,
  after,
}: {
  before: Snapshot;
  after: Snapshot;
}) {
  const t = useTranslations('admin.audit');
  const fields = [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ].sort();
  if (fields.length === 0) return <p className="text-text-2">{t('noDiff')}</p>;
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-0 border-collapse text-start text-small">
        <caption className="sr-only">{t('diffCaption')}</caption>
        <thead>
          <tr className="border-b border-border text-text-2">
            <th scope="col" className="p-2 text-start font-semibold">
              {t('field')}
            </th>
            <th scope="col" className="p-2 text-start font-semibold">
              {t('before')}
            </th>
            <th scope="col" className="p-2 text-start font-semibold">
              {t('after')}
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const changed =
              JSON.stringify(before?.[field]) !==
                JSON.stringify(after?.[field]) ||
              Object.hasOwn(before ?? {}, field) !==
                Object.hasOwn(after ?? {}, field);
            return (
              <tr
                key={field}
                className={`border-b border-border align-top ${changed ? 'bg-warning-soft' : ''}`}
              >
                <th
                  scope="row"
                  className="grid justify-items-start gap-1 p-2 text-start font-medium"
                >
                  <code dir="ltr" className="[overflow-wrap:anywhere]">
                    {field}
                  </code>
                  {changed && (
                    <StatusBadge tone="warn" icon="✎" label={t('changed')} />
                  )}
                </th>
                <td className="p-2">
                  <Value snapshot={before} field={field} />
                </td>
                <td className="p-2">
                  <Value snapshot={after} field={field} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
