'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  HydrationBoundary,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type DehydratedState,
} from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import type { AuditEntrySummary } from '@apnatown/shared/admin';
import { AdminCollapsibleCard } from '@apnatown/ui/admin/AdminCollapsibleCard';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { useSession } from '../../../shared/auth/SessionProvider';
import { failureCode } from '../../../shared/api/result';
import { queryKeys } from '../../../shared/api/query-keys';
import { useAdmin } from '../AdminShell';
import { AdminFailure, Alert, Notice, adminErrorKey, isDenied } from '../parts';
import { AuditDiff } from './AuditDiff';
import {
  AuditFilterChips,
  AuditFilterControls,
  AuditScopeNote,
  type FilterPatch,
} from './AuditFilters';
import {
  hasAuditFilters,
  readAuditFilters,
  roleKey,
  type AuditFilters,
  type AuditSection,
} from './filters';
import {
  auditEntryOptions,
  auditListOptions,
  useActivityExport,
} from './queries';

/** Hydrates the server-read first page only for the account and session
 * revision that rendered it; a late payload never fills a newer identity. */
export function AuditScreen({
  section,
  initial,
  owner,
}: {
  section: AuditSection;
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const { state, epoch } = useSession();
  const current =
    state.kind === 'ready' && state.data.userId === owner && epoch === 0;
  return (
    <HydrationBoundary state={current ? initial : undefined}>
      <AuditList section={section} />
    </HydrationBoundary>
  );
}

/** S-ADMN-16 Audit log and S-SUPR-08 Activity monitor. */
function AuditList({ section }: { section: AuditSection }) {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.audit');
  const ts = useTranslations('superAdmin.activity');
  const te = useTranslations('admin.errors');
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramString = params.toString();
  const filters = useMemo(() => {
    const search = new URLSearchParams(paramString);
    return readAuditFilters((name) => search.get(name), section);
  }, [paramString, section]);
  const filtered = hasAuditFilters(filters);
  const permitted =
    me.isSuper ||
    (section === 'audit' && me.permissions.reports.includes('view'));
  const [navigating, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  function navigate(next: URLSearchParams) {
    const query = next.toString();
    startTransition(() =>
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      }),
    );
  }
  function setFilters(patch: FilterPatch) {
    const next = new URLSearchParams(paramString);
    for (const [name, value] of Object.entries(patch))
      if (value) next.set(name, value);
      else next.delete(name);
    navigate(next);
  }

  // Search text is local while typing and committed to the URL after 300 ms.
  // Back/Forward (a URL change we did not push) restores the box.
  const urlQ = filters.q ?? '';
  const [text, setText] = useState(urlQ);
  const [syncedQ, setSyncedQ] = useState(urlQ);
  const pushed = useRef(urlQ);
  if (urlQ !== syncedQ) {
    setSyncedQ(urlQ);
    if (urlQ !== pushed.current) setText(urlQ);
  }
  useEffect(() => {
    const q = text.trim().slice(0, 100);
    if (q === urlQ) return;
    const timer = window.setTimeout(() => {
      pushed.current = q;
      setFilters({ q });
    }, 300);
    return () => window.clearTimeout(timer);
    // setFilters reads the current paramString, which is a dependency.
  }, [text, urlQ, paramString]);
  const clearAll = () => {
    pushed.current = '';
    setText('');
    navigate(new URLSearchParams());
  };

  const list = useInfiniteQuery({
    ...auditListOptions(context, section, filters),
    enabled: permitted,
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const code = list.isError ? failureCode(list.error) : undefined;
  const denied = code !== undefined && isDenied(code);
  const pageError = list.isFetchNextPageError && !denied;
  useEffect(() => {
    // A denial means authority changed: re-read /admin/me, which gates the shell.
    if (denied) recheck();
  }, [denied, recheck]);
  const { userId, epoch } = scope;
  useEffect(() => {
    // Revoked access: drop every cached page and diff for this section.
    if (!permitted || denied)
      client.removeQueries({ queryKey: queryKeys.audit(scope, section) });
    // scope is stable per userId/epoch.
  }, [permitted, denied, client, userId, epoch, section]);

  const actorLabel = filters.actorId
    ? items.find((item) => item.actorUserId === filters.actorId)?.actorLabel
    : undefined;
  const controls = (
    <AuditFilterControls
      section={section}
      filters={filters}
      onChange={setFilters}
    />
  );

  let body;
  if (!permitted || denied)
    body = (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={code ? te(adminErrorKey(code)) : t('noPermission')}
        action={<Button onClick={recheck}>{t('checkAgain')}</Button>}
      />
    );
  else if (list.isPending) body = <Skeleton label={t('loading')} />;
  else if (code && !pageError)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={te(adminErrorKey(code))}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              disabled={list.isFetching}
              onClick={() => void list.refetch()}
            >
              {t('retry')}
            </Button>
            {filtered && (
              <Button variant="outline" onClick={clearAll}>
                {t('clearFilters')}
              </Button>
            )}
          </div>
        }
      />
    );
  else if (items.length === 0)
    body = filtered ? (
      <EmptyState
        title={t('noMatchTitle')}
        message={t('noMatchMessage')}
        action={<Button onClick={clearAll}>{t('clearFilters')}</Button>}
      />
    ) : (
      <EmptyState
        title={section === 'activity' ? ts('emptyTitle') : t('emptyTitle')}
        message={
          section === 'activity' ? ts('emptyMessage') : t('emptyMessage')
        }
        action={null}
      />
    );
  else
    body = (
      <div
        className="grid gap-3"
        aria-busy={navigating || (list.isFetching && !list.isFetchingNextPage)}
      >
        <p role="status" className="text-small text-text-2">
          {t('shown', { count: items.length })}
        </p>
        <ul className="m-0 grid list-none gap-3 p-0">
          {items.map((entry) => (
            <li key={entry.id}>
              <AuditRow
                section={section}
                entry={entry}
                filters={filters}
                onFilter={setFilters}
              />
            </li>
          ))}
        </ul>
        {pageError && (
          <AdminFailure
            code={code ?? 'REQUEST_FAILED'}
            busy={list.isFetchingNextPage}
            retry={() => void list.fetchNextPage()}
          />
        )}
        {list.hasNextPage && !pageError && (
          <Button
            variant="outline"
            className="justify-self-start"
            loading={list.isFetchingNextPage}
            onClick={() => void list.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        )}
      </div>
    );

  return (
    <div className="grid min-w-0 gap-stack-gap">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-h1 [overflow-wrap:anywhere]">
          {section === 'activity' ? ts('title') : t('title')}
        </h1>
        {section === 'activity' && permitted && (
          <ExportButton filters={filters} />
        )}
      </div>
      {section === 'audit' && permitted && <AuditScopeNote />}
      {permitted && (
        <>
          <Input
            type="search"
            label={
              section === 'activity' ? ts('searchLabel') : t('searchLabel')
            }
            placeholder={section === 'activity' ? ts('search') : t('search')}
            value={text}
            maxLength={100}
            autoComplete="off"
            onChange={(event) => setText(event.target.value)}
          />
          <div
            className={`hidden gap-3 desktop:grid ${section === 'activity' ? 'desktop:grid-cols-5' : 'desktop:grid-cols-4'}`}
          >
            {controls}
          </div>
          <div className="desktop:hidden">
            <Button variant="outline" onClick={() => setFiltersOpen(true)}>
              {t('filters')}
            </Button>
            <Sheet
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              title={t('filters')}
              closeLabel={t('close')}
              footer={
                <Button
                  className="w-full"
                  onClick={() => setFiltersOpen(false)}
                >
                  {t('show')}
                </Button>
              }
            >
              <div className="grid gap-3">{controls}</div>
            </Sheet>
          </div>
          <AuditFilterChips
            filters={filters}
            actorLabel={actorLabel}
            onRemove={setFilters}
            onClearAll={clearAll}
          />
        </>
      )}
      {body}
    </div>
  );
}

/** S-SUPR-08 Export: same validated filters as the list, no cursor. */
function ExportButton({ filters }: { filters: AuditFilters }) {
  const context = useAdmin();
  const ts = useTranslations('superAdmin.activity');
  const exporter = useActivityExport(context);
  const [notice, setNotice] = useState<string>();
  const code = exporter.isError ? failureCode(exporter.error) : undefined;
  const { recheck } = context;
  useEffect(() => {
    if (code && isDenied(code)) recheck();
  }, [code, recheck]);
  return (
    <div className="grid min-w-0 justify-items-end gap-2">
      <Button
        variant="ghost"
        loading={exporter.isPending}
        onClick={() => {
          setNotice(ts('exportStarted'));
          void exporter.run(filters, () => setNotice(ts('exportDone')));
        }}
      >
        <span aria-hidden="true">⤓</span>
        {exporter.isPending ? ts('exporting') : ts('export')}
      </Button>
      {code ? <AdminFailure code={code} /> : <Notice message={notice} />}
    </div>
  );
}

function AuditRow({
  section,
  entry,
  filters,
  onFilter,
}: {
  section: AuditSection;
  entry: AuditEntrySummary;
  filters: AuditFilters;
  onFilter: (patch: FilterPatch) => void;
}) {
  const t = useTranslations('admin.audit');
  const format = useFormatter();
  const time = format.dateTime(new Date(entry.occurredAt), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
  const actor = t('actor', {
    actor: entry.actorLabel,
    role: t(roleKey(entry.actorRole)),
  });
  const title = entry.summary || entry.action;
  return (
    <AdminCollapsibleCard
      title={title}
      subtitle={`${actor} · ${time}`}
      toggleLabel={t('toggle', { entry: title })}
      badges={
        <>
          <Badge label={entry.action} />
          <Badge label={t('entity', { entity: entry.entityType })} />
        </>
      }
    >
      <dl className="grid gap-2 text-small desktop:grid-cols-3">
        <div className="grid gap-1">
          <dt className="font-semibold text-text-2">{t('when')}</dt>
          <dd className="m-0">
            <time dateTime={entry.occurredAt}>{time}</time>
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-text-2">{t('who')}</dt>
          <dd className="m-0 [overflow-wrap:anywhere]">{actor}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-text-2">{t('detail')}</dt>
          <dd className="m-0 [overflow-wrap:anywhere]">
            <code dir="ltr">{entry.action}</code>
            {' · '}
            <code dir="ltr">
              {entry.entityId
                ? `${entry.entityType}:${entry.entityId}`
                : entry.entityType}
            </code>
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        {filters.action !== entry.action && (
          <Button
            variant="secondary"
            onClick={() => onFilter({ action: entry.action })}
          >
            {t('onlyAction')}
          </Button>
        )}
        {filters.entityType !== entry.entityType && (
          <Button
            variant="secondary"
            onClick={() => onFilter({ entityType: entry.entityType })}
          >
            {t('onlyEntity')}
          </Button>
        )}
        {entry.actorUserId && filters.actorId !== entry.actorUserId && (
          <Button
            variant="secondary"
            onClick={() => onFilter({ actorId: entry.actorUserId ?? '' })}
          >
            {t('onlyActor')}
          </Button>
        )}
      </div>
      {entry.hasDiff ? (
        <EntryDiff section={section} id={entry.id} />
      ) : (
        <p className="text-text-2">{t('noDiff')}</p>
      )}
    </AdminCollapsibleCard>
  );
}

/** Mounted only while expanded: the diff is read on demand and dropped on
 * collapse (gcTime 0). Not found / denied never shows an older copy. */
function EntryDiff({ section, id }: { section: AuditSection; id: string }) {
  const context = useAdmin();
  const t = useTranslations('admin.audit');
  const te = useTranslations('admin.errors');
  const client = useQueryClient();
  const options = auditEntryOptions(context, section, id);
  const query = useQuery(options);
  const code = query.isError ? failureCode(query.error) : undefined;
  const { recheck } = context;
  const { queryKey } = options;
  useEffect(() => {
    if (!code) return;
    if (code === 'AUDIT_NOT_FOUND' || isDenied(code))
      client.removeQueries({ queryKey, exact: true });
    if (isDenied(code)) recheck();
    // queryKey is derived from stable scope/section/id values.
  }, [code, client, recheck, section, id]);
  if (query.isPending) return <Skeleton label={t('loadingDiff')} />;
  if (code === 'AUDIT_NOT_FOUND' || (code && isDenied(code)))
    return <Alert message={te(adminErrorKey(code))} />;
  if (code)
    return (
      <AdminFailure
        code={code}
        busy={query.isFetching}
        retry={() => void query.refetch()}
      />
    );
  if (!query.data) return null;
  return (
    <section aria-label={t('diffCaption')} className="grid gap-2">
      <AuditDiff before={query.data.before} after={query.data.after} />
    </section>
  );
}
