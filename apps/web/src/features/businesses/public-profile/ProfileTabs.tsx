'use client';

import { Suspense, useCallback, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Category } from '@apnatown/shared/catalog';
import { DiscoveryTabs } from '../../explore';
import { ListingsPanel } from './ListingsPanel';
import {
  PROFILE_TABS,
  profileSearch,
  readProfileState,
  type ProfileTab,
  type ProfileUrlState,
} from './url-state';

type Panels = Record<Exclude<ProfileTab, 'listings'>, ReactNode>;
type Props = {
  slug: string;
  kind: 'shop' | 'provider';
  categories: Category[];
  /** Server-rendered panels; only the interactive listings panel is client data. */
  panels: Panels;
};

/** S-CUST-06/07 profile sections with shareable, Back-friendly `?tab=` state. */
export function ProfileTabs(props: Props) {
  return (
    <Suspense fallback={<TabsView {...props} state={{ tab: 'about' }} onChange={() => {}} />}>
      <UrlTabs {...props} />
    </Suspense>
  );
}

function UrlTabs(props: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const state = readProfileState(new URLSearchParams(params));
  // Shallow history entry (no RSC refetch); useSearchParams re-syncs and the
  // browser restores scroll on Back/Forward.
  const onChange = useCallback(
    (next: ProfileUrlState) =>
      window.history.pushState(
        null,
        '',
        `${pathname}${profileSearch(new URLSearchParams(window.location.search), next)}`,
      ),
    [pathname],
  );
  return <TabsView {...props} state={state} onChange={onChange} />;
}

function TabsView({
  slug,
  kind,
  categories,
  panels,
  state,
  onChange,
}: Props & { state: ProfileUrlState; onChange: (next: ProfileUrlState) => void }) {
  const t = useTranslations('business.publicProfile.tabs');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (
    <div className="grid min-w-0">
      <DiscoveryTabs
        tab={state.tab}
        id="profile"
        label={t('label')}
        items={PROFILE_TABS.map((value) => ({ value, label: t(value) }))}
        onChange={(tab) => onChange({ tab })}
      />
      <div
        id="profile-panel"
        role="tabpanel"
        aria-labelledby={`profile-tab-${state.tab}`}
        tabIndex={0}
        className="min-w-0 rounded-sm focus-visible:ring-focus"
      >
        {state.tab === 'listings' ? (
          <ListingsPanel
            slug={slug}
            kind={kind}
            state={state}
            categories={categories}
            locale={locale}
            onChange={(patch) => onChange({ tab: 'listings', ...patch })}
          />
        ) : (
          panels[state.tab]
        )}
      </div>
    </div>
  );
}
