'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import { DashboardShell } from '@apnatown/ui/layout/DashboardShell';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { AccessState } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import { useBusinessMe } from './queries';
import { dashboardBase, deniedCodes, errorKey } from './parts';
import { DashboardBell } from '../notifications/Bells';
import { useOwnerOrdersLive } from '../owner-orders/queries';

type NavEntry = {
  /** `null` = planned screen without a route: shown as "Coming soon". */
  path: string | null;
  key: string;
  icon: string;
};

/** Prototype NAV groups; only implemented screens are links. */
const nav: Record<BusinessKind, { group: string; items: NavEntry[] }[]> = {
  shop: [
    {
      group: 'sell',
      items: [
        { path: '/overview', key: 'overview', icon: '📊' },
        { path: '/orders', key: 'orders', icon: '📦' },
        { path: '/products', key: 'products', icon: '🏷️' },
        { path: '/services', key: 'services', icon: '🔧' },
        { path: '/enquiries', key: 'enquiries', icon: '💬' },
        { path: '/inventory', key: 'inventory', icon: '🗃️' },
        { path: null, key: 'offers', icon: '₹' },
      ],
    },
    {
      group: 'grow',
      items: [
        { path: null, key: 'reviews', icon: '⭐' },
        { path: null, key: 'followers', icon: '❤️' },
        { path: '/qr', key: 'qr', icon: '🔳' },
        { path: '/media', key: 'media', icon: '📷' },
        { path: '/profile', key: 'businessProfile', icon: '🏪' },
      ],
    },
    {
      group: 'account',
      items: [
        { path: null, key: 'earnings', icon: '💳' },
        { path: '/notifications', key: 'notifications', icon: '🔔' },
        { path: null, key: 'account', icon: '⚙️' },
      ],
    },
  ],
  provider: [
    {
      group: 'work',
      items: [
        { path: '/overview', key: 'overview', icon: '📊' },
        { path: '/enquiries', key: 'enquiries', icon: '💬' },
        { path: '/orders', key: 'orders', icon: '📦' },
        { path: '/products', key: 'products', icon: '🏷️' },
        { path: '/services', key: 'services', icon: '🔧' },
        { path: '/profile', key: 'profile', icon: '🪪' },
        { path: null, key: 'reviews', icon: '⭐' },
        { path: null, key: 'followers', icon: '❤️' },
      ],
    },
    {
      group: 'grow',
      items: [
        { path: '/media', key: 'media', icon: '📷' },
        { path: '/qr', key: 'qr', icon: '🔳' },
        { path: null, key: 'analytics', icon: '📈' },
      ],
    },
    {
      group: 'account',
      items: [
        { path: '/notifications', key: 'notifications', icon: '🔔' },
        { path: null, key: 'account', icon: '⚙️' },
      ],
    },
  ],
};

/** Vendor/provider dashboard frame (sidebar desktop, scrollable bar mobile). */
export function BusinessDashboard({
  kind,
  children,
}: {
  kind: BusinessKind;
  children: ReactNode;
}) {
  const t = useTranslations('business.nav');
  const common = useTranslations('business.common');
  const path = usePathname();
  const { state } = useSession();
  useOwnerOrdersLive(kind);
  if (state.kind !== 'ready') return <AccessState />;
  const base = dashboardBase(kind);
  const groups = nav[kind].map(({ group, items }) => ({
    label: t(group),
    items: items.map(({ path: target, key, icon }) => {
      const href = target ? `${base}${target}` : `${base}#${key}`;
      return {
        href,
        label: t(key),
        icon,
        // Sub-screens (e.g. an enquiry detail) keep their section current.
        current:
          target !== null && (path === href || path.startsWith(`${href}/`)),
        ...(target === null && { unavailable: common('comingSoon') }),
      };
    }),
  }));
  return (
    <DashboardShell
      roleLabel={`${kind === 'shop' ? '🏪' : '🔧'} ${common(kind === 'shop' ? 'vendor' : 'provider')}`}
      navLabel={t('label')}
      groups={groups}
      linkAs={Link}
    >
      <div className="mb-2 flex justify-end">
        <DashboardBell
          role={kind === 'shop' ? 'vendor' : 'provider'}
          href={`${base}/notifications`}
        />
      </div>
      {children}
    </DashboardShell>
  );
}

/**
 * Owner application gate shared by every dashboard screen: guest/expired
 * session, loading, no application, no permission, offline and error+retry.
 * The server's `capabilities` decide everything else.
 */
export function OwnerGate({
  kind,
  children,
  missing,
}: {
  kind: BusinessKind;
  children: (business: BusinessOwner) => ReactNode;
  /** Rendered instead of the "no application" state (onboarding start). */
  missing?: (() => ReactNode) | undefined;
}) {
  const t = useTranslations('business.common');
  const te = useTranslations('business.errors');
  const online = useOnline();
  const { state } = useSession();
  const me = useBusinessMe(kind);
  if (state.kind !== 'ready') return <AccessState />;
  if (me.data) return children(me.data);
  if (me.isPending)
    return me.fetchStatus === 'paused' || !online ? (
      <OfflineState
        headingLevel="h1"
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={null}
      />
    ) : (
      <Skeleton label={t('loading')} />
    );
  const code = failureCode(me.error);
  if (code === 'BUSINESS_NOT_FOUND' && missing) return missing();
  if (code === 'BUSINESS_NOT_FOUND')
    return (
      <EmptyState
        icon={kind === 'shop' ? '🏪' : '🔧'}
        title={t('noBusinessTitle')}
        message={t(kind === 'shop' ? 'noBusinessShop' : 'noBusinessProvider')}
        action={
          <Link
            className={buttonClassName}
            href={`${dashboardBase(kind)}/onboarding`}
          >
            {t('startOnboarding')}
          </Link>
        }
      />
    );
  if (deniedCodes.has(code))
    return (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={t('forbiddenMessage')}
        action={
          <Link className={buttonClassName} href="/account">
            {t('account')}
          </Link>
        }
      />
    );
  if (!online)
    return (
      <OfflineState
        headingLevel="h1"
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={
          <Button disabled={me.isFetching} onClick={() => void me.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  return (
    <ErrorState
      title={t('errorTitle')}
      message={te(errorKey(code))}
      action={
        <Button disabled={me.isFetching} onClick={() => void me.refetch()}>
          {t('retry')}
        </Button>
      }
    />
  );
}
