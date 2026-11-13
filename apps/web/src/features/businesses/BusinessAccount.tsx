'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { DehydratedState } from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Card } from '@apnatown/ui/cards/Card';
import { publicHref } from '../../shared/i18n/preferences';
import { LanguageSwitch } from '../../shared/ui/LanguageSwitch';
import { Profile } from '../users/Profile';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card padded>
      <section className="grid gap-2">
        <h2 className="m-0 text-h2">{title}</h2>
        {children}
      </section>
    </Card>
  );
}

/**
 * S-VEND-18 / S-PROV-16. Owner details are the caller's own Users profile
 * (login phone read-only pending Q-43); language uses the shared preference
 * switch. Payout and staff have no owning contract yet (Payments / Q-10), so
 * they are informational only — no mutation is offered.
 */
export function BusinessAccount({
  kind,
  initial,
  owner,
}: {
  kind: BusinessKind;
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const t = useTranslations('business.account');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (
    <div className="grid gap-4">
      <h1 className="m-0 text-h1">{t('settingsTitle')}</h1>
      <Profile
        initial={initial}
        owner={owner}
        onboarding={false}
        heading="h2"
      />
      <Section title={t('securityTitle')}>
        <p className="m-0 text-muted">{t('securityOtp')}</p>
      </Section>
      <Section title={t('languageTitle')}>
        <p className="m-0 text-muted">{t('languageHint')}</p>
        <div>
          <LanguageSwitch />
        </div>
      </Section>
      {kind === 'shop' && (
        <>
          <Section title={t('payoutTitle')}>
            <p className="m-0 text-muted">{t('payoutUnavailable')}</p>
          </Section>
          <Section title={t('staffTitle')}>
            <p className="m-0 text-muted">{t('staffUnavailable')}</p>
          </Section>
        </>
      )}
      <Section title={t('helpTitle')}>
        <Link
          className="inline-flex min-h-touch items-center underline"
          href={publicHref('/help', locale)}
        >
          {t('helpLink')}
        </Link>
      </Section>
    </div>
  );
}
