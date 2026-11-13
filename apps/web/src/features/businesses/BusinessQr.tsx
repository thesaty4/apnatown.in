'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import { Card } from '@apnatown/ui/cards/Card';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Input } from '@apnatown/ui/primitives/Input';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { useOnline } from '../../shared/hooks/use-online';
import { OwnerGate } from './BusinessDashboard';
import { useAreaName } from './ProfilePreview';
import { Alert, businessName, dashboardBase, publicPath } from './parts';
import { useQrSvg } from './qr';

type Template = 'poster' | 'tent' | 'sticker';
const templates: Template[] = ['poster', 'tent', 'sticker'];
const templateFrame: Record<Template, string> = {
  poster: 'w-full max-w-sheet',
  tent: 'w-full max-w-xs',
  sticker: 'aspect-square w-full max-w-64 content-center rounded-pill',
};

/** S-VEND-10 / S-PROV-13 QR studio. */
export function BusinessQr({
  kind,
  baseUrl,
}: {
  kind: BusinessKind;
  baseUrl: string;
}) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <Studio business={business} baseUrl={baseUrl} />}
    </OwnerGate>
  );
}

function Studio({
  business,
  baseUrl,
}: {
  business: BusinessOwner;
  baseUrl: string;
}) {
  const t = useTranslations('business.qr');
  const kind = business.kind;
  if (!business.slug)
    return (
      <div className="grid gap-4">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <EmptyState
          icon="🔗"
          title={t('noSlugTitle')}
          message={t('noSlug')}
          action={
            business.capabilities.submit ? (
              <Link
                href={`${dashboardBase(kind)}/onboarding`}
                className={buttonVariantClassName('primary')}
              >
                {t('finishApplication')}
              </Link>
            ) : null
          }
        />
      </div>
    );
  const url = new URL(publicPath(kind, business.slug), baseUrl).toString();
  return <Ready business={business} slug={business.slug} url={url} />;
}

function Ready({
  business,
  url,
}: {
  business: BusinessOwner;
  slug: string;
  url: string;
}) {
  const t = useTranslations('business.qr');
  const common = useTranslations('business.common');
  const locale = useLocale();
  const online = useOnline();
  const kind = business.kind;
  const [template, setTemplate] = useState<Template>('poster');
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const qr = useQrSvg(url);
  const area = useAreaName(business.cityId, business.areaId);
  const name = businessName(business, locale) ?? common('unnamed');
  const live = business.capabilities.publicProfile;
  const shareText = t('shareText', { name, url });
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied('copied');
    } catch {
      setCopied('failed');
    }
  }
  async function share() {
    try {
      await navigator.share({ title: name, text: shareText, url });
    } catch {
      // Dismissed share sheets are not errors.
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      <h1 className="m-0 text-h1 print:hidden">{t('title')}</h1>
      {!live && (
        <Alert tone="warn" role="note" title={t('notLiveTitle')}>
          <p className="m-0">{t('notLive')}</p>
        </Alert>
      )}
      <div className="grid min-w-0 items-start gap-4 desktop:grid-cols-2">
        <div className="grid min-w-0 justify-items-center gap-3">
          <div
            role="radiogroup"
            aria-label={t('template')}
            className="flex flex-wrap gap-2 justify-self-start print:hidden"
          >
            {templates.map((item) => (
              <Chip
                key={item}
                role="radio"
                aria-checked={template === item}
                selected={template === item}
                label={t(`templates.${item}`)}
                onClick={() => setTemplate(item)}
              />
            ))}
          </div>
          <div
            data-print-area
            className={`grid justify-items-center gap-2 border-3 border-primary bg-surface p-5 text-center text-text ${templateFrame[template]} ${template === 'sticker' ? '' : 'rounded-lg'}`}
          >
            <span aria-hidden="true" className="text-h1">
              {kind === 'shop' ? '🏪' : '🔧'}
            </span>
            <h2 className="m-0 text-h2 [overflow-wrap:anywhere]">{name}</h2>
            <p className="m-0 text-text-2">
              {t(kind === 'shop' ? 'scanShop' : 'scanProvider')}
            </p>
            {qr.isPending ? (
              <Skeleton label={t('rendering')} />
            ) : qr.isError ? (
              <div
                role="alert"
                className="grid justify-items-center gap-2 print:hidden"
              >
                <p className="m-0 text-small text-error">{t('renderFailed')}</p>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => void qr.refetch()}
                >
                  {t('retry')}
                </Button>
              </div>
            ) : (
              // Locally generated SVG data URI (no network, no stored asset).
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.data)}`}
                alt={t('qrAlt', { name })}
                width={220}
                height={220}
                className={`h-auto w-full rounded-sm ${template === 'sticker' ? 'max-w-40' : 'max-w-56'}`}
              />
            )}
            <p className="m-0 text-small">
              <b>
                Apna<span className="text-primary">Town</span>.in
              </b>
              {area && <> · {area}</>}
            </p>
          </div>
          <div className="flex w-full max-w-sheet flex-wrap gap-2 print:hidden">
            <Button
              className="flex-1"
              disabled={!online || !qr.isSuccess}
              onClick={() => window.print()}
            >
              <span aria-hidden="true">🖨️</span> {t('print')}
            </Button>
            <Button
              className="flex-1"
              variant="ghost"
              onClick={() => void copy()}
            >
              <span aria-hidden="true">📋</span> {t('copy')}
            </Button>
          </div>
          {!online && (
            <p
              role="status"
              className="m-0 text-small text-text-2 print:hidden"
            >
              <span aria-hidden="true">📴 </span>
              {t('offline')}
            </p>
          )}
          <p className="m-0 w-full max-w-sheet text-small text-muted print:hidden">
            {t('tip')}
          </p>
        </div>
        <Card padded className="grid min-w-0 gap-3 print:hidden">
          <h2 className="m-0 text-h4">
            {t(kind === 'shop' ? 'linkShop' : 'linkProvider')}
          </h2>
          <Input label={t('linkLabel')} readOnly value={url} dir="ltr" />
          <div className="flex flex-wrap gap-2">
            <Button size="small" variant="ghost" onClick={() => void copy()}>
              {t('copy')}
            </Button>
            <a
              className={buttonVariantClassName('secondary', 'small')}
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('whatsapp')}
              <span className="sr-only"> ({t('newTab')})</span>
            </a>
            <Button
              size="small"
              variant="ghost"
              aria-label={t('copyFor', { app: 'Instagram' })}
              onClick={() => void copy()}
            >
              Instagram
            </Button>
            <Button
              size="small"
              variant="ghost"
              aria-label={t('copyFor', { app: 'Facebook' })}
              onClick={() => void copy()}
            >
              Facebook
            </Button>
            {canShare && (
              <Button
                size="small"
                variant="outline"
                onClick={() => void share()}
              >
                {t('share')}
              </Button>
            )}
          </div>
          <p
            role="status"
            aria-live="polite"
            className="m-0 min-h-5 text-small"
          >
            {copied === 'copied'
              ? t('copied')
              : copied === 'failed'
                ? t('copyFailed')
                : ''}
          </p>
          {live && (
            <Link
              href={publicPath(kind, business.slug ?? '')}
              className="text-small font-semibold text-primary"
            >
              {common('viewPublic')}
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
