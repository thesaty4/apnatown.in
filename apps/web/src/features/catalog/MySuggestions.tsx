'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../shared/api/result';
import { AccessState } from '../../shared/auth/AccessState';
import { catalogName } from './parts';
import { categoriesOptions, useMySuggestions, useOwnerScope } from './queries';
import { SuggestionStatusBadge, isOwnerDenied, ownerErrorKey } from './status';

/** S-VEND-05 "My suggestions": the owner's own history only (server-scoped),
 * with status icon + text and the rejection reason. */
export function MySuggestions({ onSuggest }: { onSuggest?: () => void }) {
  const t = useTranslations('catalog.subcategorySuggestion');
  const locale = useLocale();
  const format = useFormatter();
  const { api, scope } = useOwnerScope();
  const query = useMySuggestions();
  const categories = useQuery(categoriesOptions(api));
  const names = new Map(
    (categories.data?.items ?? []).map((item) => [
      item.id,
      catalogName(item, locale),
    ]),
  );
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const code = query.isError ? failureCode(query.error) : undefined;
  const suggest = onSuggest && (
    <Button onClick={onSuggest}>{t('suggest')}</Button>
  );

  let body;
  if (!scope) body = <AccessState />;
  else if (query.isPending) body = <Skeleton label={t('loading')} />;
  else if (code && isOwnerDenied(code))
    body = (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={t('errors.forbidden')}
        action={null}
      />
    );
  else if (code && items.length === 0)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={t(`errors.${ownerErrorKey(code)}`)}
        action={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );
  else if (items.length === 0)
    body = (
      <EmptyState
        title={t('emptyTitle')}
        message={t('intro')}
        action={suggest ?? null}
      />
    );
  else
    body = (
      <>
        <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card padded className="grid h-full gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 text-h4 [overflow-wrap:anywhere]">
                    {locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn}
                  </h3>
                  <SuggestionStatusBadge value={item.status} />
                </div>
                <p className="text-small text-text-2 [overflow-wrap:anywhere]">
                  {t('inCategory', {
                    category: names.get(item.categoryId) ?? '—',
                  })}
                  {' · '}
                  {format.dateTime(new Date(item.createdAt), {
                    dateStyle: 'medium',
                  })}
                </p>
                {item.status === 'rejected' && item.rejectionReason && (
                  <p className="text-small [overflow-wrap:anywhere]">
                    {t('rejectionReason', { reason: item.rejectionReason })}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
        {code && (
          <ErrorState
            title={t('errorTitle')}
            message={t(`errors.${ownerErrorKey(code)}`)}
            action={
              <Button
                variant="outline"
                disabled={query.isFetching}
                onClick={() => void query.fetchNextPage()}
              >
                {t('retry')}
              </Button>
            }
          />
        )}
        {query.hasNextPage && !code && (
          <Button
            variant="outline"
            loading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        )}
      </>
    );

  return (
    <section aria-labelledby="my-suggestions" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="my-suggestions" className="text-h3">
          {t('mine')}
        </h2>
        {items.length > 0 && suggest}
      </div>
      {body}
    </section>
  );
}
