'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { privateQueryOptions } from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import { failureCode } from '../../../shared/api/result';
import {
  adminErrorKey,
  isDenied,
  useAdmin,
  type AdminContext,
} from '../../admin';
import { getSettings } from './api';
import { DirtyProvider } from './form';
import { BrandingSettingsForm } from './BrandingSettingsForm';
import { DeliverySettingsForm } from './DeliverySettingsForm';
import { MoneySettingsForm } from './MoneySettingsForm';
import { PaymentsSettings } from './PaymentsSettings';
import { PolicySettings } from './PolicySettingsForm';
import { IntegrationsSettings } from './IntegrationsSettings';
import { SeoSettingsForm } from './SeoSettingsForm';
import { FeatureFlagList } from './FeatureFlagList';
import { LegalPageEditor } from './LegalPageEditor';

const sections = {
  branding: BrandingSettingsForm,
  delivery: DeliverySettingsForm,
  commission: MoneySettingsForm,
  payments: PaymentsSettings,
  policies: PolicySettings,
  notifications: IntegrationsSettings,
  seo: SeoSettingsForm,
  flags: FeatureFlagList,
  legal: LegalPageEditor,
};
type Section = keyof typeof sections;
const order = Object.keys(sections) as Section[];
const parseSection = (value: string | null): Section =>
  order.find((section) => section === value) ?? 'delivery';

export function settingsOptions({
  api,
  scope,
  lifecycle,
}: Pick<AdminContext, 'api' | 'scope' | 'lifecycle'>) {
  return privateQueryOptions(
    queryKeys.settings(scope),
    scope.epoch,
    lifecycle,
    (signal) => getSettings(api, signal),
  );
}

/** S-SUPR-06 Global settings. The section is URL state (`?section=`); edits
 * are local drafts guarded on section switch, Back and page unload. */
export function Settings() {
  const context = useAdmin();
  const t = useTranslations('superAdmin.settings');
  const te = useTranslations('admin.errors');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = parseSection(params.get('section'));
  const [shown, setShown] = useState(requested);
  const [pending, setPending] = useState<Section>();
  const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(new Set());
  const allowed = useRef<Section>(undefined);
  const dirty = dirtyIds.size > 0;
  const query = useQuery(settingsOptions(context));
  const code = query.isError ? failureCode(query.error) : undefined;
  const { recheck } = context;

  const report = useCallback((id: string, value: boolean) => {
    setDirtyIds((current) => {
      if (current.has(id) === value) return current;
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const href = useCallback(
    (section: Section) => `${pathname}?${new URLSearchParams({ section })}`,
    [pathname],
  );

  // URL changes (chips, Back/Forward) switch sections only without unsaved
  // edits; otherwise the URL is restored and the discard question is asked.
  useEffect(() => {
    if (requested === shown) return;
    if (!dirty || allowed.current === requested) {
      allowed.current = undefined;
      setShown(requested);
      return;
    }
    setPending(requested);
    router.replace(href(shown), { scroll: false });
  }, [requested, shown, dirty, router, href]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (code && isDenied(code)) recheck();
  }, [code, recheck]);

  const go = (section: Section) => {
    if (section === shown) return;
    if (dirty) setPending(section);
    else router.push(href(section), { scroll: false });
  };

  let body;
  if (query.isPending) body = <Skeleton label={t('loading')} />;
  else if (code && isDenied(code))
    body = (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={te(adminErrorKey(code))}
        action={<Button onClick={recheck}>{t('checkAgain')}</Button>}
      />
    );
  else if (!query.data)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={te(adminErrorKey(code ?? 'REQUEST_FAILED'))}
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
  else {
    const Section = sections[shown];
    body = (
      <section
        id="settings-panel"
        aria-labelledby={`settings-chip-${shown}`}
        className="grid gap-4"
      >
        <Section data={query.data} />
      </section>
    );
  }

  return (
    <DirtyProvider value={report}>
      <div className="grid min-w-0 gap-4">
        <h1 className="text-h1">{t('title')}</h1>
        <nav aria-label={t('sectionsLabel')}>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {order.map((section) => (
              <li key={section} className="shrink-0">
                <Chip
                  id={`settings-chip-${section}`}
                  label={t(`sections.${section}`)}
                  selected={section === shown}
                  aria-controls="settings-panel"
                  onClick={() => go(section)}
                />
              </li>
            ))}
          </ul>
        </nav>
        {body}
      </div>
      <ConfirmDialog
        open={pending !== undefined}
        onOpenChange={(open) => !open && setPending(undefined)}
        title={t('discard.title')}
        impact={t('discard.impact')}
        cancelLabel={t('discard.keep')}
        confirmLabel={t('discard.confirm')}
        tone="danger"
        onConfirm={() => {
          if (!pending) return;
          allowed.current = pending;
          setPending(undefined);
          router.push(href(pending), { scroll: false });
        }}
      />
    </DirtyProvider>
  );
}
