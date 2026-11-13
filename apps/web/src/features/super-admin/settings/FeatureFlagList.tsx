'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import {
  FUTURE_FEATURE_FLAGS,
  type FeatureFlagKey,
  type SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Card } from '@apnatown/ui/cards/Card';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { queryKeys } from '../../../shared/api/query-keys';
import { failureCode } from '../../../shared/api/result';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { AdminFailure, Notice, useAdmin } from '../../admin';
import { useSuperCommand } from '../queries';
import { putFeatureFlag } from './api';
import { messageKey } from './form';

/** Immediate versioned flag mutations (not Save-bound). The switch flips
 * optimistically; any failure restores the server state and refetches. */
export function FlagSwitches({
  data,
  flags,
}: {
  data: SuperAdminSettings;
  flags: readonly FeatureFlagKey[];
}) {
  const t = useTranslations('superAdmin.settings.flags');
  const { scope } = useAdmin();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const [notice, setNotice] = useState<string>();
  const queryKey = queryKeys.settings(scope);
  const setEnabled = (key: FeatureFlagKey, enabled: boolean) =>
    client.setQueryData<SuperAdminSettings>(
      queryKey,
      (old) =>
        old && {
          ...old,
          flags: old.flags.map((flag) =>
            flag.key === key ? { ...flag, enabled } : flag,
          ),
        },
    );
  const mutation = useSuperCommand(
    async (
      api,
      body: { key: FeatureFlagKey; enabled: boolean; expectedVersion: number },
      command,
    ) => {
      try {
        return await putFeatureFlag(api, body, command);
      } catch (error) {
        setEnabled(body.key, !body.enabled);
        void client.invalidateQueries({ queryKey });
        throw error;
      }
    },
  );
  const code = mutation.isError ? failureCode(mutation.error) : undefined;

  return (
    <div className="grid gap-2">
      <p className="text-small text-muted">{t('immediate')}</p>
      <ul className="grid gap-1">
        {flags.map((key) => {
          const flag = data.flags.find((item) => item.key === key);
          if (!flag) return null;
          const future = FUTURE_FEATURE_FLAGS.includes(key);
          const blocked = future || (!flag.enablable && !flag.enabled);
          const description = future
            ? t('future')
            : blocked
              ? t('needsSetup')
              : key === 'maintenance'
                ? t('maintenanceHint')
                : undefined;
          return (
            <li key={key}>
              <Switch
                label={t(`labels.${messageKey(key)}`)}
                {...(description && { description })}
                // A future product is never shown as on, even if forged.
                checked={future ? false : flag.enabled}
                disabled={blocked || mutation.isPending}
                onChange={(event) => {
                  const body = {
                    key,
                    enabled: event.target.checked,
                    expectedVersion: flag.version,
                  };
                  setNotice(undefined);
                  setEnabled(key, body.enabled);
                  void mutation.run(
                    { body, key: keys.for(JSON.stringify(body)) },
                    () => {
                      keys.clear();
                      setNotice(
                        t(body.enabled ? 'turnedOn' : 'turnedOff', {
                          name: t(`labels.${messageKey(key)}`),
                        }),
                      );
                    },
                  );
                }}
              />
            </li>
          );
        })}
      </ul>
      {code && <AdminFailure code={code} />}
      <Notice message={notice} />
    </div>
  );
}

const listed: readonly FeatureFlagKey[] = [
  'reviews',
  'guest_browse',
  'whatsapp',
  'maintenance',
  'booking',
  'donations',
];

export function FeatureFlagList({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings');
  return (
    <Card padded className="grid gap-3">
      <h2 className="text-h3">{t('sections.flags')}</h2>
      <FlagSwitches data={data} flags={listed} />
    </Card>
  );
}
