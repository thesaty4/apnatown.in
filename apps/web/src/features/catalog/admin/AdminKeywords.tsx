'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  CreateKeywordMappingSchema,
  KEYWORD_SYNONYM_LIMIT,
  KEYWORD_TARGET_LIMIT,
  UpdateKeywordMappingSchema,
  type AdminCategoryTree,
  type KeywordMapping,
  type KeywordTargetInput,
} from '@apnatown/shared/catalog';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { Card } from '@apnatown/ui/cards/Card';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { failureCode } from '../../../shared/api/result';
import { AdminFailure, Notice, isDenied, useAdmin } from '../../admin';
import {
  createKeywordMapping,
  deleteKeywordMapping,
  updateKeywordMapping,
} from '../api';
import {
  adminTreeOptions,
  keywordsOptions,
  useCatalogCommand,
} from '../queries';
import {
  CommandError,
  ReadOnlyNotice,
  SheetFooter,
  useReadState,
} from './common';

type Tree = AdminCategoryTree['items'];

/** Split a free-text list on commas/new lines; trims and de-duplicates. */
const splitTerms = (value: string) => [
  ...new Set(
    value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean),
  ),
];

function useTargetNames(tree: Tree) {
  const locale = useLocale();
  return useMemo(() => {
    const pick = (item: { nameEn: string; nameHi: string }) =>
      locale === 'hi' ? item.nameHi : item.nameEn;
    const names = new Map<string, string>();
    for (const node of tree) {
      names.set(node.id, pick(node));
      for (const sub of node.subcategories)
        names.set(sub.id, `${pick(node)} › ${pick(sub)}`);
    }
    return { names, pick };
  }, [tree, locale]);
}

/**
 * S-ADMN-15 Search keywords: list for `catalog:view`; create/edit/delete are
 * Super Admin only (Q-39). Keyword preview depends on Search (not built).
 */
