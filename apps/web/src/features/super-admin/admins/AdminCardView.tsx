'use client';

import type { ReactNode } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { AdminCard } from '@apnatown/shared/admin';
import { AdminCollapsibleCard } from '@apnatown/ui/admin/AdminCollapsibleCard';
import { Badge, StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { usePermissionLabels } from '../../admin';
import { geoName } from '../../geo/api';

export type CardAction = 'areas' | 'permissions' | 'role' | 'status';

export function AdminStatusBadge({ status }: { status: AdminCard['status'] }) {
  const t = useTranslations('superAdmin.admins');
  return status === 'active' ? (
    <StatusBadge tone="ap-approved" icon="✓" label={t('active')} />
  ) : (
    <StatusBadge tone="ap-inactive" icon="⏸" label={t('inactive')} />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-small font-semibold text-text-2">{label}</dt>
      <dd className="m-0 min-w-0">{children}</dd>
    </div>
  );
}

/** Collapsed: name, role, scope, status. Expanded: contact, cities/zones/areas,
 * permissions, audit shortcut and actions (prototype js18.js:55–65). */
export function AdminCardView({
  card,
  self,
  onAction,
}: {
  card: AdminCard;
  self: boolean;
  onAction: (action: CardAction) => void;
}) {
  const t = useTranslations('superAdmin.admins');
  const format = useFormatter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const labels = usePermissionLabels();
  const granted = labels.granted(card.permissions);
  const zonesUnavailable = card.unavailable.includes('zones');
  const wholeCity = new Set(card.cityWideIds);
  const scope =
    card.areas.length === 0 && card.cityWideIds.length === 0
      ? t('noneYet')
      : t('scopeSummary', {
          cities: card.cities.length,
          areas: card.areas.length,
        });
  return (
    <AdminCollapsibleCard
      title={card.name}
      subtitle={`${card.role.name} · ${scope}`}
      toggleLabel={t('details', { name: card.name })}
      badges={
        <>
          <AdminStatusBadge status={card.status} />
          {self && <Badge tone="info" label={t('you')} />}
        </>
      }
    >
      <dl className="m-0 grid gap-3 tablet:grid-cols-2">
        <Field label={t('phone')}>
          {card.phoneE164 ? (
            <span className="flex flex-wrap items-center gap-2">
              <span dir="ltr">{card.phoneE164}</span>
              <a
                className="inline-flex min-h-touch items-center underline"
                href={`tel:${card.phoneE164}`}
                aria-label={t('callName', { name: card.name })}
              >
                {t('call')}
              </a>
            </span>
          ) : (
            <span className="text-text-2">{t('noPhone')}</span>
          )}
        </Field>
        <Field label={t('email')}>
          <span dir="ltr" className="[overflow-wrap:anywhere]">
            {card.email}
          </span>
        </Field>
        <Field label={t('lastActive')}>
          {card.lastActiveAt
            ? format.dateTime(new Date(card.lastActiveAt), {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : t('never')}
        </Field>
        <Field label={t('commsScope')}>
          {card.communicationScopes.length
            ? card.communicationScopes
                .map((scope) => t(`comms.${scope}`))
                .join(', ')
            : t('none')}
        </Field>
        <Field label={t('citiesZones')}>
          <div className="grid gap-2">
            {card.cities.length ? (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {card.cities.map((city) => (
                  <li key={city.id}>
                    <Badge
                      icon="🏙️"
                      tone={wholeCity.has(city.id) ? 'info' : 'neutral'}
                      label={
                        wholeCity.has(city.id)
                          ? t('wholeCity', { city: geoName(city, locale) })
                          : geoName(city, locale)
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-text-2">{t('noneYet')}</span>
            )}
            <span className="text-small text-text-2">
              {zonesUnavailable
                ? t('zonesUnavailableNote')
                : card.zones.length
                  ? card.zones.map((zone) => zone.name).join(', ')
                  : t('noZones')}
            </span>
          </div>
        </Field>
        <Field label={t('areas')}>
          {card.areas.length ? (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {card.areas.map((area) => (
                <li key={area.id}>
                  <Badge icon="📍" label={geoName(area, locale)} />
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-text-2">{t('noneYet')}</span>
          )}
        </Field>
      </dl>
      <div className="grid gap-1">
        <h4 className="text-small font-semibold text-text-2">
          {t('permissionsSummary')}
        </h4>
        {granted.length ? (
          <ul className="m-0 grid list-none gap-1 p-0">
            {granted.map((module) => (
              <li key={module}>
                <span className="font-medium">{labels.module(module)}</span>
                {': '}
                <span className="text-text-2">
                  {labels.summary(card.permissions, module)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-2">{t('noPermissions')}</p>
        )}
      </div>
      <div className="grid gap-1">
        <div>
          <Button
            variant="outline"
            disabled
            aria-describedby={`audit-${card.id}`}
          >
            {t('auditLog')}
          </Button>
        </div>
        <p id={`audit-${card.id}`} className="text-small text-muted">
          {t('auditUnavailable')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onAction('areas')}>
          {t('editAreas')}
        </Button>
        <Button variant="secondary" onClick={() => onAction('permissions')}>
          {t('permissions')}
        </Button>
        <Button variant="secondary" onClick={() => onAction('role')}>
          {t('changeRole')}
        </Button>
        <Button
          variant={card.status === 'active' ? 'danger' : 'primary'}
          disabled={self}
          aria-describedby={self ? `self-${card.id}` : undefined}
          onClick={() => onAction('status')}
        >
          {t(card.status === 'active' ? 'deactivate' : 'activate')}
        </Button>
      </div>
      {self && (
        <p id={`self-${card.id}`} className="text-small text-muted">
          {t('selfNote')}
        </p>
      )}
    </AdminCollapsibleCard>
  );
}
