'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { isDashboardPath } from '../../shared/i18n/preferences';
import { useSession } from '../../shared/auth/SessionProvider';
import { BellBadge, useFeedContext } from './BellBadge';
import { NotificationFeed } from './NotificationFeed';
import type { NotificationRole } from './keys';

/** Customer header bell → `/notifications`. Hidden for guests, sessions
 * without the customer role and dashboards (their shell has its own bell). */
export function CustomerBell() {
  const path = usePathname();
  const { state } = useSession();
  const customer =
    state.kind === 'ready' && state.data.roles.includes('customer');
  const context = useFeedContext(customer ? 'customer' : undefined);
  if (!context || isDashboardPath(path)) return null;
  return (
    <BellBadge
      key={context.scope.epoch}
      context={context}
      href="/notifications"
    />
  );
}

/** Vendor/provider dashboard bell → the role's notifications screen. */
export function DashboardBell({
  role,
  href,
}: {
  role: NotificationRole;
  href: string;
}) {
  const context = useFeedContext(role);
  if (!context) return null;
  return <BellBadge key={context.scope.epoch} context={context} href={href} />;
}

/** Admin/rider bell: no separate screen per spec, so the feed opens in a
 * sheet. The dialog owns focus trap/return and Escape. */
export function SheetBell({ role }: { role: NotificationRole }) {
  const t = useTranslations('notifications.feed');
  const [open, setOpen] = useState(false);
  const context = useFeedContext(role);
  if (!context) return null;
  return (
    <>
      <BellBadge
        key={context.scope.epoch}
        context={context}
        expanded={open}
        onOpen={() => setOpen(true)}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t('title')}
        closeLabel={t('close')}
      >
        {open && (
          <NotificationFeed
            key={context.scope.epoch}
            context={context}
            headingLevel="h2"
            showHeading={false}
          />
        )}
      </Sheet>
    </>
  );
}
