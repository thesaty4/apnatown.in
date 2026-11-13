'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import { Card } from '@apnatown/ui/cards/Card';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import {
  Alert,
  BusinessStatusBadge,
  StatusBanner,
  businessName,
  dashboardBase,
  errorKey,
} from '../parts';
import { useReactivateBusiness } from '../queries';

export function Submitted({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('business.onboarding');
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <Card
      padded
      className="grid justify-items-center gap-3 text-center"
      role="status"
    >
      <span aria-hidden="true" className="text-art">
        🎉
      </span>
      <h2 ref={ref} tabIndex={-1} className="m-0 text-h2 focus:outline-none">
        {t('submittedTitle')}
      </h2>
      <p className="m-0 max-w-state-copy text-text-2">{t('submittedBody')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href={`${dashboardBase(kind)}/overview`}
          className={buttonVariantClassName('primary')}
        >
          {t('goOverview')}
        </Link>
        <Link
          href={`${dashboardBase(kind)}/profile`}
          className={buttonVariantClassName('outline')}
        >
          {t('completeProfile')}
        </Link>
      </div>
    </Card>
  );
}

/** Pending / approved / suspended / inactive: no wizard, only the state. */
export function StatusScreen({ owner }: { owner: BusinessOwner }) {
  const t = useTranslations('business.onboarding');
  const common = useTranslations('business.common');
  const te = useTranslations('business.errors');
  const locale = useLocale();
  const reactivate = useReactivateBusiness(owner.kind);
  const code = reactivate.mutation.isError
    ? failureCode(reactivate.mutation.error)
    : undefined;
  return (
    <div className="grid gap-3">
      <Card padded className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">
          {businessName(owner, locale) ?? common('unnamed')}
        </span>
        <BusinessStatusBadge status={owner.status} />
      </Card>
      {owner.status === 'approved' ? (
        <Alert tone="ok" role="status" title={t('approved.title')}>
          <p className="m-0">{t('approved.body')}</p>
        </Alert>
      ) : (
        <StatusBanner
          business={owner}
          reactivating={reactivate.mutation.isPending}
          onReactivate={() => void reactivate.run(owner.version)}
        />
      )}
      {code && (
        <Alert tone="bad" role="alert">
          <p className="m-0">{te(errorKey(code))}</p>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`${dashboardBase(owner.kind)}/overview`}
          className={buttonVariantClassName('primary')}
        >
          {t('goOverview')}
        </Link>
        {owner.capabilities.editProfile && (
          <Link
            href={`${dashboardBase(owner.kind)}/profile`}
            className={buttonVariantClassName('outline')}
          >
            {t('completeProfile')}
          </Link>
        )}
      </div>
    </div>
  );
}
