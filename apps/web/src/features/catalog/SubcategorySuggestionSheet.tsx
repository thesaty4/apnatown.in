'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  SuggestSubcategorySchema,
  SuggestionDuplicateCheckSchema,
  type CategoryKind,
  type Suggestion,
  type SuggestionDuplicateResult,
} from '@apnatown/shared/catalog';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Select } from '@apnatown/ui/primitives/Select';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { queryKeys } from '../../shared/api/query-keys';
import { ApiFailure, failureCode } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { AccessState } from '../../shared/auth/AccessState';
import {
  createSuggestion,
  type DuplicateCheckBody,
  type SuggestBody,
} from './api';
import { catalogName } from './parts';
import { categoriesOptions, useDuplicateCheck, useOwnerScope } from './queries';
import { ownerErrorKey } from './status';

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Localized duplicate result: exact blocks submit, fuzzy offers "Suggest
 * anyway". Names are API data shown in the current locale. */
export function DuplicateMatchPanel({
  result,
}: {
  result: SuggestionDuplicateResult;
}) {
  const t = useTranslations('catalog.subcategorySuggestion');
  const locale = useLocale();
  if (!result.exact && result.candidates.length === 0) return null;
  const names = result.exact
    ? result.exactSubcategory
      ? [result.exactSubcategory]
      : []
    : result.candidates;
  return (
    <div
      role={result.exact ? 'alert' : 'status'}
      className={`grid gap-2 rounded-md border p-3 text-text ${result.exact ? 'border-error bg-error-soft' : 'border-warning bg-warning-soft'}`}
    >
      <p className="flex gap-2 font-semibold">
        <span aria-hidden="true">{result.exact ? '⛔' : '⚠️'}</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {result.exact
            ? result.exactSubcategory
              ? t('exactTitle')
              : t('pendingTitle')
            : t('similarTitle')}
        </span>
      </p>
      {names.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {names.map((item) => (
            <li
              key={item.subcategoryId}
              className="rounded-pill border border-border-strong bg-surface px-3 py-1 text-small [overflow-wrap:anywhere]"
            >
              {catalogName(item, locale)}
            </li>
          ))}
        </ul>
      )}
      <p className="text-small text-text-2 [overflow-wrap:anywhere]">
        {result.exact ? t('exactHelp') : t('similarHelp')}
      </p>
    </div>
  );
}

type Draft = {
  categoryId: string;
  nameEn: string;
  nameHi: string;
  reason: string;
};

/**
 * S-VEND-05 subcategory suggestion sheet. Main categories are fixed; the
 * owner suggests a subcategory for admin review. Exported for the vendor
 * products/services screens (their routes are owned by those slices).
 */
