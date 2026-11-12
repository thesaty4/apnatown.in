'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CreateCategorySchema,
  CreateSubcategorySchema,
  UpdateCategorySchema,
  UpdateSubcategorySchema,
  catalogSlug,
  type AdminCategory,
  type AdminSubcategory,
  type CategoryKind,
} from '@apnatown/shared/catalog';
import { Input } from '@apnatown/ui/primitives/Input';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { TaxonomyImageField } from './TaxonomyImageField';
import {
  createCategory,
  createSubcategory,
  updateCategory,
  updateSubcategory,
} from '../api';
import { useCatalogCommand } from '../queries';
import { CommandError, SheetFooter } from './common';

type Names = { nameEn: string; nameHi: string };
const nameError = (invalid: Set<string>, field: string, message: string) =>
  invalid.has(field) ? message : undefined;
function issues(
  checked: boolean,
  result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } },
  fields: readonly string[],
) {
  const invalid = new Set<string>(fields);
  if (checked && !result.success)
    for (const issue of result.error?.issues ?? [])
      invalid.add(String(issue.path[0]));
  return invalid;
}

function NameFields({
  draft,
  set,
  invalid,
}: {
  draft: Names;
  set: (patch: Partial<Names>) => void;
  invalid: Set<string>;
}) {
  const t = useTranslations('catalog.admin.categories');
  return (
    <>
      <Input
        label={t('nameEn')}
        required
        maxLength={60}
        lang="en"
        value={draft.nameEn}
        error={nameError(invalid, 'nameEn', t('nameInvalid'))}
        onChange={(event) => set({ nameEn: event.target.value })}
      />
      <Input
        label={t('nameHi')}
        required
        maxLength={60}
        lang="hi"
        value={draft.nameHi}
        error={nameError(invalid, 'nameHi', t('nameInvalid'))}
        onChange={(event) => set({ nameHi: event.target.value })}
      />
    </>
  );
}

type CategoryDraft = Names & {
  slug: string;
  slugEdited: boolean;
  icon: string;
  sortOrder: string;
  active: boolean;
  imageAssetId?: string | null | undefined;
};

/** Super-admin create (no `category`) or edit of a fixed main category.
 * The slug is immutable after creation. Conflicts keep the form values. */
export function CategorySheet({
  kind,
  category,
  onClose,
  onSaved,
}: {
  kind: CategoryKind;
  category?: AdminCategory | undefined;
  onClose: () => void;
  onSaved: (category: AdminCategory) => void;
}) {
  const t = useTranslations('catalog.admin.categories');
  const [draft, setDraft] = useState<CategoryDraft>({
    nameEn: category?.nameEn ?? '',
    nameHi: category?.nameHi ?? '',
    slug: category?.slug ?? '',
    slugEdited: false,
    icon: category?.icon ?? '',
    sortOrder: category ? String(category.sortOrder) : '',
    active: category?.active ?? true,
  });
  const [checked, setChecked] = useState(false);
  const [pendingImage, setPendingImage] = useState(false);
  const create = useCatalogCommand(createCategory);
  const update = useCatalogCommand(updateCategory);
  const command = category ? update : create;
  const set = (patch: Partial<CategoryDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const sortOrder = draft.sortOrder.trim()
    ? Number(draft.sortOrder)
    : undefined;
  const slug = draft.slugEdited ? draft.slug : catalogSlug(draft.nameEn);
  const createBody = {
    kind,
    slug,
    nameEn: draft.nameEn.trim(),
    nameHi: draft.nameHi.trim(),
    ...(draft.icon.trim() && { icon: draft.icon.trim() }),
    ...(draft.imageAssetId !== undefined && {
      imageAssetId: draft.imageAssetId,
    }),
    ...(sortOrder !== undefined && { sortOrder }),
  };
  const updateBody = category && {
    nameEn: draft.nameEn.trim(),
    nameHi: draft.nameHi.trim(),
    icon: draft.icon.trim() || null,
    active: draft.active,
    ...(sortOrder !== undefined && { sortOrder }),
    ...(draft.imageAssetId !== undefined && {
      imageAssetId: draft.imageAssetId,
    }),
    expectedVersion: category.version,
  };
  const parsed = category
    ? UpdateCategorySchema.safeParse(updateBody)
    : CreateCategorySchema.safeParse(createBody);
  const invalid = issues(checked, parsed, command.fields);

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (pendingImage || !parsed.success) return;
    if (category && updateBody)
      update.submit({ categoryId: category.id, patch: updateBody }, onSaved);
    else create.submit(createBody, onSaved);
  }

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && !command.busy && onClose()}
      title={t(category ? 'editTitle' : 'createTitle')}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <SheetFooter
          form="catalog-category"
          busy={command.busy}
          onCancel={onClose}
          submitLabel={t('save')}
          disabled={pendingImage}
        />
      }
    >
      <form
        id="catalog-category"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        <p className="text-small text-text-2">
          {t(kind === 'service' ? 'kindService' : 'kindProduct')}
        </p>
        <NameFields draft={draft} set={set} invalid={invalid} />
        {category ? (
          <p className="text-small text-text-2 [overflow-wrap:anywhere]">
            {t('slugFixed', { slug: category.slug })}
          </p>
        ) : (
          <Input
            label={t('slug')}
            required
            maxLength={80}
            lang="en"
            hint={t('slugHint')}
            value={slug}
            error={
              command.code === 'CATEGORY_CONFLICT'
                ? t('slugTaken')
                : nameError(invalid, 'slug', t('slugInvalid'))
            }
            onChange={(event) =>
              set({ slug: event.target.value, slugEdited: true })
            }
          />
        )}
        <Input
          label={t('icon')}
          maxLength={16}
          hint={t('iconHint')}
          value={draft.icon}
          error={nameError(invalid, 'icon', t('iconInvalid'))}
          onChange={(event) => set({ icon: event.target.value })}
        />
        <TaxonomyImageField
          assetId={
            draft.imageAssetId === undefined
              ? (category?.imageAssetId ?? null)
              : draft.imageAssetId
          }
          image={
            draft.imageAssetId === undefined ||
            draft.imageAssetId === category?.imageAssetId
              ? category?.image
              : undefined
          }
          previewLabel={draft.nameEn || category?.nameEn || t('imageTitle')}
          onAssetIdChange={(imageAssetId) => set({ imageAssetId })}
          onPendingChange={setPendingImage}
          onScopeReset={() => set({ imageAssetId: undefined })}
        />
        <Input
          label={t('sortOrder')}
          type="number"
          inputMode="numeric"
          min={0}
          value={draft.sortOrder}
          error={nameError(invalid, 'sortOrder', t('sortOrderInvalid'))}
          onChange={(event) => set({ sortOrder: event.target.value })}
        />
        {category && (
          <Switch
            label={t('activeLabel')}
            description={t('activeHelp')}
            checked={draft.active}
            onChange={(event) => set({ active: event.target.checked })}
          />
        )}
        <CommandError code={command.code} />
      </form>
    </Sheet>
  );
}

