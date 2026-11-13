'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { ADMIN_MODULES } from '@apnatown/shared/admin';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Card } from '@apnatown/ui/cards/Card';
import { Logout } from '../../shared/auth/Logout';
import { cityOptions, geoName } from '../geo/api';
import { useAdmin } from './AdminShell';
import { usePermissionLabels } from './parts';

/** S-ADMN-17: own grants exactly as the API reports them. Area grants never
 * imply whole-city authority; only `cityWideIds` does. */
export function AdminProfile() {
  const { me, api } = useAdmin();
  const t = useTranslations('admin.profile');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const labels = usePermissionLabels();
  const cities = useInfiniteQuery({
    ...cityOptions(api),
    enabled: me.cityWideIds.length > 0,
  });
  const cityName = (id: string) => {
    const city = cities.data?.pages
      .flatMap((page) => page.items)
      .find((item) => item.id === id);
    return city ? geoName(city, locale) : t('cityUnknown');
  };
  return (
    <div className="grid gap-stack-gap">
      <h1 className="text-h1">{t('title')}</h1>
      <Card padded className="flex items-center gap-4">
        <Avatar
          label=""
          emoji={me.name.trim().charAt(0).toUpperCase() || '?'}
        />
        <div className="grid min-w-0 gap-1">
          <p className="font-display text-h3">{me.name}</p>
          {me.emailMasked && (
            <p className="text-small text-text-2">{me.emailMasked}</p>
          )}
          <div>
            <Badge
              tone="secondary"
              icon="🛡️"
              label={t(me.isSuper ? 'roleSuper' : 'roleAdmin')}
            />
          </div>
        </div>
      </Card>

      <Card padded className="grid gap-3">
        <h2 className="text-h3">{t('assignedAreas')}</h2>
        {me.isSuper && <p className="text-text-2">{t('superScope')}</p>}
        {me.areas.length === 0 && me.cityWideIds.length === 0 ? (
          !me.isSuper && <p className="text-text-2">{t('noneYet')}</p>
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {me.cityWideIds.map((id) => (
              <li key={`city-${id}`}>
                <Badge
                  tone="info"
                  icon="🏙️"
                  label={t('wholeCity', { city: cityName(id) })}
                />
              </li>
            ))}
            {me.areas.map((area) => (
              <li key={area.id}>
                <Badge icon="📍" label={geoName(area, locale)} />
              </li>
            ))}
          </ul>
        )}
        <h3 className="text-h4">{t('comms')}</h3>
        <p className="text-text-2">
          {me.communicationScopes.length
            ? me.communicationScopes
                .map((scope) => t(`commsScope.${scope}`))
                .join(', ')
            : t('commsNone')}
        </p>
      </Card>

      <Card padded className="grid gap-3">
        <h2 className="text-h3">{t('myPermissions')}</h2>
        <dl className="m-0 grid gap-2">
          {ADMIN_MODULES.map((module) => (
            <div
              key={module}
              className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 last:border-b-0"
            >
              <dt className="font-medium">{labels.module(module)}</dt>
              <dd className="m-0 text-text-2">
                {labels.summary(me.permissions, module)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Logout />
    </div>
  );
}
