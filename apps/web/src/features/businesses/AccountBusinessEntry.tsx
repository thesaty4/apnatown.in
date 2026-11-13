'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Card } from '@apnatown/ui/cards/Card';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { failureCode } from '../../shared/api/result';
import { BusinessStatusBadge, businessName, dashboardBase } from './parts';
import { useBusinessMe } from './queries';

/** Account entry: register a shop / join as provider, or open the dashboard. */
export function AccountBusinessEntry() {
  const t = useTranslations('business.account');
  return (
    <Card padded className="grid gap-3">
      <div>
        <h2 className="m-0 text-h4">{t('title')}</h2>
        <p className="m-0 text-small text-text-2">{t('subtitle')}</p>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        <Entry kind="shop" />
        <Entry kind="provider" />
      </ul>
    </Card>
  );
}

function Entry({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('business.account');
  const common = useTranslations('business.common');
  const locale = useLocale();
  const me = useBusinessMe(kind);
  const base = dashboardBase(kind);
  const icon = kind === 'shop' ? '🏪' : '🔧';
  const code = me.isError ? failureCode(me.error) : undefined;
  let body;
  if (me.isPending) body = <Skeleton label={t('loading')} />;
  else if (me.data) {
    const href =
      me.data.status === 'draft' ? `${base}/onboarding` : `${base}/overview`;
    body = (
      <>
        <div className="grid min-w-0 flex-1 basis-48 gap-1">
          <span className="font-semibold [overflow-wrap:anywhere]">
            {businessName(me.data, locale) ??
              t(kind === 'shop' ? 'yourShop' : 'yourService')}
          </span>
          <BusinessStatusBadge status={me.data.status} />
        </div>
        <Link
          href={href}
          className={buttonVariantClassName('outline', 'small')}
        >
          {me.data.status === 'draft' ? t('continue') : t('open')}
        </Link>
      </>
    );
  } else if (code === 'BUSINESS_NOT_FOUND')
    body = (
      <>
        <div className="grid min-w-0 flex-1 basis-48 gap-1">
          <span className="font-semibold">
            {t(kind === 'shop' ? 'registerShop' : 'joinProvider')}
          </span>
          <span className="text-small text-text-2">
            {t(kind === 'shop' ? 'registerShopHint' : 'joinProviderHint')}
          </span>
        </div>
        <Link
          href={`${base}/onboarding`}
          className={buttonVariantClassName('primary', 'small')}
        >
          {t('start')}
        </Link>
      </>
    );
  else
    body = (
      <div
        role="alert"
        className="flex flex-1 flex-wrap items-center gap-2 text-small"
      >
        <span className="flex-1">
          {t(kind === 'shop' ? 'shopFailed' : 'providerFailed')}
        </span>
        <Button
          size="small"
          variant="outline"
          disabled={me.isFetching}
          onClick={() => void me.refetch()}
        >
          {common('retry')}
        </Button>
      </div>
    );
  return (
    <li className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-border p-3">
      <span aria-hidden="true" className="text-h3">
        {icon}
      </span>
      {body}
    </li>
  );
}
