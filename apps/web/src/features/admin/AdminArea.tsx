import 'server-only';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { readSession } from '../../shared/auth/server';
import { publicHref } from '../../shared/i18n/preferences';
import { AdminShell } from './AdminShell';
import { hasSectionRole, hydrateAdminMe, type AdminSection } from './server';

/** Server role gate + current `/admin/me` hydration for every dashboard page. */
export async function AdminArea({
  section,
  children,
}: {
  section: AdminSection;
  children: ReactNode;
}) {
  if (!(await hasSectionRole(section))) {
    const t = await getTranslations('admin.state');
    const common = await getTranslations('common.actions');
    const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
    return (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={t(section === 'super' ? 'superOnly' : 'adminOnly')}
        action={
          <Link className={buttonClassName} href={publicHref('/', locale)}>
            {common('home')}
          </Link>
        }
      />
    );
  }
  const session = await readSession();
  return (
    <AdminShell
      section={section}
      initial={await hydrateAdminMe()}
      owner={session.kind === 'ready' ? session.data.userId : undefined}
    >
      {children}
    </AdminShell>
  );
}
