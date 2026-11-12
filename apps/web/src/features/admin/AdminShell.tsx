'use client';

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  HydrationBoundary,
  useQuery,
  useQueryClient,
  type DehydratedState,
} from '@tanstack/react-query';
import type { AdminMe } from '@apnatown/shared/admin';
import { DashboardShell } from '@apnatown/ui/layout/DashboardShell';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { AccessState } from '../../shared/auth/AccessState';
import { failureCode } from '../../shared/api/result';
import type { BrowserApi } from '../../shared/api/browser';
import {
  accountScope,
  queryKeys,
  type AccountScope,
} from '../../shared/api/query-keys';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';
import { adminMeOptions } from './queries';
import { adminErrorKey, isDenied } from './parts';

export type AdminContext = {
  api: BrowserApi;
  scope: AccountScope;
  lifecycle: PrivateLifecycle;
  me: AdminMe;
  /** Re-read authority after a denial; cached state never grants access. */
  recheck: () => void;
};
const Context = createContext<AdminContext | null>(null);

export function useAdmin() {
  const value = useContext(Context);
  if (!value) throw new Error('AdminShell required');
  return value;
}

/** Same session-revision fence as the account boundary: a late RSC payload
 * from an old authority never hydrates the new one. */
export function AdminShell({
  section,
  initial,
  owner,
  children,
}: {
  section: 'admin' | 'super';
  initial: DehydratedState;
  owner?: string | undefined;
  children: ReactNode;
}) {
  const { state, epoch, api, lifecycle } = useSession();
  if (state.kind !== 'ready') return <AccessState />;
  return (
    <HydrationBoundary
      state={state.data.userId === owner && epoch === 0 ? initial : undefined}
    >
      <Fragment key={`${state.data.userId}:${epoch}`}>
        <Gate
          section={section}
          api={api}
          lifecycle={lifecycle}
          scope={accountScope(state.data, epoch)}
        >
          {children}
        </Gate>
      </Fragment>
    </HydrationBoundary>
  );
}

const sectionRoles = {
  admin: ['admin', 'super_admin'],
  super: ['super_admin'],
} as const;

function Gate({
  section,
  api,
  lifecycle,
  scope,
  children,
}: {
  section: 'admin' | 'super';
  api: BrowserApi;
  lifecycle: PrivateLifecycle;
  scope: AccountScope;
  children: ReactNode;
}) {
  const t = useTranslations('admin.state');
  const te = useTranslations('admin.errors');
  const client = useQueryClient();
  const allowed = scope.roles.some((role) =>
    (sectionRoles[section] as readonly string[]).includes(role),
  );
  const me = useQuery({
    ...adminMeOptions(api, scope, lifecycle),
    enabled: allowed,
  });
  const retry = () => void me.refetch();
  // Stable per account revision (an identity/role change bumps the epoch).
  const recheck = useCallback(
    () =>
      void client.invalidateQueries({
        queryKey: queryKeys.adminMe(scope),
        exact: true,
      }),
    [client, scope.userId, scope.epoch],
  );
  const forbidden = (message: string) => (
    <NoPermissionState
      title={t('forbiddenTitle')}
      message={message}
      action={
        <Link className={buttonClassName} href="/account">
          {t('account')}
        </Link>
      }
    />
  );
  if (!allowed)
    return forbidden(t(section === 'super' ? 'superOnly' : 'adminOnly'));
  if (me.isPending) return <Skeleton label={t('loading')} />;
  const code = me.isError ? failureCode(me.error) : undefined;
  // A failed background re-read keeps current data unless it revoked access.
  if (code && (!me.data || code === 'ADMIN_INACTIVE' || isDenied(code))) {
    if (code === 'ADMIN_INACTIVE')
      return (
        <NoPermissionState
          title={t('inactiveTitle')}
          message={t('inactiveMessage')}
          action={
            <Button disabled={me.isFetching} onClick={retry}>
              {t('checkAgain')}
            </Button>
          }
        />
      );
    if (isDenied(code)) return forbidden(t('adminOnly'));
    return (
      <ErrorState
        title={t('errorTitle')}
        message={te(adminErrorKey(code))}
        action={
          <Button disabled={me.isFetching} onClick={retry}>
            {t('retry')}
          </Button>
        }
      />
    );
  }
  if (!me.data) return <Skeleton label={t('loading')} />;
  if (section === 'super' && !me.data.isSuper) return forbidden(t('superOnly'));
  return (
    <Context.Provider
      value={{
        api,
        scope,
        lifecycle,
        me: me.data,
        recheck,
      }}
    >
      <Shell me={me.data}>{children}</Shell>
    </Context.Provider>
  );
}

function Shell({ me, children }: { me: AdminMe; children: ReactNode }) {
  const t = useTranslations('admin.shell');
  const path = usePathname();
  const item = (href: string, label: string, icon: string) => ({
    href,
    label,
    icon,
    current: path === href || path.startsWith(`${href}/`),
  });
  // Only implemented screens appear; entries never grant access.
  const canAudit = me.isSuper || me.permissions.reports.includes('view');
  const canCatalog = me.isSuper || me.permissions.catalog.includes('view');
  const canModerateVideos = me.isSuper || me.permissions.reviews.includes('view');
  const groups = [
    ...(me.isSuper
      ? [
          {
            label: t('platform'),
            items: [
              item('/super-admin/activity', t('activity'), '📄'),
              item('/super-admin/cities', t('cities'), '🏙️'),
            ],
          },
          {
            label: t('control'),
            items: [
              item('/super-admin/admins', t('admins'), '🛡️'),
              item('/super-admin/roles', t('roles'), '🔑'),
              item('/super-admin/settings', t('settings'), '🎚️'),
            ],
          },
        ]
      : []),
    ...(canModerateVideos
      ? [
          {
            label: t('moderation'),
            items: [item('/admin/videos', t('videosModeration'), '🎬')],
          },
        ]
      : []),
    ...(canCatalog
      ? [
          {
            label: t('catalog'),
            items: [
              item('/admin/categories', t('categories'), '🏷️'),
              item(
                '/admin/subcategory-suggestions',
                t('subcategorySuggestions'),
                '💡',
              ),
              item('/admin/keywords', t('keywords'), '🔤'),
            ],
          },
        ]
      : []),
    {
      label: t('system'),
      items: [
        ...(canAudit ? [item('/admin/audit', t('audit'), '🗂️')] : []),
        item('/admin/profile', t('profile'), '👤'),
      ],
    },
  ];
  return (
    <DashboardShell
      roleLabel={t(me.isSuper ? 'superAdmin' : 'admin')}
      navLabel={t('navLabel')}
      groups={groups}
      linkAs={Link}
    >
      {children}
    </DashboardShell>
  );
}
