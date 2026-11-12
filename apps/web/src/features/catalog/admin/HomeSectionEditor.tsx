'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  CreateHomeSectionSchema,
  UpdateHomeSectionSchema,
  type AdminCategory,
  type AdminHomeSection,
  type CategoryKind,
  type HomeSectionKind,
} from '@apnatown/shared/catalog';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { Checkbox, Radio } from '@apnatown/ui/primitives/Selection';
import { Card } from '@apnatown/ui/cards/Card';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { failureCode } from '../../../shared/api/result';
import { AdminFailure, Notice, isDenied, useAdmin } from '../../admin';
import {
  createHomeSection,
  removeHomeSection,
  setHomeSectionStatus,
  updateHomeSection,
} from '../api';
import { homeSectionsOptions, useCatalogCommand } from '../queries';
import { ActiveBadge, CommandError, SheetFooter, useReadState } from './common';

type Named = Pick<
  AdminCategory,
  'id' | 'nameEn' | 'nameHi' | 'kind' | 'active'
>;

/**
 * Super-admin Home section management (dedicated category or curated pills):
 * create (inactive draft), edit EN/HI together, reorder, activate/deactivate
 * and remove. Products and services never mix within one section.
 */
export function HomeSectionEditor({ tree }: { tree: readonly Named[] }) {
  const context = useAdmin();
  const t = useTranslations('catalog.admin.sections');
  const locale = useLocale();
  const query = useQuery(homeSectionsOptions(context));
  const [editing, setEditing] = useState<{ section?: AdminHomeSection }>();
  const [removing, setRemoving] = useState<AdminHomeSection>();
  const [notice, setNotice] = useState<string>();
  const sections = [...(query.data?.items ?? [])].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  );
  const code = query.isError ? failureCode(query.error) : undefined;
  const create = () => {
    setNotice(undefined);
    setEditing({});
  };
  const state = useReadState(query, sections.length === 0, {
    title: t('emptyTitle'),
    message: t('emptyMessage'),
    action: <Button onClick={create}>{t('add')}</Button>,
  });
  const byId = new Map(tree.map((item) => [item.id, item]));
  const categoryName = (id: string | null) => {
    const item = id ? byId.get(id) : undefined;
    return item ? (locale === 'hi' ? item.nameHi : item.nameEn) : '—';
  };
  const title = (section: AdminHomeSection) =>
    section.kind === 'single_category'
      ? categoryName(section.categoryId)
      : ((locale === 'hi' ? section.headingHi : section.headingEn) ?? '—');

  return (
    <section aria-labelledby="home-sections" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="home-sections" className="text-h2">
          {t('title')}
        </h2>
        {sections.length > 0 && <Button onClick={create}>{t('add')}</Button>}
      </div>
      <p className="text-small text-text-2 [overflow-wrap:anywhere]">
        {t('intro')}
      </p>
      <Notice message={notice} />
      {code && sections.length > 0 && !isDenied(code) && (
        <AdminFailure
          code={code}
          retry={() => void query.refetch()}
          busy={query.isFetching}
        />
      )}
      {state ?? (
        <ol className="m-0 grid list-none gap-3 p-0">
          {sections.map((section, index) => (
            <li key={section.id}>
              <SectionCard
                section={section}
                title={title(section)}
                previous={sections[index - 1]}
                next={sections[index + 1]}
                categoryName={categoryName}
                onEdit={() => {
                  setNotice(undefined);
                  setEditing({ section });
                }}
                onRemove={() => {
                  setNotice(undefined);
                  setRemoving(section);
                }}
                onDone={setNotice}
              />
            </li>
          ))}
        </ol>
      )}
      {editing && (
        <SectionSheet
          tree={tree}
          section={
            editing.section &&
            (sections.find((item) => item.id === editing.section?.id) ??
              editing.section)
          }
          nextPosition={
            sections.length ? (sections.at(-1)?.position ?? 0) + 10 : 0
          }
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setNotice(t(editing.section ? 'saved' : 'created'));
          }}
        />
      )}
      {removing && (
        <RemoveDialog
          section={sections.find((item) => item.id === removing.id) ?? removing}
          title={title(removing)}
          onClose={() => setRemoving(undefined)}
          onDone={() => {
            setRemoving(undefined);
            setNotice(t('removed'));
          }}
        />
      )}
    </section>
  );
}

