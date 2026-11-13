'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { SavedItem, SavedQuery } from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { accountScope, type AccountScope } from '../../shared/api/query-keys';
import { failureCode } from '../../shared/api/result';
import { Failure } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { savedOptions } from './saved-api';

// Same request as /saved?tab=shops so both screens share one cache entry.
const request: SavedQuery = { tab: 'shops', mediaFilter: 'all', limit: 20 };
type Available = Extract<SavedItem, { available: true }>;

/** S-CUST-01 "Your bookmarks": the first four followed shops for a signed-in
 * customer. Guests and empty lists see nothing, matching the prototype. */
export function HomeBookmarks() {
  const { state, epoch } = useSession();
  if (state.kind !== 'ready' || !state.data.roles.includes('customer'))
    return null;
  return <Bookmarks scope={accountScope(state.data, epoch)} />;
}

function Bookmarks({ scope }: { scope: AccountScope }) {
  const t = useTranslations('engagement.saved');
  const locale = useLocale();
  const { api, lifecycle } = useSession();
  const query = useInfiniteQuery(savedOptions(api, scope, lifecycle, request));
  const items = (query.data?.pages.flatMap((page) => page.items) ?? [])
    .filter((item): item is Available => item.available)
    .slice(0, 4);
  if (query.isSuccess && items.length === 0) return null;
  return (
    <section aria-labelledby="home-bookmarks" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="home-bookmarks" className="text-h2">
          {t('homeTitle')}
        </h2>
        <Link
          href="/saved"
          className="inline-flex min-h-touch items-center font-semibold text-primary underline"
        >
          {t('seeAll')}
        </Link>
      </div>
      {query.isPending ? (
        <Skeleton label={t('loading')} />
      ) : query.isError ? (
        <Failure
          code={failureCode(query.error)}
          retry={() => void query.refetch()}
          retryDisabled={query.isFetching}
        />
      ) : (
        <ul className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
          {items.map((item) => (
            <li key={item.targetId}>
              <Card padded className="flex items-center gap-3">
                <span aria-hidden="true" className="text-h3 text-primary">
                  ✓
                </span>
                <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                  {(locale === 'hi' ? item.labelHi : null) ?? item.labelEn}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
