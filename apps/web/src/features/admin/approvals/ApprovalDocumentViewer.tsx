'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { BusinessDocumentKind } from '@apnatown/shared/businesses';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { failureCode } from '../../../shared/api/result';
import { useAdmin } from '../AdminShell';
import { AdminFailure } from '../parts';
import { documentKindKey, useIstTime } from './parts';
import { approvalDocumentsOptions } from './queries';

const kindIcon: Record<BusinessDocumentKind, string> = {
  owner_id: '🪪',
  business_photo: '🏪',
  registration_document: '📄',
};

/**
 * Prototype "Documents" card. Private document viewing needs the Media view
 * capability, which has not shipped: the API returns metadata with
 * `view.state = unavailable`, so the viewer shows an explicit unavailable
 * state — never a sample image, asset URL or storage key.
 */
export function ApprovalDocumentViewer({ id }: { id: string }) {
  const context = useAdmin();
  const t = useTranslations('admin.approvals.documents');
  const ts = useTranslations('admin.state');
  const time = useIstTime();
  const documents = useQuery(approvalDocumentsOptions(context, id));
  const [selected, setSelected] = useState(0);
  const items = documents.data?.items ?? [];
  const index = Math.min(selected, Math.max(items.length - 1, 0));
  const current = items[index];

  let body;
  if (documents.isPending) body = <Skeleton label={ts('loading')} />;
  else if (documents.isError)
    body = (
      <AdminFailure
        code={failureCode(documents.error)}
        busy={documents.isFetching}
        retry={() => void documents.refetch()}
      />
    );
  else if (!current)
    body = <p className="m-0 text-small text-text-2">{t('none')}</p>;
  else
    body = (
      <>
        <div
          role="group"
          aria-label={t('listLabel')}
          className="flex flex-wrap gap-2"
        >
          {items.map((item, position) => (
            <Chip
              key={item.documentId}
              label={t(`kinds.${documentKindKey[item.documentKind]}`)}
              selected={position === index}
              onClick={() => setSelected(position)}
            />
          ))}
        </div>
        <figure className="m-0 grid gap-2">
          <div
            role="img"
            aria-label={t('unavailableLabel', {
              document: t(`kinds.${documentKindKey[current.documentKind]}`),
            })}
            className="grid min-h-48 place-items-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-surface-2 p-4 text-center"
          >
            <span aria-hidden="true" className="text-h1">
              {kindIcon[current.documentKind]}
            </span>
            <span className="grid gap-1">
              <span className="font-semibold">{t('unavailableTitle')}</span>
              <span className="text-small text-text-2">
                {t('unavailableMessage')}
              </span>
            </span>
          </div>
          <figcaption className="text-caption text-text-2">
            {t('caption', {
              document: t(`kinds.${documentKindKey[current.documentKind]}`),
              position: index + 1,
              total: items.length,
            })}
            {' · '}
            <time dateTime={current.uploadedAt}>
              {t('uploaded', { time: time(current.uploadedAt) })}
            </time>
          </figcaption>
        </figure>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="card"
            disabled={index === 0}
            onClick={() => setSelected(index - 1)}
          >
            ‹ {t('previous')}
          </Button>
          <Button
            variant="outline"
            size="card"
            disabled={index >= items.length - 1}
            onClick={() => setSelected(index + 1)}
          >
            {t('next')} ›
          </Button>
          <Button
            variant="outline"
            size="card"
            disabled
            aria-describedby={`zoom-${id}`}
          >
            🔍 {t('zoom')}
          </Button>
          <span id={`zoom-${id}`} className="sr-only">
            {t('unavailableMessage')}
          </span>
        </div>
      </>
    );

  return (
    <Card padded className="grid min-w-0 gap-3">
      <h2 className="m-0 text-h3">{t('title')}</h2>
      {body}
    </Card>
  );
}
