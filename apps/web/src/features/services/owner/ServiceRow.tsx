'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ServiceOwner } from '@apnatown/shared/services';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { IconButton } from '../../media/owner-images/tiles';
import { ServiceStatusBadge } from './parts';

/** Owner title in the active locale, falling back to English. */
export const serviceName = (service: ServiceOwner, locale: string) =>
  (locale === 'hi' && service.nameHi) || service.nameEn;

/**
 * Prototype `vservices` card row: name + status, taxonomy line, price badge,
 * then Active switch and Edit / View / Copy link / Delete actions.
 */
export function ServiceRow({
  service,
  taxonomy,
  price,
  busy,
  statusPending,
  onToggle,
  onEdit,
  onCopy,
  onDelete,
  publicHref,
}: {
  service: ServiceOwner;
  taxonomy: string;
  price: string;
  /** Any row write in flight: actions wait for the server. */
  busy: boolean;
  statusPending: boolean;
  onToggle: (next: ServiceOwner['status']) => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  /** Null while the service/business is not publicly visible. */
  publicHref: string | null;
}) {
  const t = useTranslations('service.manager');
  const locale = useLocale();
  const nameId = useId();
  const switchId = useId();
  const name = serviceName(service, locale);
  const next = service.status === 'active' ? 'paused' : 'active';
  const canToggle = service.allowedStatuses.includes(next);
  return (
    <li className="grid min-w-0 gap-3 rounded-lg border border-border bg-surface p-4 shadow-1 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-start">
      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2
            id={nameId}
            className="m-0 min-w-0 text-body font-bold [overflow-wrap:anywhere]"
          >
            {name}
          </h2>
          <ServiceStatusBadge status={service.status} />
          {service.featured && (
            <Badge tone="info" icon="★" label={t('featuredBadge')} />
          )}
        </div>
        {taxonomy && (
          <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
            {taxonomy}
          </p>
        )}
        {service.description && (
          <p className="m-0 line-clamp-2 text-small text-text-2 [overflow-wrap:anywhere]">
            {service.description}
          </p>
        )}
        <span className="mt-1 justify-self-start">
          <Badge tone="neutral" label={price} />
        </span>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1 tablet:justify-end">
        <Switch
          id={switchId}
          label={t('activeSwitch')}
          aria-labelledby={`${switchId}-label ${nameId}`}
          checked={service.status === 'active'}
          disabled={!canToggle || busy}
          aria-busy={statusPending || undefined}
          wrapperClassName="me-2"
          onChange={() => onToggle(next)}
        />
        <Button
          size="small"
          variant="ghost"
          disabled={busy}
          aria-describedby={nameId}
          onClick={onEdit}
        >
          <NavIcon name="edit" className="size-4" />
          {t('edit')}
        </Button>
        {publicHref && (
          <a
            href={publicHref}
            target="_blank"
            rel="noopener"
            aria-label={t('viewPageNamed', { name })}
            title={t('viewPage')}
            className="grid min-h-touch min-w-touch place-items-center rounded-sm text-text-2 hover:bg-surface-2 hover:text-text focus-visible:ring-focus"
          >
            <NavIcon name="eye" className="size-4.5" />
          </a>
        )}
        <IconButton
          icon="copy"
          label={t('copyLinkNamed', { name })}
          onClick={onCopy}
        />
        <IconButton
          icon="trash"
          label={t('deleteNamed', { name })}
          disabled={busy}
          onClick={onDelete}
        />
      </div>
    </li>
  );
}
