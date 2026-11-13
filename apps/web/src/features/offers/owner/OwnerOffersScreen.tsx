'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import { OFFER_STATUSES, OwnerOfferQuerySchema, type OwnerOffer } from '@apnatown/shared/offers';
import { Card } from '@apnatown/ui/cards/Card';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { failureCode } from '../../../shared/api/result';
import { formatInr } from '../../../shared/lib/money';
import { OwnerGate } from '../../businesses/BusinessDashboard';
import { OwnerQueryState } from '../../businesses/OwnerQueryState';
import { LockedNote, errorKey } from '../../businesses/parts';
import type { OfferStatusFilter } from './api';
import { OfferEditorSheet } from './OfferEditorSheet';
import { useOfferCommand, useOwnerOffers } from './queries';

const FILTERS = ['all', ...OFFER_STATUSES] as const;

/** S-VEND-07 owner offers: list, create/edit (re-approval), pause/resume/end. */
export function OwnerOffersScreen({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <OffersGate business={business} />}
    </OwnerGate>
  );
}

function OffersGate({ business }: { business: BusinessOwner }) {
  const t = useTranslations('offers.owner');
  const approved = business.status === 'approved';
  const [editing, setEditing] = useState<OwnerOffer | null | undefined>(undefined);
  return (
    <div className="grid min-w-0 gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        {approved && <Button onClick={() => setEditing(null)}>+ {t('create')}</Button>}
      </header>
      {approved ? (
        <Offers kind={business.kind} onEdit={setEditing} />
      ) : (
        <Card padded>
          <LockedNote />
        </Card>
      )}
      {editing !== undefined && (
        <OfferEditorSheet
          key={editing?.id ?? 'new'}
          kind={business.kind}
          offer={editing}
          open
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}

function useStatusFilter(): [OfferStatusFilter, (next: OfferStatusFilter) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const status = OwnerOfferQuerySchema.shape.status.catch('all').parse(params.get('status'));
  return [
    status,
    (next) => router.replace(next === 'all' ? path : `${path}?status=${next}`, { scroll: false }),
  ];
}

function Offers({ kind, onEdit }: { kind: BusinessKind; onEdit: (offer: OwnerOffer) => void }) {
  const t = useTranslations('offers.owner');
  const [status, setStatus] = useStatusFilter();
  const query = useOwnerOffers(kind, status, true);
  return (
    <>
      <div role="group" aria-label={t('filtersLabel')} className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <Chip
            key={value}
            label={t(`filters.${value}`)}
            selected={status === value}
            onClick={() => setStatus(value)}
          />
        ))}
      </div>
      <OwnerQueryState query={query} loadingLabel={t('loading')} errorTitle={t('error')}>
        {(data) => {
          const items = data.pages.flatMap((page) => page.items);
          if (!items.length)
            return <EmptyState icon="🏷️" title={t('emptyTitle')} message={t('emptyMessage')} action={null} />;
          return (
            <div className="grid gap-3">
              <ul className="m-0 grid list-none gap-3 p-0 desktop:grid-cols-2">
                {items.map((offer) => (
                  <li key={offer.id}>
                    <OfferCard kind={kind} offer={offer} onEdit={() => onEdit(offer)} />
                  </li>
                ))}
              </ul>
              {query.hasNextPage && (
                <Button
                  variant="outline"
                  loading={query.isFetchingNextPage}
                  onClick={() => void query.fetchNextPage()}
                >
                  {t('loadMore')}
                </Button>
              )}
            </div>
          );
        }}
      </OwnerQueryState>
    </>
  );
}

function statusBadge(offer: OwnerOffer): { key: string; tone: BadgeTone; icon: string } {
  if (offer.status === 'ended') return { key: 'ended', tone: 'neutral', icon: '⏹' };
  if (offer.expired) return { key: 'expired', tone: 'neutral', icon: '⌛' };
  if (offer.status === 'pending' && offer.reviewDecision === 'rejected')
    return { key: 'rejected', tone: 'bad', icon: '✕' };
  if (offer.status === 'pending') return { key: 'pending', tone: 'warn', icon: '⏳' };
  if (offer.status === 'paused') return { key: 'paused', tone: 'info', icon: '⏸' };
  return { key: 'active', tone: 'ok', icon: '✓' };
}

function OfferCard({ kind, offer, onEdit }: { kind: BusinessKind; offer: OwnerOffer; onEdit: () => void }) {
  const t = useTranslations('offers.owner');
  const te = useTranslations('business.errors');
  const format = useFormatter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const mutation = useOfferCommand(kind);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const badge = statusBadge(offer);
  const title = (locale === 'hi' && offer.titleHi) || offer.titleEn;
  const discount =
    offer.discountType === 'percent'
      ? t('percentOff', { value: offer.discountPercent ?? 0 })
      : offer.discountType === 'flat'
        ? t('amountOff', { amount: formatInr(offer.discountPaise ?? 0, locale) })
        : t('types.freeDelivery');
  const date = (iso: string) =>
    format.dateTime(new Date(iso), { dateStyle: 'medium', timeZone: 'Asia/Kolkata' });
  const setStatus = (status: 'active' | 'paused' | 'ended') =>
    void mutation.run(
      { type: 'status', id: offer.id, command: { status, expectedVersion: offer.version } },
      () => setConfirmEnd(false),
    );
  const can = (action: OwnerOffer['allowedActions'][number]) => offer.allowedActions.includes(action);
  return (
    <Card padded className="grid h-full gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="m-0 text-h4 [overflow-wrap:anywhere]">{title}</h2>
        <StatusBadge tone={badge.tone} icon={badge.icon} label={t(`status.${badge.key}`)} />
      </div>
      <p className="m-0 font-semibold text-primary">{discount}</p>
      <p className="m-0 text-small text-muted">
        {t('validity', { from: date(offer.validFrom), to: date(offer.validTo) })}
      </p>
      {offer.rejectionReason && (
        <p className="m-0 text-small text-error [overflow-wrap:anywhere]">
          {t('rejectedReason', { reason: offer.rejectionReason })}
        </p>
      )}
      <p className="m-0 text-caption text-text-2">
        {t('performance', { views: offer.viewsCount, uses: offer.usesCount })}
      </p>
      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        {can('edit') && (
          <Button size="small" variant="outline" disabled={mutation.isPending} onClick={onEdit}>
            {t('edit')}
          </Button>
        )}
        {can('pause') && (
          <Button size="small" variant="outline" loading={mutation.isPending} onClick={() => setStatus('paused')}>
            {t('pause')}
          </Button>
        )}
        {can('resume') && (
          <Button size="small" variant="outline" loading={mutation.isPending} onClick={() => setStatus('active')}>
            {t('resume')}
          </Button>
        )}
        {can('end') && (
          <Button size="small" variant="ghost" disabled={mutation.isPending} onClick={() => setConfirmEnd(true)}>
            {t('end')}
          </Button>
        )}
      </div>
      {mutation.isError && (
        <p role="alert" className="m-0 text-small text-error">
          {te(errorKey(failureCode(mutation.error)))}
        </p>
      )}
      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setConfirmEnd(false);
        }}
        title={t('endTitle')}
        impact={t('endImpact')}
        cancelLabel={t('cancel')}
        confirmLabel={t('end')}
        tone="danger"
        busy={mutation.isPending}
        onConfirm={() => setStatus('ended')}
      />
    </Card>
  );
}
