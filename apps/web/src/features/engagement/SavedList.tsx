'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { SavedItem, SavedQuery } from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import type { AccountScope } from '../../shared/api/query-keys';
import { failureCode } from '../../shared/api/result';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { savedOptions } from './saved-api';
import { useRemoveSaved } from './saved-queries';
import { publicHref } from '../../shared/i18n/preferences';

export function SavedList({
  scope,
  request,
}: {
  scope: AccountScope;
  request: SavedQuery;
}) {
  const t = useTranslations('engagement.saved');
  const follow = useTranslations('engagement.follow');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api, lifecycle } = useSession();
  const query = useInfiniteQuery(savedOptions(api, scope, lifecycle, request));
  const remove = useRemoveSaved(scope);
  const [confirm, setConfirm] = useState<SavedItem | null>(null);
  const [notice, setNotice] = useState(false);
  const status = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (notice) status.current?.focus();
  }, [notice]);

  const retry = () => void query.refetch();
  if (query.isPending) return <Skeleton label={t('loading')} />;
  const code = query.isError ? failureCode(query.error) : null;
  if (
    code &&
    (!query.isFetchNextPageError ||
      ['SESSION_EXPIRED', 'COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE'].includes(
        code,
      ))
  ) {
    if (code === 'SESSION_EXPIRED')
      return <AccessState guest guestMessage={t('guestMessage')} />;
    if (code === 'COMMON_FORBIDDEN')
      return (
        <NoPermissionState
          title={t('restrictedTitle')}
          message={t('restrictedMessage')}
          action={null}
        />
      );
    return (
      <Failure code={code} retry={retry} retryDisabled={query.isFetching} />
    );
  }
  if (!query.data)
    return (
      <Failure
        code={failureCode(query.error)}
        retry={retry}
        retryDisabled={query.isFetching}
      />
    );
  const items = query.data.pages.flatMap((page) => page.items);
  function removeItem(item: SavedItem) {
    setNotice(false);
    void remove.run(item, () => {
      setConfirm(null);
      setNotice(true);
    });
  }

  return (
    <div className="grid gap-4">
      <p ref={status} role="status" tabIndex={-1} className="m-0 text-text-2">
        {notice ? t('removed') : ''}
      </p>
      {remove.isError && (
        <p role="alert" className="m-0 text-error">
          {t('removeFailed')}
        </p>
      )}
      {items.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          message={t(
            request.tab === 'shops'
              ? 'emptyFollowing'
              : request.tab === 'services'
                ? 'emptyServices'
                : 'emptyMedia',
          )}
          action={
            <Link className={buttonClassName} href="/">
              {t('browse')}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const label = item.available
              ? (locale === 'hi'
                  ? (item.labelHi ?? item.labelEn)
                  : item.labelEn) ||
                t(item.targetType === 'service' ? 'service' : 'video')
              : t('unavailable');
            return (
              <Card
                key={`${item.targetType}:${item.targetId}`}
                padded
                className="flex flex-wrap items-center gap-3"
              >
                <span aria-hidden="true" className="text-h2">
                  {!item.available
                    ? '⊘'
                    : item.targetType === 'business'
                      ? '✓'
                      : item.targetType === 'service'
                        ? '▣'
                        : '▶'}
                </span>
                <div className="min-w-0 flex-1">
                  {item.available && item.canonicalPath ? (
                    <Link
                      className="inline-flex min-h-touch items-center font-semibold underline"
                      href={publicHref(item.canonicalPath, locale)}
                    >
                      {label}
                    </Link>
                  ) : (
                    <h2 className="m-0 text-body font-semibold">{label}</h2>
                  )}
                  {item.targetType === 'business' ? (
                    <p className="m-0 text-small text-text-2">
                      {follow(item.bellOn ? 'bellOn' : 'bellOff')}
                    </p>
                  ) : (
                    item.mediaKind && (
                      <p className="m-0 text-small text-text-2">
                        {t(item.mediaKind)}
                      </p>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  disabled={remove.isPending}
                  aria-label={t('removeLabel', { name: label })}
                  onClick={() => {
                    remove.reset();
                    if (item.targetType === 'business') setConfirm(item);
                    else removeItem(item);
                  }}
                >
                  {t('remove')}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
      {query.isFetchNextPageError && (
        <Failure
          code={failureCode(query.error)}
          retry={() => void query.fetchNextPage()}
          retryDisabled={query.isFetching}
        />
      )}
      {query.hasNextPage && (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {t('loadMore')}
        </Button>
      )}
      <ConfirmDialog
        open={confirm !== null}
        title={follow('unfollowTitle')}
        impact={follow('unfollowImpact')}
        cancelLabel={follow('cancel')}
        confirmLabel={follow('unfollow')}
        busy={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm) removeItem(confirm);
        }}
      />
    </div>
  );
}
