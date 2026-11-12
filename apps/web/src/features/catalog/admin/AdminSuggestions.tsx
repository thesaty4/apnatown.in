'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import {
  DecideSuggestionSchema,
  SUGGESTION_STATUSES,
  SuggestionStatusSchema,
  type AdminCategoryTree,
  type AdminSuggestionPage,
  type SuggestionStatus,
} from '@apnatown/shared/catalog';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Pill } from '@apnatown/ui/primitives/Pill';
import { Select } from '@apnatown/ui/primitives/Select';
import { Card } from '@apnatown/ui/cards/Card';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { failureCode } from '../../../shared/api/result';
import { AdminFailure, Notice, isDenied, useAdmin } from '../../admin';
import { decideSuggestion, type DecideSuggestionBody } from '../api';
import {
  adminSuggestionsOptions,
  adminTreeOptions,
  useCatalogCommand,
} from '../queries';
import { SuggestionStatusBadge } from '../status';
import { CommandError, SheetFooter, useReadState } from './common';

type Item = AdminSuggestionPage['items'][number];
type Action = 'approve' | 'reject' | 'merge';
type Tree = AdminCategoryTree['items'];

/**
 * S-ADMN-06 Subcategory suggestions: scoped queue (status in the URL) with an
 * approve / reject / merge decision sheet for `catalog:edit`.
 */