export function AdminKeywords() {
  const context = useAdmin();
  const t = useTranslations('catalog.admin.keywords');
  const isSuper = context.me.isSuper;
  const query = useInfiniteQuery(keywordsOptions(context));
  const tree = useQuery(adminTreeOptions(context));
  const [editing, setEditing] = useState<{ mapping?: KeywordMapping }>();
  const [deleting, setDeleting] = useState<KeywordMapping>();
  const [notice, setNotice] = useState<string>();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const code = query.isError ? failureCode(query.error) : undefined;
  const { names } = useTargetNames(tree.data?.items ?? []);
  const add = isSuper && (
    <Button
      onClick={() => {
        setNotice(undefined);
        setEditing({});
      }}
    >
      <span aria-hidden="true">＋</span>
      {t('add')}
    </Button>
  );
  const state = useReadState(query, items.length === 0, {
    title: t('emptyTitle'),
    message: t('emptyMessage'),
    action: add,
  });

  return (
    <div className="grid gap-stack-gap">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-h1">{t('title')}</h1>
        {items.length > 0 && add}
      </div>
      <p className="text-text-2 [overflow-wrap:anywhere]">{t('intro')}</p>
      {!isSuper && <ReadOnlyNotice message={t('readOnly')} />}
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
          <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
            {items.map((mapping) => (
              <li key={mapping.id} className="min-w-0">
                <Card padded className="grid h-full gap-3">
                  <h2 className="text-h3 [overflow-wrap:anywhere]">
                    {mapping.canonicalTerm}
                  </h2>
                  <div className="grid gap-1">
                    <h3 className="text-small text-text-2">{t('synonyms')}</h3>
                    {mapping.synonyms.length === 0 ? (
                      <p className="text-small text-text-2">
                        {t('noSynonyms')}
                      </p>
                    ) : (
                      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                        {mapping.synonyms.map((synonym) => (
                          <li key={synonym}>
                            <Badge tone="neutral" icon="🔤" label={synonym} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-small text-text-2">{t('targets')}</h3>
                    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                      {mapping.targets.map((target) => {
                        const [key, icon, label] =
                          target.kind === 'category'
                            ? [
                                target.categoryId,
                                '🏷️',
                                names.get(target.categoryId),
                              ]
                            : target.kind === 'subcategory'
                              ? [
                                  target.subcategoryId,
                                  '📂',
                                  names.get(target.subcategoryId),
                                ]
                              : [
                                  `tag:${target.productTag}`,
                                  '#',
                                  target.productTag,
                                ];
                        return (
                          <li key={key}>
                            <Badge
                              tone="info"
                              icon={icon}
                              label={t(
                                target.kind === 'product_tag'
                                  ? 'target.productTag'
                                  : `target.${target.kind}`,
                                {
                                  name: label ?? '—',
                                },
                              )}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {isSuper && (
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="min-w-0 flex-1"
                        aria-label={t('editNamed', {
                          term: mapping.canonicalTerm,
                        })}
                        onClick={() => {
                          setNotice(undefined);
                          setEditing({ mapping });
                        }}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-w-0 flex-1"
                        aria-label={t('deleteNamed', {
                          term: mapping.canonicalTerm,
                        })}
                        onClick={() => {
                          setNotice(undefined);
                          setDeleting(mapping);
                        }}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  )}
                </Card>
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
      {editing && (
        <KeywordSheet
          mapping={
            editing.mapping &&
            (items.find((item) => item.id === editing.mapping?.id) ??
              editing.mapping)
          }
          tree={tree.data?.items ?? []}
          treeFailed={tree.isError}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setNotice(t('saved'));
          }}
        />
      )}
      {deleting && (
        <DeleteDialog
          mapping={deleting}
          onClose={() => setDeleting(undefined)}
          onDone={() => {
            setDeleting(undefined);
            setNotice(t('deleted'));
          }}
        />
      )}
    </div>
  );
}

function DeleteDialog({
  mapping,
  onClose,
  onDone,
}: {
  mapping: KeywordMapping;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('catalog.admin.keywords');
  const command = useCatalogCommand(deleteKeywordMapping);
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && !command.busy && onClose()}
      title={t('deleteTitle')}
      impact={t('deleteImpact', { term: mapping.canonicalTerm })}
      cancelLabel={t('cancel')}
      confirmLabel={t('delete')}
      tone="danger"
      busy={command.busy}
      onConfirm={() =>
        command.submit(
          { mappingId: mapping.id, expectedVersion: mapping.version },
          onDone,
        )
      }
    >
      <CommandError code={command.code} />
    </ConfirmDialog>
  );
}

const targetKey = (target: KeywordTargetInput) =>
  target.kind === 'category'
    ? `c:${target.categoryId}`
    : target.kind === 'subcategory'
      ? `s:${target.subcategoryId}`
      : `t:${target.productTag}`;

function KeywordSheet({
  mapping,
  tree,
  treeFailed,
  onClose,
  onSaved,
}: {
  mapping?: KeywordMapping | undefined;
  tree: Tree;
  treeFailed: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('catalog.admin.keywords');
  const { pick } = useTargetNames(tree);
  const [term, setTerm] = useState(mapping?.canonicalTerm ?? '');
  const [synonymText, setSynonymText] = useState(
    mapping?.synonyms.join(', ') ?? '',
  );
  const [tagText, setTagText] = useState(
    mapping?.targets
      .flatMap((target) =>
        target.kind === 'product_tag' ? [target.productTag] : [],
      )
      .join(', ') ?? '',
  );
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        (mapping?.targets ?? [])
          .filter((target) => target.kind !== 'product_tag')
          .map(targetKey),
      ),
  );
  const [checked, setChecked] = useState(false);
  const create = useCatalogCommand(createKeywordMapping);
  const update = useCatalogCommand(updateKeywordMapping);
  const command = mapping ? update : create;

  const synonyms = splitTerms(synonymText);
  const targets: KeywordTargetInput[] = [
    ...[...selected].map((key): KeywordTargetInput => {
      const id = key.slice(2);
      return key.startsWith('c:')
        ? { kind: 'category', categoryId: id }
        : { kind: 'subcategory', subcategoryId: id };
    }),
    ...splitTerms(tagText).map((productTag): KeywordTargetInput => ({
      kind: 'product_tag',
      productTag,
    })),
  ];
  const body = { canonicalTerm: term.trim(), synonyms, targets };
  const parsed = mapping
    ? UpdateKeywordMappingSchema.safeParse({
        ...body,
        expectedVersion: mapping.version,
      })
    : CreateKeywordMappingSchema.safeParse(body);
  const invalid = new Set<string>(command.fields);
  if (checked && !parsed.success)
    for (const issue of parsed.error.issues) invalid.add(String(issue.path[0]));

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!parsed.success) return;
    if (mapping)
      update.submit(
        {
          mappingId: mapping.id,
          patch: { ...body, expectedVersion: mapping.version },
        },
        onSaved,
      );
    else create.submit(body, onSaved);
  }

  const toggle = (key: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  return (
    <Sheet
      open
      wide
      onOpenChange={(next) => !next && !command.busy && onClose()}
      title={t(mapping ? 'editTitle' : 'createTitle')}
      description={t('intro')}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <SheetFooter
          form="keyword-mapping"
          busy={command.busy}
          onCancel={onClose}
          submitLabel={t('save')}
        />
      }
    >
      <form
        id="keyword-mapping"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        <Input
          label={t('term')}
          hint={t('termHint')}
          required
          maxLength={60}
          value={term}
          error={invalid.has('canonicalTerm') ? t('termInvalid') : undefined}
          onChange={(event) => setTerm(event.target.value)}
        />
        <TextArea
          label={t('synonyms')}
          hint={t('synonymsHint', { max: KEYWORD_SYNONYM_LIMIT })}
          rows={3}
          value={synonymText}
          error={
            invalid.has('synonyms')
              ? t('synonymsInvalid', { max: KEYWORD_SYNONYM_LIMIT })
              : undefined
          }
          onChange={(event) => setSynonymText(event.target.value)}
        />
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-field-label font-semibold">
            {t('targets')}
          </legend>
          <p className="text-small text-text-2">
            {t('targetsHint', {
              max: KEYWORD_TARGET_LIMIT,
              count: targets.length,
            })}
          </p>
          {treeFailed && (
            <p role="alert" className="text-field-error text-error">
              {t('treeFailed')}
            </p>
          )}
          {(['product', 'service'] as const).map((kind) => {
            const nodes = tree.filter((node) => node.kind === kind);
            if (nodes.length === 0) return null;
            return (
              <div key={kind} className="grid gap-2">
                <h3 className="text-small font-semibold">
                  {t(
                    kind === 'product' ? 'shopCategories' : 'serviceCategories',
                  )}
                </h3>
                {nodes.map((node) => (
                  <div key={node.id} className="grid gap-1">
                    <Checkbox
                      label={pick(node)}
                      checked={selected.has(`c:${node.id}`)}
                      onChange={(event) =>
                        toggle(`c:${node.id}`, event.target.checked)
                      }
                    />
                    {node.subcategories.length > 0 && (
                      <div className="grid gap-1 ps-6">
                        {node.subcategories.map((sub) => (
                          <Checkbox
                            key={sub.id}
                            label={pick(sub)}
                            checked={selected.has(`s:${sub.id}`)}
                            onChange={(event) =>
                              toggle(`s:${sub.id}`, event.target.checked)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
          <Input
            label={t('tags')}
            hint={t('tagsHint')}
            value={tagText}
            onChange={(event) => setTagText(event.target.value)}
          />
          {invalid.has('targets') && (
            <p role="alert" className="text-field-error text-error">
              {t('targetsInvalid', { max: KEYWORD_TARGET_LIMIT })}
            </p>
          )}
        </fieldset>
        <CommandError code={command.code} />
      </form>
    </Sheet>
  );
}
