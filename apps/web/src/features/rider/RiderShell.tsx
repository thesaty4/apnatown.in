'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardShell } from '@apnatown/ui/layout/DashboardShell';
import { NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { AccessState } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { SheetBell } from '../notifications/Bells';
import { riderBase } from './parts';

type NavEntry = { path: string; key: string; icon: string };

/** Permission matrix rider groups (Deliver / Me); primary rhome, rreq, rearn, rprofile. */
const nav: { group: string; items: NavEntry[] }[] = [
  {
    group: 'deliver',
    items: [
      { path: '/home', key: 'home', icon: '🏠' },
      { path: '/requests', key: 'requests', icon: '🛵' },
      { path: '/active', key: 'active', icon: '🚚' },
      { path: '/history', key: 'history', icon: '📋' },
    ],
  },
  {
    group: 'me',
    items: [
      { path: '/earnings', key: 'earnings', icon: '💳' },
      { path: '/feedback', key: 'feedback', icon: '⭐' },
      { path: '/profile', key: 'profile', icon: '🪪' },
    ],
  },
];

/** Applicants without the rider role only get their application screens. */
const applicantNav: { group: string; items: NavEntry[] }[] = [
  {
    group: 'me',
    items: [
      { path: '/onboarding', key: 'onboarding', icon: '📝' },
      { path: '/profile', key: 'profile', icon: '🪪' },
    ],
  },
];

/**
 * Rider dashboard frame. `requireRider` screens show the no-permission state
 * to any other authenticated user (with a route to the application); the
 * role is a session claim only, the API still decides approval and access.
 */
export function RiderShell({
  requireRider = true,
  children,
}: {
  requireRider?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations('rider.nav');
  const common = useTranslations('rider.common');
  const path = usePathname();
  const { state } = useSession();
  if (state.kind !== 'ready') return <AccessState />;
  const rider = state.data.roles.includes('rider');
  const groups = (rider ? nav : applicantNav).map(({ group, items }) => ({
    label: t(group),
    items: items.map(({ path: target, key, icon }) => {
      const href = `${riderBase}${target}`;
      return { href, label: t(key), icon, current: path === href };
    }),
  }));
  return (
    <DashboardShell
      roleLabel={`🛵 ${common('role')}`}
      navLabel={t('label')}
      groups={groups}
      linkAs={Link}
    >
      {rider && (
        <div className="mb-2 flex justify-end">
          <SheetBell role="rider" />
        </div>
      )}
      {requireRider && !rider ? (
        <NoPermissionState
          title={common('notRiderTitle')}
          message={common('notRiderMessage')}
          action={
            <Link className={buttonClassName} href={`${riderBase}/onboarding`}>
              {common('becomeRider')}
            </Link>
          }
        />
      ) : (
        children
      )}
    </DashboardShell>
  );
}

/** Screen heading + optional trailing content; wraps for long Hindi. */
export function ScreenHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <h1 className="m-0 min-w-0 text-h1 [overflow-wrap:anywhere]">{title}</h1>
      {children}
    </div>
  );
}
