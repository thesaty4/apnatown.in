'use client';

import { useState, type FormEvent } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import {
  FOLLOWER_ANNOUNCEMENT_KINDS,
  type FollowerAnnouncementKind,
  type FollowerInsights,
} from '@apnatown/shared';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import { formatCompactCount } from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { failureCode } from '../../../shared/api/result';
import { BarChart } from '../../../shared/ui/BarChart';
import { KpiCard } from '../../../shared/ui/KpiCard';
import { OwnerGate } from '../../businesses/BusinessDashboard';
import { OwnerQueryState } from '../../businesses/OwnerQueryState';
import { LockedNote, errorKey } from '../../businesses/parts';
import { useAnnounce, useFollowerInsights } from './queries';

/** S-VEND-15 / S-PROV-11: KPIs, eight-week growth, announce to followers. */
export function FollowersScreen({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <FollowersGate business={business} />}
    </OwnerGate>
  );
}

function FollowersGate({ business }: { business: BusinessOwner }) {
  const t = useTranslations('engagement.followers');
  const approved = business.status === 'approved';
  const query = useFollowerInsights(business.kind, approved);
  return (
    <div className="grid min-w-0 gap-4">
      <h1 className="m-0 text-h1">{t('title')}</h1>
      {approved ? (
        <OwnerQueryState query={query} loadingLabel={t('loading')} errorTitle={t('error')}>
          {(data) => <FollowersBody kind={business.kind} data={data} />}
        </OwnerQueryState>
      ) : (
        <Card padded>
          <LockedNote />
        </Card>
      )}
    </div>
  );
}

function FollowersBody({ kind, data }: { kind: BusinessKind; data: FollowerInsights }) {
  const t = useTranslations('engagement.followers');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const format = useFormatter();
  const count = (value: number) => formatCompactCount(value, locale);
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 tablet:grid-cols-3">
        <li>
          <KpiCard label={t('kpiFollowers')} value={count(data.followers)} unavailableLabel={t('unavailable')} />
        </li>
        <li>
          <KpiCard label={t('kpiGained')} value={count(data.gainedThisWeek)} unavailableLabel={t('unavailable')} />
        </li>
        <li>
          <KpiCard label={t('kpiVideos')} value={count(data.approvedVideos)} unavailableLabel={t('unavailable')} />
        </li>
      </ul>
      <Card padded className="grid gap-2">
        <BarChart
          caption={t('growthTitle')}
          tableLabel={t('showTable')}
          series={[{ key: 'gained', label: t('gained'), colorClass: 'bg-primary' }]}
          rows={data.growth.map((week) => ({
            label: format.dateTime(new Date(`${week.start}T00:00:00Z`), {
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC',
            }),
            values: { gained: week.gained },
          }))}
        />
        <p className="m-0 text-caption text-muted">{t('growthNote')}</p>
      </Card>
      <AnnounceForm kind={kind} />
      <Card padded className="grid gap-2">
        <h2 className="m-0 text-h4">{t('recentTitle')}</h2>
        {data.recentAnnouncements.length ? (
          <ul className="m-0 grid list-none gap-2 p-0">
            {data.recentAnnouncements.map((item) => (
              <li key={item.id} className="grid gap-0.5 border-t border-border pt-2 first:border-0 first:pt-0">
                <span className="text-caption text-muted">
                  {t(`kinds.${item.kind}`)} ·{' '}
                  {format.dateTime(new Date(item.createdAt), { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })}
                </span>
                <span className="[overflow-wrap:anywhere]">
                  {(locale === 'hi' && item.messageHi) || item.messageEn}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-small text-muted">{t('recentEmpty')}</p>
        )}
      </Card>
    </>
  );
}

function AnnounceForm({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('engagement.followers');
  const te = useTranslations('business.errors');
  const mutation = useAnnounce(kind);
  const [type, setType] = useState<FollowerAnnouncementKind>('product');
  const [messageEn, setMessageEn] = useState('');
  const [messageHi, setMessageHi] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const busy = mutation.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!messageEn.trim()) return setInvalid(true);
    setSent(null);
    mutation.reset();
    void mutation.run(
      { kind: type, messageEn: messageEn.trim(), ...(messageHi.trim() && { messageHi: messageHi.trim() }) },
      (result) => {
        setMessageEn('');
        setMessageHi('');
        setSent(result.eligibleRecipients);
      },
    );
  };
  return (
    <Card padded>
      <form noValidate className="grid gap-3" onSubmit={submit}>
        <h2 className="m-0 text-h4">{t('announceTitle')}</h2>
        <fieldset className="m-0 flex min-w-0 flex-wrap gap-3 border-0 p-0">
          <legend className="mb-2 font-semibold">{t('kindLabel')}</legend>
          {FOLLOWER_ANNOUNCEMENT_KINDS.map((value) => (
            <Radio
              key={value}
              name="announcement-kind"
              value={value}
              label={t(`kinds.${value}`)}
              checked={type === value}
              disabled={busy}
              onChange={() => setType(value)}
            />
          ))}
        </fieldset>
        <TextArea
          label={t('messageEn')}
          value={messageEn}
          maxLength={200}
          required
          disabled={busy}
          error={invalid ? t('messageRequired') : undefined}
          onChange={(event) => {
            setMessageEn(event.target.value);
            setInvalid(false);
          }}
        />
        <TextArea
          label={t('messageHi')}
          hint={t('messageHiHint')}
          value={messageHi}
          maxLength={200}
          disabled={busy}
          onChange={(event) => setMessageHi(event.target.value)}
        />
        <p className="m-0 text-caption text-muted">{t('deliveryNote')}</p>
        <Button type="submit" loading={busy} className="justify-self-start">
          {t('send')}
        </Button>
        {sent !== null && (
          <p role="status" className="m-0 text-small">
            ✓ {sent > 0 ? t('queued', { count: sent }) : t('queuedNone')}
          </p>
        )}
        {mutation.isError && (
          <p role="alert" className="m-0 text-small text-error">
            {te(errorKey(failureCode(mutation.error)))}
          </p>
        )}
      </form>
    </Card>
  );
}