export function AdminSuggestions() {
  const context = useAdmin();
  const { me } = context;
  const t = useTranslations('catalog.admin.suggestions');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [navigating, startTransition] = useTransition();
  const parsed = SuggestionStatusSchema.safeParse(params.get('status'));
  const status: SuggestionStatus = parsed.success ? parsed.data : 'pending';
  const canDecide = me.isSuper || me.permissions.catalog.includes('edit');
  const query = useInfiniteQuery(adminSuggestionsOptions(context, status));
  const tree = useQuery(adminTreeOptions(context));
  const [deciding, setDeciding] = useState<{ item: Item; action: Action }>();
  const [notice, setNotice] = useState<string>();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const code = query.isError ? failureCode(query.error) : undefined;
  const state = useReadState(query, items.length === 0, {
    title: t('emptyTitle'),
    message: t('emptyMessage'),
  });

  function setStatus(next: SuggestionStatus) {
    const search = new URLSearchParams(params.toString());
    if (next === 'pending') search.delete('status');
    else search.set('status', next);
    const value = search.toString();
    setNotice(undefined);
    startTransition(() =>
      router.push(value ? `${pathname}?${value}` : pathname, { scroll: false }),
    );
  }

  return (
    <div className="grid gap-stack-gap">
      <h1 className="text-h1">{t('title')}</h1>
      <p className="text-text-2 [overflow-wrap:anywhere]">{t('intro')}</p>
      <div
        role="group"
        aria-label={t('statusLabel')}
        aria-busy={navigating}
        className="flex flex-wrap gap-2"
      >
        {SUGGESTION_STATUSES.map((value) => (
          <Pill
            key={value}
            label={t(`filter.${value}`)}
            selected={status === value}
            onClick={() => setStatus(value)}
          />
        ))}
      </div>
      <Notice message={notice} />
      {code && items.length > 0 && !isDenied(code) && (
        <AdminFailure
          code={code}
          retry={() => void query.refetch()}
          busy={query.isFetching}
        />
      )}
      {state ?? (
        <>
          <ul className="m-0 grid list-none gap-3 p-0">
            {items.map((item) => (
              <li key={item.id}>
                <SuggestionCard
                  item={item}
                  tree={tree.data?.items ?? []}
                  canDecide={canDecide}
                  onDecide={(action) => {
                    setNotice(undefined);
                    setDeciding({ item, action });
                  }}
                />
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <Button
              variant="outline"
              className="justify-self-center"
              loading={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t('loadMore')}
            </Button>
          )}
        </>
      )}
      {deciding && (
        <DecisionSheet
          item={deciding.item}
          initialAction={deciding.action}
          tree={tree.data?.items ?? []}
          onClose={() => setDeciding(undefined)}
          onDone={(action) => {
            setDeciding(undefined);
            setNotice(t(`done.${action}`));
          }}
        />
      )}
    </div>
  );
}

function useNames(tree: Tree) {
  const locale = useLocale();
  return useMemo(() => {
    const pick = (item: { nameEn: string; nameHi: string }) =>
      locale === 'hi' ? item.nameHi : item.nameEn;
    const categories = new Map<string, string>();
    const subcategories = new Map<string, string>();
    for (const node of tree) {
      categories.set(node.id, pick(node));
      for (const sub of node.subcategories)
        subcategories.set(sub.id, pick(sub));
    }
    return { categories, subcategories, pick };
  }, [tree, locale]);
}

function SuggestionCard({
  item,
  tree,
  canDecide,
  onDecide,
}: {
  item: Item;
  tree: Tree;
  canDecide: boolean;
  onDecide: (action: Action) => void;
}) {
  const t = useTranslations('catalog.admin.suggestions');
  const format = useFormatter();
  const names = useNames(tree);
  const pending = item.status === 'pending';
  const mergedInto = item.mergedIntoSubcategoryId
    ? names.subcategories.get(item.mergedIntoSubcategoryId)
    : undefined;
  return (
    <Card padded className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid min-w-0 gap-1">
          <h2 className="text-h3 [overflow-wrap:anywhere]" lang="en">
            {item.nameEn}
          </h2>
          <p
            className="text-small text-text-2 [overflow-wrap:anywhere]"
            lang="hi"
          >
            {item.nameHi ?? t('noHindi')}
          </p>
        </div>
        <SuggestionStatusBadge value={item.status} />
      </div>
      <dl className="m-0 grid gap-1 text-small">
        <div className="flex flex-wrap gap-1">
          <dt className="text-text-2">{t('category')}</dt>
          <dd className="m-0">
            {names.categories.get(item.categoryId) ?? '—'}
          </dd>
        </div>
        <div className="flex flex-wrap gap-1">
          <dt className="text-text-2">{t('submitted')}</dt>
          <dd className="m-0">
            {format.dateTime(new Date(item.createdAt), { dateStyle: 'medium' })}
          </dd>
        </div>
        {item.reason && (
          <div className="flex flex-wrap gap-1">
            <dt className="text-text-2">{t('reason')}</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">{item.reason}</dd>
          </div>
        )}
        {item.rejectionReason && (
          <div className="flex flex-wrap gap-1">
            <dt className="text-text-2">{t('rejectionReason')}</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">
              {item.rejectionReason}
            </dd>
          </div>
        )}
        {item.status === 'merged' && (
          <div className="flex flex-wrap gap-1">
            <dt className="text-text-2">{t('mergedInto')}</dt>
            <dd className="m-0">{mergedInto ?? '—'}</dd>
          </div>
        )}
      </dl>
      {pending && item.candidates.length > 0 && (
        <div className="grid gap-1 rounded-md border border-warning bg-warning-soft p-3 text-small">
          <p className="m-0 flex gap-2 font-semibold">
            <span aria-hidden="true">⚠️</span>
            {t('similarTitle')}
          </p>
          <ul className="m-0 grid list-none gap-1 p-0">
            {item.candidates.map((candidate) => (
              <li
                key={candidate.subcategoryId}
                className="[overflow-wrap:anywhere]"
              >
                {names.pick(candidate)}{' '}
                <span className="text-text-2">
                  {t('similarity', {
                    percent: Math.round(candidate.similarity * 100),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pending && canDecide && (
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-w-0 flex-1"
            onClick={() => onDecide('approve')}
          >
            {t('approve')}
          </Button>
          <Button
            variant="outline"
            className="min-w-0 flex-1"
            onClick={() => onDecide('merge')}
          >
            {t('merge')}
          </Button>
          <Button
            variant="ghost"
            className="min-w-0 flex-1"
            onClick={() => onDecide('reject')}
          >
            {t('reject')}
          </Button>
        </div>
      )}
    </Card>
  );
}

function DecisionSheet({
  item,
  initialAction,
  tree,
  onClose,
  onDone,
}: {
  item: Item;
  initialAction: Action;
  tree: Tree;
  onClose: () => void;
  onDone: (action: Action) => void;
}) {
  const t = useTranslations('catalog.admin.suggestions');
  const names = useNames(tree);
  const command = useCatalogCommand(decideSuggestion);
  const [action, setAction] = useState<Action>(initialAction);
  const [nameHi, setNameHi] = useState('');
  const [reason, setReason] = useState('');
  const siblings =
    tree
      .find((node) => node.id === item.categoryId)
      ?.subcategories.filter((sub) => sub.active) ?? [];
  const [target, setTarget] = useState(
    () =>
      item.candidates.find((candidate) =>
        siblings.some((sub) => sub.id === candidate.subcategoryId),
      )?.subcategoryId ?? '',
  );
  const [checked, setChecked] = useState(false);
  const decision =
    action === 'approve'
      ? {
          action,
          expectedVersion: item.version,
          ...(item.nameHi === null ? { approvalNameHi: nameHi.trim() } : {}),
        }
      : action === 'reject'
        ? { action, expectedVersion: item.version, reason: reason.trim() }
        : {
            action,
            expectedVersion: item.version,
            targetSubcategoryId: target,
          };
  const parsed = DecideSuggestionSchema.safeParse(decision);
  const invalid = new Set<string>(command.fields);
  if (checked && !parsed.success)
    for (const issue of parsed.error.issues) invalid.add(String(issue.path[0]));

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!parsed.success) return;
    command.submit(
      { id: item.id, decision: parsed.data as DecideSuggestionBody },
      () => onDone(action),
    );
  }

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && !command.busy && onClose()}
      title={t(`sheet.${action}`)}
      description={t('sheetFor', { name: item.nameEn })}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <SheetFooter
          form="suggestion-decision"
          busy={command.busy}
          onCancel={onClose}
          submitLabel={t(action)}
        />
      }
    >
      <form
        id="suggestion-decision"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        <div
          role="group"
          aria-label={t('decision')}
          className="flex flex-wrap gap-2"
        >
          {(['approve', 'merge', 'reject'] as const).map((value) => (
            <Pill
              key={value}
              label={t(value)}
              selected={action === value}
              onClick={() => {
                setChecked(false);
                setAction(value);
              }}
            />
          ))}
        </div>
        {action === 'approve' &&
          (item.nameHi === null ? (
            <Input
              label={t('approvalNameHi')}
              hint={t('approvalNameHiHint')}
              required
              lang="hi"
              maxLength={60}
              value={nameHi}
              error={
                invalid.has('approvalNameHi') ? t('nameInvalid') : undefined
              }
              onChange={(event) => setNameHi(event.target.value)}
            />
          ) : (
            <p className="text-text-2 [overflow-wrap:anywhere]">
              {t('approveHelp', { name: item.nameEn })}
            </p>
          ))}
        {action === 'reject' && (
          <TextArea
            label={t('rejectReason')}
            hint={t('rejectReasonHint')}
            required
            maxLength={500}
            rows={4}
            value={reason}
            error={invalid.has('reason') ? t('reasonInvalid') : undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
        {action === 'merge' &&
          (siblings.length === 0 ? (
            <p className="text-text-2">{t('noMergeTargets')}</p>
          ) : (
            <Select
              label={t('mergeTarget')}
              hint={t('mergeHint')}
              required
              value={target}
              error={
                invalid.has('targetSubcategoryId')
                  ? t('mergeInvalid')
                  : undefined
              }
              options={[
                { value: '', label: t('choose') },
                ...siblings.map((sub) => ({
                  value: sub.id,
                  label: names.pick(sub),
                })),
              ]}
              onChange={(event) => setTarget(event.target.value)}
            />
          ))}
        <CommandError code={command.code} />
      </form>
    </Sheet>
  );
}
