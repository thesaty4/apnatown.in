'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import {
  ENQUIRY_STATUSES,
  type EnquiryInboxItem,
  type EnquiryStatus,
} from '@apnatown/shared/services';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Input } from '@apnatown/ui/primitives/Input';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { OwnerGate } from '../businesses/BusinessDashboard';
import {
  Alert,
  LockedNote,
  StatusBanner,
  deniedCodes,
  errorKey,
} from '../businesses/parts';
import type { InboxFilters } from './api';
import {
  ENQUIRY_QUERY_MAX,
  enquiryHref,
  inboxHref,
  normalizeQuery,
  readInboxFilters,
} from './filters';
import {
  EnquiryStatusBadge,
  InitialAvatar,
  useIstDateTime,
  usePreferredDate,
  useReceivedAgo,
} from './parts';
import { useEnquiryInbox } from './queries';

const SEARCH_DEBOUNCE_MS = 350;
const PREVIEW_LENGTH = 70;

/** S-VEND-14 / S-PROV-03 inbox shared by vendor and provider dashboards. */
export function EnquiryInbox({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <InboxScreen business={business} />}
    </OwnerGate>
  );
}

function InboxScreen({ business }: { business: BusinessOwner }) {
  const t = useTranslations('service.enquiries');
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  return <Inbox kind={business.kind} />;
}

function useInboxUrl(kind: BusinessKind) {
  const params = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const filters = useMemo(
    () => readInboxFilters((name) => params.get(name)),
    [params],
  );
  const navigate = useCallback(
    (next: InboxFilters, mode: 'push' | 'replace') => {
      const href = inboxHref(kind, next);
      startTransition(() => router[mode](href, { scroll: false }));
    },
    [kind, router],
  );
  return { filters, navigate };
}

function Inbox({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('service.enquiries');
  const te = useTranslations('business.errors');
  const format = useFormatter();
  const online = useOnline();
  const { filters, navigate } = useInboxUrl(kind);
  const inbox = useEnquiryInbox(kind, filters, true);

  // Search box: local draft, committed to `?q=` after a short pause. A URL
  // change from Back/Forward or "Clear filters" re-seeds the draft.
  const [draft, setDraft] = useState(filters.query);
  const [seen, setSeen] = useState(filters.query);
  if (seen !== filters.query) {
    setSeen(filters.query);
    setDraft(filters.query);
  }
  useEffect(() => {
    const query = normalizeQuery(draft);
    if (query === filters.query) return;
    const timer = window.setTimeout(
      () => navigate({ ...filters, query }, 'replace'),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [draft, filters, navigate]);

  const pages = inbox.data?.pages;
  const counts = pages?.[0]?.statusCounts;
  const items = useMemo(
    () => pages?.flatMap((page) => page.items) ?? [],
    [pages],
  );
  const total = counts
    ? ENQUIRY_STATUSES.reduce((sum, status) => sum + counts[status], 0)
    : undefined;
  const filteredTotal =
    counts && total !== undefined
      ? filters.status
        ? counts[filters.status]
        : total
      : undefined;
  const number = (value: number | undefined) =>
    value === undefined ? undefined : format.number(value);

  const chips: { status: EnquiryStatus | undefined; label: string }[] = [
    { status: undefined, label: t('filterAll') },
    ...ENQUIRY_STATUSES.map((status) => ({
      status,
      label: t(`status.${status}`),
    })),
  ];

  return (
    <div className="grid min-w-0 gap-4">
      <h1 className="m-0 text-h1">{t('title')}</h1>
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="flex min-w-0 flex-wrap gap-2"
      >
        {chips.map(({ status, label }) => {
          const count = status
            ? number(counts?.[status])
            : number(total);
          return (
            <Chip
              key={status ?? 'all'}
              label={label}
              selected={filters.status === status}
              {...(count !== undefined && { count })}
              onClick={() => {
                if (filters.status !== status)
                  navigate({ ...filters, status }, 'push');
              }}
            />
          );
        })}
      </div>
      <div role="search" className="min-w-0">
        <Input
          type="search"
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          maxLength={ENQUIRY_QUERY_MAX}
          enterKeyHint="search"
          autoComplete="off"
          value={draft}
          prefix={<NavIcon name="search" className="size-4.5" />}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              const query = normalizeQuery(draft);
              if (query !== filters.query)
                navigate({ ...filters, query }, 'replace');
            }
          }}
        />
      </div>
      <p role="status" className="sr-only">
        {pages && filteredTotal !== undefined
          ? t('resultCount', {
              shown: format.number(items.length),
              total: format.number(filteredTotal),
            })
          : ''}
      </p>
      <InboxBody
        kind={kind}
        filters={filters}
        items={items}
        inbox={inbox}
        online={online}
        onClear={() => {
          setDraft('');
          navigate({ status: undefined, query: '' }, 'push');
        }}
        errorMessage={(code) => te(errorKey(code))}
      />
    </div>
  );
}

