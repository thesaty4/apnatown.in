'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import {
  ErrorState,
  NoPermissionState,
  NotFoundState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { OwnerGate } from '../../businesses/BusinessDashboard';
import { LockedNote, StatusBanner } from '../../businesses/parts';
import { EditorForm } from './EditorForm';
import { productDeniedCodes, productErrorKey } from './errors';
import { productsHref } from './filters';
import { EditorSkeleton } from './parts';
import { useProduct } from './queries';

/** S-VEND-06 / S-PROV-07 add/edit product; `id` is a UUID or `new`. */
export function ProductEditor({
  kind,
  id,
  baseUrl,
}: {
  kind: BusinessKind;
  id: string;
  baseUrl: string;
}) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <Gate business={business} id={id} baseUrl={baseUrl} />}
    </OwnerGate>
  );
}

function Gate({
  business,
  id,
  baseUrl,
}: {
  business: BusinessOwner;
  id: string;
  baseUrl: string;
}) {
  const t = useTranslations('products.editor');
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <h1 className="m-0 text-h1">{t(id === 'new' ? 'addTitle' : 'editTitle')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  if (id === 'new')
    return (
      <EditorForm
        business={business}
        product={null}
        baseUrl={baseUrl}
        onReload={() => Promise.resolve(undefined)}
      />
    );
  return <Loader business={business} id={id} baseUrl={baseUrl} />;
}

function Loader({
  business,
  id,
  baseUrl,
}: {
  business: BusinessOwner;
  id: string;
  baseUrl: string;
}) {
  const t = useTranslations('products.editor');
  const te = useTranslations('products.errors');
  const online = useOnline();
  const query = useProduct(business.kind, id);
  const back = (
    <Link
      href={productsHref(business.kind)}
      className={buttonVariantClassName('primary')}
    >
      {t('backToList')}
    </Link>
  );

  if (query.data)
    return (
      <EditorForm
        key={query.data.id}
        business={business}
        product={query.data}
        baseUrl={baseUrl}
        onReload={async () => (await query.refetch()).data}
      />
    );
  if (query.isPending)
    return query.fetchStatus === 'paused' || !online ? (
      <OfflineState
        icon="📡"
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={null}
      />
    ) : (
      <EditorSkeleton label={t('loading')} />
    );
  const code = failureCode(query.error);
  if (code === 'PRODUCT_NOT_FOUND')
    return (
      <NotFoundState
        icon="🔍"
        title={t('notFoundTitle')}
        message={te('notFound')}
        action={back}
      />
    );
  if (productDeniedCodes.has(code))
    return (
      <NoPermissionState
        icon="🔒"
        title={t('forbiddenTitle')}
        message={te('forbidden')}
        action={back}
      />
    );
  return (
    <ErrorState
      icon="⚠️"
      title={t('errorTitle')}
      message={online ? te(productErrorKey(code)) : t('offlineMessage')}
      action={
        <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
          {t('retry')}
        </Button>
      }
    />
  );
}