/** Super-admin create (under `category`) or edit of a subcategory. */
export function SubcategorySheet({
  category,
  subcategory,
  onClose,
  onSaved,
}: {
  category: AdminCategory;
  subcategory?: AdminSubcategory | undefined;
  onClose: () => void;
  onSaved: (subcategory: AdminSubcategory) => void;
}) {
  const t = useTranslations('catalog.admin.categories');
  const locale = useLocale();
  const [draft, setDraft] = useState({
    nameEn: subcategory?.nameEn ?? '',
    nameHi: subcategory?.nameHi ?? '',
    sortOrder: subcategory ? String(subcategory.sortOrder) : '',
    active: subcategory?.active ?? true,
    imageAssetId: undefined as string | null | undefined,
  });
  const [checked, setChecked] = useState(false);
  const [pendingImage, setPendingImage] = useState(false);
  const create = useCatalogCommand(createSubcategory);
  const update = useCatalogCommand(updateSubcategory);
  const command = subcategory ? update : create;
  const set = (patch: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const sortOrder = draft.sortOrder.trim()
    ? Number(draft.sortOrder)
    : undefined;
  const createBody = {
    nameEn: draft.nameEn.trim(),
    nameHi: draft.nameHi.trim(),
    ...(draft.imageAssetId !== undefined && {
      imageAssetId: draft.imageAssetId,
    }),
    expectedVersion: category.version,
  };
  const updateBody = subcategory && {
    nameEn: draft.nameEn.trim(),
    nameHi: draft.nameHi.trim(),
    active: draft.active,
    ...(sortOrder !== undefined && { sortOrder }),
    ...(draft.imageAssetId !== undefined && {
      imageAssetId: draft.imageAssetId,
    }),
    expectedVersion: subcategory.version,
  };
  const parsed = subcategory
    ? UpdateSubcategorySchema.safeParse(updateBody)
    : CreateSubcategorySchema.safeParse(createBody);
  const invalid = issues(checked, parsed, command.fields);

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (pendingImage || !parsed.success) return;
    if (subcategory && updateBody)
      update.submit(
        { subcategoryId: subcategory.id, patch: updateBody },
        onSaved,
      );
    else create.submit({ categoryId: category.id, body: createBody }, onSaved);
  }

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && !command.busy && onClose()}
      title={t(subcategory ? 'editSubTitle' : 'addSubTitle')}
      description={t('inCategory', {
        category: locale === 'hi' ? category.nameHi : category.nameEn,
      })}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <SheetFooter
          form="catalog-subcategory"
          busy={command.busy}
          onCancel={onClose}
          submitLabel={t('save')}
          disabled={pendingImage}
        />
      }
    >
      <form
        id="catalog-subcategory"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        <NameFields draft={draft} set={set} invalid={invalid} />
        <TaxonomyImageField
          assetId={
            draft.imageAssetId === undefined
              ? (subcategory?.imageAssetId ?? null)
              : draft.imageAssetId
          }
          image={
            draft.imageAssetId === undefined ||
            draft.imageAssetId === subcategory?.imageAssetId
              ? subcategory?.image
              : undefined
          }
          previewLabel={draft.nameEn || subcategory?.nameEn || t('imageTitle')}
          onAssetIdChange={(imageAssetId) => set({ imageAssetId })}
          onPendingChange={setPendingImage}
          onScopeReset={() => set({ imageAssetId: undefined })}
        />
        {command.code === 'SUBCATEGORY_DUPLICATE' && (
          <p className="text-small text-text-2">{t('duplicateHelp')}</p>
        )}
        {subcategory && (
          <>
            <Input
              label={t('sortOrder')}
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.sortOrder}
              error={nameError(invalid, 'sortOrder', t('sortOrderInvalid'))}
              onChange={(event) => set({ sortOrder: event.target.value })}
            />
            <Switch
              label={t('activeLabel')}
              description={t('activeSubHelp')}
              checked={draft.active}
              onChange={(event) => set({ active: event.target.checked })}
            />
          </>
        )}
        <CommandError code={command.code} />
      </form>
    </Sheet>
  );
}