function SectionCard({
  section,
  title,
  previous,
  next,
  categoryName,
  onEdit,
  onRemove,
  onDone,
}: {
  section: AdminHomeSection;
  title: string;
  previous: AdminHomeSection | undefined;
  next: AdminHomeSection | undefined;
  categoryName: (id: string | null) => string;
  onEdit: () => void;
  onRemove: () => void;
  onDone: (message: string) => void;
}) {
  const t = useTranslations('catalog.admin.sections');
  const status = useCatalogCommand(setHomeSectionStatus);
  const moveSelf = useCatalogCommand(updateHomeSection);
  const moveOther = useCatalogCommand(updateHomeSection);
  const busy = status.busy || moveSelf.busy || moveOther.busy;
  const code = status.code ?? moveSelf.code ?? moveOther.code;

  /** Swap positions with a neighbour (two versioned updates). */
  function move(other: AdminHomeSection) {
    const mine =
      other.position === section.position
        ? Math.max(0, other.position + (other === previous ? -1 : 1))
        : other.position;
    moveSelf.submit(
      {
        sectionId: section.id,
        patch: { position: mine, expectedVersion: section.version },
      },
      () => {
        if (other.position === section.position) {
          onDone(t('moved'));
          return;
        }
        moveOther.submit(
          {
            sectionId: other.id,
            patch: {
              position: section.position,
              expectedVersion: other.version,
            },
          },
          () => onDone(t('moved')),
        );
      },
    );
  }

  const pills = [...section.categories].sort((a, b) => a.position - b.position);
  return (
    <Card padded className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid min-w-0 gap-1">
          <h3 className="text-h4 [overflow-wrap:anywhere]">{title}</h3>
          <p className="text-small text-text-2">
            {t(
              section.kind === 'single_category' ? 'kindSingle' : 'kindCurated',
            )}
            {' · '}
            {t(
              section.contentKind === 'service'
                ? 'contentService'
                : 'contentProduct',
            )}
          </p>
        </div>
        <ActiveBadge active={section.active} />
      </div>
      {section.kind === 'curated_categories' && (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {pills.map((pill) => (
            <li key={pill.categoryId}>
              <Badge
                tone={
                  pill.categoryId === section.initialCategoryId
                    ? 'info'
                    : 'neutral'
                }
                icon={pill.categoryId === section.initialCategoryId ? '★' : '•'}
                label={
                  pill.categoryId === section.initialCategoryId
                    ? t('initialPillNamed', {
                        name: categoryName(pill.categoryId),
                      })
                    : categoryName(pill.categoryId)
                }
              />
            </li>
          ))}
        </ul>
      )}
      <CommandError code={code} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          aria-label={t('moveUpNamed', { name: title })}
          disabled={!previous || busy}
          onClick={() => previous && move(previous)}
        >
          <span aria-hidden="true">↑</span>
        </Button>
        <Button
          variant="ghost"
          aria-label={t('moveDownNamed', { name: title })}
          disabled={!next || busy}
          onClick={() => next && move(next)}
        >
          <span aria-hidden="true">↓</span>
        </Button>
        <Button variant="outline" disabled={busy} onClick={onEdit}>
          {t('edit')}
        </Button>
        <Button
          variant="outline"
          loading={status.busy}
          disabled={busy}
          onClick={() =>
            status.submit(
              {
                sectionId: section.id,
                body: {
                  event: section.active ? 'deactivate' : 'activate',
                  expectedVersion: section.version,
                },
              },
              (saved) => onDone(t(saved.active ? 'activated' : 'deactivated')),
            )
          }
        >
          {t(section.active ? 'deactivate' : 'activate')}
        </Button>
        <Button variant="text" disabled={busy} onClick={onRemove}>
          {t('remove')}
        </Button>
      </div>
    </Card>
  );
}

function RemoveDialog({
  section,
  title,
  onClose,
  onDone,
}: {
  section: AdminHomeSection;
  title: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('catalog.admin.sections');
  const command = useCatalogCommand(removeHomeSection);
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && !command.busy && onClose()}
      title={t('removeTitle', { name: title })}
      impact={t('removeImpact')}
      cancelLabel={t('cancel')}
      confirmLabel={t('remove')}
      tone="danger"
      busy={command.busy}
      onConfirm={() =>
        command.submit(
          { sectionId: section.id, expectedVersion: section.version },
          onDone,
        )
      }
    >
      <CommandError code={command.code} />
    </ConfirmDialog>
  );
}