function InboxBody({
  kind,
  filters,
  items,
  inbox,
  online,
  onClear,
  errorMessage,
}: {
  kind: BusinessKind;
  filters: InboxFilters;
  items: EnquiryInboxItem[];
  inbox: ReturnType<typeof useEnquiryInbox>;
  online: boolean;
  onClear: () => void;
  errorMessage: (code: string) => string;
}) {
  const t = useTranslations('service.enquiries');
  const retry = (
    <Button disabled={inbox.isFetching} onClick={() => void inbox.refetch()}>
      {t('retry')}
    </Button>
  );

  if (inbox.isPending) {
    if (inbox.fetchStatus === 'paused' || !online)
      return (
        <OfflineState
          headingLevel="h2"
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={null}
        />
      );
    return <InboxSkeleton label={t('loading')} />;
  }

  if (inbox.isError && !inbox.data) {
    const code = failureCode(inbox.error);
    if (deniedCodes.has(code))
      return (
        <NoPermissionState
          headingLevel="h2"
          icon="🔒"
          title={t('forbiddenTitle')}
          message={t('forbiddenMessage')}
          action={null}
        />
      );
    if (!online)
      return (
        <OfflineState
          headingLevel="h2"
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={retry}
        />
      );
    return (
      <ErrorState
        headingLevel="h2"
        icon="⚠️"
        title={t('errorTitle')}
        message={errorMessage(code)}
        action={retry}
      />
    );
  }

  const filtered = Boolean(filters.status || filters.query);
  return (
    <div className="grid min-w-0 gap-3">
      {inbox.isRefetchError && (
        <Alert
          tone="warn"
          role="alert"
          action={
            <Button
              size="small"
              variant="outline"
              disabled={inbox.isFetching}
              onClick={() => void inbox.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {online ? t('refreshFailed') : t('offlineMessage')}
        </Alert>
      )}
      {items.length === 0 ? (
        filtered ? (
          <EmptyState
            headingLevel="h2"
            icon="🔍"
            title={t('noResultsTitle')}
            message={t('noResultsMessage')}
            action={
              <Button variant="outline" onClick={onClear}>
                {t('clearFilters')}
              </Button>
            }
          />
        ) : (
          <EmptyState
            headingLevel="h2"
            icon="📭"
            title={t('emptyTitle')}
            message={t('emptyMessage')}
            action={null}
          />
        )
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <EnquiryCard kind={kind} item={item} filters={filters} />
            </li>
          ))}
        </ul>
      )}
      {inbox.hasNextPage && (
        <div className="grid justify-items-center gap-2">
          {inbox.isFetchNextPageError && (
            <p role="alert" className="m-0 text-small text-error">
              {t('loadMoreFailed')}
            </p>
          )}
          <Button
            variant="outline"
            disabled={!online}
            loading={inbox.isFetchingNextPage}
            onClick={() => void inbox.fetchNextPage()}
          >
            {inbox.isFetchNextPageError ? t('retry') : t('loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}

function preview(message: string) {
  const characters = [...message.replace(/\s+/gu, ' ').trim()];
  return characters.length > PREVIEW_LENGTH
    ? `${characters.slice(0, PREVIEW_LENGTH).join('')}…`
    : characters.join('');
}

function EnquiryCard({
  kind,
  item,
  filters,
}: {
  kind: BusinessKind;
  item: EnquiryInboxItem;
  filters: InboxFilters;
}) {
  const t = useTranslations('service.enquiries');
  const ago = useReceivedAgo();
  const dateTime = useIstDateTime();
  const preferredDate = usePreferredDate();
  // Rendered only after the client read, so one clock per render is enough.
  const [now] = useState(() => Date.now());
  return (
    <Link
      href={enquiryHref(kind, item.id, filters)}
      className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-surface p-4 text-text shadow-1 transition-colors duration-2 ease-standard hover:bg-surface-2 focus-visible:ring-focus motion-reduce:transition-none"
    >
      <InitialAvatar name={item.name} />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="font-semibold [overflow-wrap:anywhere]">
          {item.name}
        </span>
        <span className="text-small text-text-2 [overflow-wrap:anywhere]">
          {preview(item.message)}
        </span>
        <span className="text-caption text-muted [overflow-wrap:anywhere]">
          <time dateTime={item.createdAt} title={dateTime(item.createdAt)}>
            {ago(item.createdAt, now)}
          </time>
          {' · '}
          {t('preferred', {
            date: item.preferredDate
              ? preferredDate(item.preferredDate)
              : t('anyDate'),
          })}
        </span>
      </span>
      <EnquiryStatusBadge status={item.status} />
    </Link>
  );
}

function InboxSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className="grid gap-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((row) => (
        <Card key={row} padded aria-hidden="true" className="flex gap-3">
          <div className="size-avatar-mini shrink-0 rounded-pill skeleton-fill animate-skeleton motion-reduce:animate-none" />
          <div className="grid min-w-0 flex-1 gap-2">
            <div className="h-4 w-1/3 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none" />
            <div className="h-3 w-5/6 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none" />
            <div className="h-3 w-1/2 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none" />
          </div>
        </Card>
      ))}
    </div>
  );
}