export function SubcategorySuggestionSheet({
  open,
  onClose,
  kind,
  defaultCategoryId,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  /** Category kind for the owner's business (products or services). */
  kind?: CategoryKind | undefined;
  /** From the owner's trusted business context; still changeable. */
  defaultCategoryId?: string | undefined;
  onSubmitted?: ((suggestion: Suggestion) => void) | undefined;
}) {
  const t = useTranslations('catalog.subcategorySuggestion');
  const locale = useLocale();
  const client = useQueryClient();
  const { api, lifecycle, scope } = useOwnerScope();
  const categories = useQuery(categoriesOptions(api, kind));
  const empty: Draft = {
    categoryId: defaultCategoryId ?? '',
    nameEn: '',
    nameHi: '',
    reason: '',
  };
  const [draft, setDraft] = useState<Draft>(empty);
  const [checked, setChecked] = useState(false);
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    (input: { body: SuggestBody; key: string }, assertCurrent) =>
      createSuggestion(api, input.body, { key: input.key, assertCurrent }),
  );
  const set = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const checkInput = SuggestionDuplicateCheckSchema.safeParse({
    categoryId: draft.categoryId,
    nameEn: draft.nameEn.trim(),
    ...(draft.nameHi.trim() && { nameHi: draft.nameHi.trim() }),
  });
  const pendingCheck = useDebounced(
    checkInput.success ? JSON.stringify(checkInput.data) : null,
  );
  const duplicate = useDuplicateCheck(
    pendingCheck ? (JSON.parse(pendingCheck) as DuplicateCheckBody) : null,
  );
  const result = duplicate.data;
  const current =
    checkInput.success && pendingCheck === JSON.stringify(checkInput.data);
  const exact = current && result?.exact === true;
  const code = mutation.isError ? failureCode(mutation.error) : undefined;
  const similar =
    (current && !!result && !result.exact && result.candidates.length > 0) ||
    code === 'SUGGESTION_SIMILARITY_WARNING';

  const body = {
    categoryId: draft.categoryId,
    nameEn: draft.nameEn.trim(),
    ...(draft.nameHi.trim() && { nameHi: draft.nameHi.trim() }),
    ...(draft.reason.trim() && { reason: draft.reason.trim() }),
    ...(similar && { allowSimilar: true }),
  };
  const parsed = SuggestSubcategorySchema.safeParse(body);
  const invalid = new Set<string>(
    checked && !parsed.success
      ? parsed.error.issues.map((issue) => String(issue.path[0]))
      : [],
  );
  if (mutation.error instanceof ApiFailure)
    for (const field of mutation.error.fields) invalid.add(field);

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!parsed.success || exact || !scope) return;
    const key = keys.for(JSON.stringify(parsed.data));
    void mutation.run(
      { body: parsed.data as SuggestBody, key },
      async (suggestion) => {
        keys.clear();
        setDraft(empty);
        setChecked(false);
        await client.invalidateQueries({
          queryKey: queryKeys.catalogSuggestions(scope),
        });
        onSubmitted?.(suggestion);
        onClose();
      },
    );
  }

  const options = [
    { value: '', label: t('chooseCategory') },
    ...(categories.data?.items ?? [])
      .filter((item) => item.active)
      .map((item) => ({ value: item.id, label: catalogName(item, locale) })),
  ];
  const busy = mutation.isPending;
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && !busy && onClose()}
      title={t('title')}
      description={t('intro')}
      closeLabel={t('close')}
      busy={busy}
      footer={
        scope && (
          <div className="flex items-center gap-row-gap">
            <Button
              variant="ghost"
              className="min-w-0 flex-1"
              disabled={busy}
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="subcategory-suggestion"
              className="min-w-0 flex-1"
              loading={busy}
              disabled={exact}
            >
              {t(similar ? 'suggestAnyway' : 'send')}
            </Button>
          </div>
        )
      }
    >
      {!scope ? (
        <AccessState />
      ) : (
        <form
          id="subcategory-suggestion"
          noValidate
          className="grid gap-3"
          onSubmit={submit}
        >
          <Select
            label={t('category')}
            required
            options={options}
            value={draft.categoryId}
            disabled={categories.isPending}
            error={
              categories.isError
                ? t('errors.categoriesFailed')
                : invalid.has('categoryId')
                  ? t('errors.categoryRequired')
                  : undefined
            }
            onChange={(event) => set({ categoryId: event.target.value })}
          />
          {categories.isError && (
            <Button
              variant="outline"
              disabled={categories.isFetching}
              onClick={() => void categories.refetch()}
            >
              {t('retry')}
            </Button>
          )}
          <Input
            label={t('nameEn')}
            required
            maxLength={60}
            lang="en"
            value={draft.nameEn}
            error={invalid.has('nameEn') ? t('errors.name') : undefined}
            onChange={(event) => set({ nameEn: event.target.value })}
          />
          <Input
            label={t('nameHi')}
            maxLength={60}
            lang="hi"
            value={draft.nameHi}
            error={invalid.has('nameHi') ? t('errors.name') : undefined}
            onChange={(event) => set({ nameHi: event.target.value })}
          />
          <TextArea
            label={t('reason')}
            maxLength={500}
            value={draft.reason}
            error={invalid.has('reason') ? t('errors.reason') : undefined}
            onChange={(event) => set({ reason: event.target.value })}
          />
          <div aria-live="polite" className="grid gap-2">
            {current && duplicate.isFetching && (
              <p className="text-small text-text-2">{t('checking')}</p>
            )}
            {current && result && !duplicate.isFetching && (
              <>
                <DuplicateMatchPanel result={result} />
                {!result.exact && result.candidates.length === 0 && (
                  <p className="text-small text-text-2">{t('noSimilar')}</p>
                )}
              </>
            )}
            {current && duplicate.isError && (
              <p className="text-small text-text-2">
                {t(`errors.${ownerErrorKey(failureCode(duplicate.error))}`)}
              </p>
            )}
          </div>
          {code && code !== 'SUGGESTION_SIMILARITY_WARNING' && (
            <p
              role="alert"
              className="flex gap-2 rounded-md border border-error bg-error-soft p-3 text-text"
            >
              <span aria-hidden="true">⚠️</span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {t(`errors.${ownerErrorKey(code)}`)}
              </span>
            </p>
          )}
        </form>
      )}
    </Sheet>
  );
}