type Draft = {
  kind: HomeSectionKind;
  contentKind: CategoryKind;
  categoryId: string;
  headingEn: string;
  headingHi: string;
  supportingTextEn: string;
  supportingTextHi: string;
  categoryIds: string[];
  initialCategoryId: string;
  position: string;
};

function SectionSheet({
  tree,
  section,
  nextPosition,
  onClose,
  onSaved,
}: {
  tree: readonly Named[];
  section?: AdminHomeSection | undefined;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('catalog.admin.sections');
  const locale = useLocale();
  const [draft, setDraft] = useState<Draft>(() => ({
    kind: section?.kind ?? 'single_category',
    contentKind: section?.contentKind ?? 'product',
    categoryId: section?.categoryId ?? '',
    headingEn: section?.headingEn ?? '',
    headingHi: section?.headingHi ?? '',
    supportingTextEn: section?.supportingTextEn ?? '',
    supportingTextHi: section?.supportingTextHi ?? '',
    categoryIds: [...(section?.categories ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => item.categoryId),
    initialCategoryId: section?.initialCategoryId ?? '',
    position: String(section?.position ?? nextPosition),
  }));
  const [checked, setChecked] = useState(false);
  const create = useCatalogCommand(createHomeSection);
  const update = useCatalogCommand(updateHomeSection);
  const command = section ? update : create;
  const set = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const name = (item: Named) => (locale === 'hi' ? item.nameHi : item.nameEn);
  // One content kind per section: only categories of that kind are offered.
  const options = tree.filter((item) => item.kind === draft.contentKind);
  const curated = draft.kind === 'curated_categories';
  const supportEn = draft.supportingTextEn.trim();
  const supportHi = draft.supportingTextHi.trim();
  const position = Number(draft.position);
  const categories = draft.categoryIds.map((categoryId, index) => ({
    categoryId,
    position: index,
  }));

  const createBody = curated
    ? {
        kind: 'curated_categories' as const,
        contentKind: draft.contentKind,
        headingEn: draft.headingEn.trim(),
        headingHi: draft.headingHi.trim(),
        ...(supportEn ? { supportingTextEn: supportEn } : {}),
        ...(supportHi ? { supportingTextHi: supportHi } : {}),
        categories,
        initialCategoryId: draft.initialCategoryId,
        position,
      }
    : {
        kind: 'single_category' as const,
        contentKind: draft.contentKind,
        categoryId: draft.categoryId,
        ...(supportEn ? { supportingTextEn: supportEn } : {}),
        ...(supportHi ? { supportingTextHi: supportHi } : {}),
        position,
      };
  const updateBody = section && {
    ...(curated
      ? {
          headingEn: draft.headingEn.trim(),
          headingHi: draft.headingHi.trim(),
          categories,
          initialCategoryId: draft.initialCategoryId,
        }
      : { categoryId: draft.categoryId }),
    supportingTextEn: supportEn || null,
    supportingTextHi: supportHi || null,
    position,
    expectedVersion: section.version,
  };
  const parsed = section
    ? UpdateHomeSectionSchema.safeParse(updateBody)
    : CreateHomeSectionSchema.safeParse(createBody);
  const invalid = new Set<string>(command.fields);
  if (checked && !parsed.success)
    for (const issue of parsed.error.issues) invalid.add(String(issue.path[0]));
  const initialMissing =
    curated && !draft.categoryIds.includes(draft.initialCategoryId);
  if (checked && initialMissing) invalid.add('initialCategoryId');
  if (checked && draft.categoryIds.length === 0 && curated)
    invalid.add('categories');

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!parsed.success || initialMissing) return;
    if (section && updateBody)
      update.submit({ sectionId: section.id, patch: updateBody }, onSaved);
    else create.submit(createBody, onSaved);
  }

  const toggle = (id: string, on: boolean) =>
    setDraft((current) => {
      const ids = on
        ? [...current.categoryIds, id]
        : current.categoryIds.filter((item) => item !== id);
      return {
        ...current,
        categoryIds: ids,
        initialCategoryId: ids.includes(current.initialCategoryId)
          ? current.initialCategoryId
          : (ids[0] ?? ''),
      };
    });
  const error = (field: string, key: string) =>
    invalid.has(field) ? t(key) : undefined;

  return (
    <Sheet
      open
      wide
      onOpenChange={(next) => !next && !command.busy && onClose()}
      title={t(section ? 'editTitle' : 'createTitle')}
      {...(section ? {} : { description: t('draftHelp') })}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <SheetFooter
          form="home-section"
          busy={command.busy}
          onCancel={onClose}
          submitLabel={t('save')}
        />
      }
    >
      <form
        id="home-section"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        {!section && (
          <>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-field-label font-semibold">
                {t('kindLegend')}
              </legend>
              {(['single_category', 'curated_categories'] as const).map(
                (kind) => (
                  <Radio
                    key={kind}
                    name="section-kind"
                    label={t(
                      kind === 'single_category' ? 'kindSingle' : 'kindCurated',
                    )}
                    description={t(
                      kind === 'single_category'
                        ? 'kindSingleHelp'
                        : 'kindCuratedHelp',
                    )}
                    checked={draft.kind === kind}
                    onChange={() => set({ kind })}
                  />
                ),
              )}
            </fieldset>
            <Select
              label={t('contentKind')}
              required
              value={draft.contentKind}
              options={[
                { value: 'product', label: t('contentProduct') },
                { value: 'service', label: t('contentService') },
              ]}
              onChange={(event) =>
                set({
                  contentKind: event.target.value as CategoryKind,
                  categoryId: '',
                  categoryIds: [],
                  initialCategoryId: '',
                })
              }
            />
          </>
        )}
        {curated ? (
          <>
            <Input
              label={t('headingEn')}
              required
              maxLength={80}
              lang="en"
              value={draft.headingEn}
              error={error('headingEn', 'headingInvalid')}
              onChange={(event) => set({ headingEn: event.target.value })}
            />
            <Input
              label={t('headingHi')}
              required
              maxLength={80}
              lang="hi"
              value={draft.headingHi}
              error={error('headingHi', 'headingInvalid')}
              onChange={(event) => set({ headingHi: event.target.value })}
            />
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-field-label font-semibold">
                {t('pills')}
              </legend>
              <p className="text-small text-text-2">{t('pillsHelp')}</p>
              {options.map((item) => (
                <Checkbox
                  key={item.id}
                  label={name(item)}
                  {...(item.active
                    ? {}
                    : { description: t('inactiveCategory') })}
                  checked={draft.categoryIds.includes(item.id)}
                  onChange={(event) => toggle(item.id, event.target.checked)}
                />
              ))}
              {invalid.has('categories') && (
                <p role="alert" className="text-field-error text-error">
                  {t('pillsInvalid')}
                </p>
              )}
            </fieldset>
            <Select
              label={t('initialPill')}
              required
              value={draft.initialCategoryId}
              error={error('initialCategoryId', 'initialInvalid')}
              options={[
                { value: '', label: t('choose') },
                ...draft.categoryIds.map((id) => {
                  const item = options.find((option) => option.id === id);
                  return { value: id, label: item ? name(item) : id };
                }),
              ]}
              onChange={(event) =>
                set({ initialCategoryId: event.target.value })
              }
            />
          </>
        ) : (
          <Select
            label={t('category')}
            required
            value={draft.categoryId}
            error={error('categoryId', 'categoryInvalid')}
            options={[
              { value: '', label: t('choose') },
              ...options.map((item) => ({ value: item.id, label: name(item) })),
            ]}
            onChange={(event) => set({ categoryId: event.target.value })}
          />
        )}
        <Input
          label={t('supportingEn')}
          maxLength={160}
          lang="en"
          hint={t('supportingHelp')}
          value={draft.supportingTextEn}
          error={error('supportingTextEn', 'supportingInvalid')}
          onChange={(event) => set({ supportingTextEn: event.target.value })}
        />
        <Input
          label={t('supportingHi')}
          maxLength={160}
          lang="hi"
          value={draft.supportingTextHi}
          error={error('supportingTextHi', 'supportingInvalid')}
          onChange={(event) => set({ supportingTextHi: event.target.value })}
        />
        <Input
          label={t('position')}
          type="number"
          inputMode="numeric"
          min={0}
          max={10000}
          required
          value={draft.position}
          error={error('position', 'positionInvalid')}
          onChange={(event) => set({ position: event.target.value })}
        />
        <CommandError code={command.code} />
      </form>
    </Sheet>
  );
}
