'use client';

import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { PROVIDER_EXPERTISE_LIMIT } from '@apnatown/shared/services';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { categoriesOptions, categoryOptions, catalogName } from '../catalog';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import { FormCard } from './sections/shared';
import { Alert } from './parts';
import { useExpertise, useReplaceExpertise } from './queries';

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Provider expertise multi-select (Services-owned `/businesses/me/expertise`).
 * Isolated from the profile form: its own `expertiseVersion`, save action,
 * conflict handling and states; never sent in the business profile patch.
 */
export function ExpertiseSection({ disabled = false }: { disabled?: boolean }) {
  const t = useTranslations('business.expertise');
  const tp = useTranslations('business.profile');
  const locale = useLocale();
  const { api } = useSession();
  const expertise = useExpertise();
  const replace = useReplaceExpertise();
  const categories = useQuery(categoriesOptions(api, 'service'));
  const active = (categories.data?.items ?? []).filter((item) => item.active);
  const details = useQueries({
    queries: active.map((category) => categoryOptions(api, category.slug)),
  });
  // Untouched: follow the server set. First edit pins the guard version so a
  // background refetch never silently rebases in-progress picks.
  const [selected, setSelected] = useState<string[] | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const version = pinned ?? expertise.data?.expertiseVersion ?? null;

  const loadCode = expertise.isError ? failureCode(expertise.error) : undefined;
  const saveCode = replace.isError ? failureCode(replace.error) : undefined;
  const conflict = saveCode === 'SERVICES_VERSION_CONFLICT';
  const locked = disabled || loadCode === 'COMMON_FORBIDDEN';
  const picks = selected ?? expertise.data?.subcategoryIds ?? [];
  const dirty =
    expertise.data !== undefined &&
    !sameSet(picks, expertise.data.subcategoryIds);
  const full = picks.length >= PROVIDER_EXPERTISE_LIMIT;

  function toggle(id: string) {
    setSaved(false);
    if (pinned === null) setPinned(version);
    setSelected(
      picks.includes(id)
        ? picks.filter((item) => item !== id)
        : full
          ? picks
          : [...picks, id],
    );
  }
  function save() {
    if (version === null) return;
    setSaved(false);
    void replace.run(
      { subcategoryIds: picks, expectedVersion: version },
      () => {
        setPinned(null);
        setSelected(null);
        setSaved(true);
      },
    );
  }
  async function reload() {
    const latest = await expertise.refetch();
    // Keep the owner's picks; only the guard version moves forward.
    if (latest.data) setPinned(latest.data.expertiseVersion);
    replace.reset();
  }

  let body;
  if (expertise.isPending || categories.isPending)
    body = <Skeleton label={t('loading')} />;
  else if (loadCode === 'COMMON_FORBIDDEN')
    body = <p className="m-0 text-small text-text-2">{t('locked')}</p>;
  else if (loadCode || categories.isError)
    body = (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-2 text-small text-error"
      >
        <span>{t('loadFailed')}</span>
        <Button
          size="small"
          variant="outline"
          disabled={expertise.isFetching || categories.isFetching}
          onClick={() => {
            if (expertise.isError) void expertise.refetch();
            if (categories.isError) void categories.refetch();
          }}
        >
          {t('retry')}
        </Button>
      </div>
    );
  else if (active.length === 0)
    body = <p className="m-0 text-small text-text-2">{t('noTaxonomy')}</p>;
  else
    body = (
      <>
        {picks.length === 0 && (
          <p className="m-0 rounded-md bg-surface-2 p-3 text-small text-text-2">
            {tp('noExpertise')}
          </p>
        )}
        <div className="grid min-w-0 gap-3">
          {active.map((category, index) => {
            const detail = details[index];
            const subs = (detail?.data?.subcategories ?? []).filter(
              (item) => item.active,
            );
            return (
              <fieldset
                key={category.id}
                disabled={locked}
                className="m-0 grid min-w-0 gap-2 border-0 p-0"
              >
                <legend className="mb-1 text-small font-semibold">
                  {category.icon && (
                    <span aria-hidden="true">{category.icon} </span>
                  )}
                  {catalogName(category, locale)}
                </legend>
                {detail?.isPending ? (
                  <Skeleton label={t('loading')} />
                ) : detail?.isError ? (
                  <Button
                    size="small"
                    variant="outline"
                    className="justify-self-start"
                    onClick={() => void detail.refetch()}
                  >
                    {t('retry')}
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subs.map((sub) => {
                      const on = picks.includes(sub.id);
                      return (
                        <Chip
                          key={sub.id}
                          label={catalogName(sub, locale)}
                          selected={on}
                          disabled={locked || (!on && full)}
                          onClick={() => toggle(sub.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
        {conflict && (
          <Alert
            tone="warn"
            role="alert"
            title={t('conflictTitle')}
            action={
              <Button
                size="small"
                variant="outline"
                onClick={() => void reload()}
              >
                {t('reload')}
              </Button>
            }
          >
            <p className="m-0">{t('conflict')}</p>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={locked || !dirty || replace.isPending || conflict}
            loading={replace.isPending}
            onClick={save}
          >
            {t('save')}
          </Button>
          <p
            role="status"
            aria-live="polite"
            className="m-0 text-small text-text-2"
          >
            {replace.isPending
              ? t('saving')
              : saved
                ? t('saved')
                : saveCode && !conflict
                  ? t(
                      saveCode === 'SERVICES_EXPERTISE_INVALID'
                        ? 'invalid'
                        : 'saveFailed',
                    )
                  : dirty
                    ? t('unsaved')
                    : t('count', {
                        count: picks.length,
                        limit: PROVIDER_EXPERTISE_LIMIT,
                      })}
          </p>
        </div>
      </>
    );
  return (
    <FormCard title={t('title')} description={t('hint')}>
      {body}
    </FormCard>
  );
}
