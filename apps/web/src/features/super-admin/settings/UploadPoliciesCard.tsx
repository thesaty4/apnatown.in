'use client';

import { useTranslations } from 'next-intl';
import {
  IMAGE_POLICY_CEILINGS,
  IMAGE_PURPOSES,
  imagePolicyWithinCeiling,
  type ImagePolicy,
  type ImagePurpose,
  type SettingValue,
  type SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Card } from '@apnatown/ui/cards/Card';
import { Input } from '@apnatown/ui/primitives/Input';
import { Switch } from '@apnatown/ui/primitives/Selection';
import {
  ConfiguredBadge,
  FormCard,
  SetupTasks,
  textOf,
  toNumber,
  useSectionForm,
  type Issues,
  messageKey,
} from './form';

const limits = [
  'maxBytes',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
] as const;
type Limit = (typeof limits)[number];
type Row = Record<Limit, string> & { enabled: boolean; original: ImagePolicy };
type Form = Partial<Record<ImagePurpose, Row>>;

function toForm(values: { uploads?: unknown }): Form {
  const uploads = values.uploads as SettingValue<'uploads'> | null;
  if (!uploads) return {};
  return Object.fromEntries(
    IMAGE_PURPOSES.map((purpose) => {
      const policy = uploads.purposes[purpose];
      return [
        purpose,
        {
          enabled: policy.enabled,
          original: policy,
          ...(Object.fromEntries(
            limits.map((limit) => [limit, textOf(policy[limit])]),
          ) as Record<Limit, string>),
        },
      ];
    }),
  );
}

function toValues(form: Form, issues: Issues) {
  const purposes: Partial<Record<ImagePurpose, ImagePolicy>> = {};
  for (const purpose of IMAGE_PURPOSES) {
    const row = form[purpose];
    if (!row) continue;
    const next: ImagePolicy = { ...row.original, enabled: row.enabled };
    for (const limit of limits)
      next[limit] = toNumber(
        row[limit],
        `uploads.purposes.${purpose}.${limit}`,
        issues,
      );
    // Overrides may only tighten Media's hard ceilings.
    if (!imagePolicyWithinCeiling(purpose, next))
      issues.add(`uploads.purposes.${purpose}`);
    const changed = JSON.stringify(next) !== JSON.stringify(row.original);
    purposes[purpose] = changed
      ? { ...next, version: row.original.version + 1 }
      : next;
  }
  return { uploads: { purposes } };
}

/** Media image limits (single key `uploads`), independent of `policies_reviews`.
 * Not configured stays read-only: no policy is invented here. */
export function UploadPoliciesCard({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.uploads');
  const tf = useTranslations('superAdmin.settings');
  const section = useSectionForm({
    id: 'uploads',
    data,
    keys: ['uploads'],
    group: null,
    toForm,
    toValues,
  });
  const { form, has } = section;
  const ceiling = (purpose: ImagePurpose) => {
    const limit = IMAGE_POLICY_CEILINGS[purpose];
    return t('ceiling', {
      width: limit.minWidth,
      height: limit.minHeight,
      widths: limit.widths.join(', '),
      kb: Math.round(limit.variantMaxBytes / 1024),
    });
  };
  if (!form.product)
    return (
      <Card padded className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-h3">{t('title')}</h2>
          <ConfiguredBadge configured={false} />
        </div>
        <SetupTasks missing={data.readiness.images.missingFields} />
        <ul className="grid gap-1 text-small text-text-2">
          {IMAGE_PURPOSES.map((purpose) => (
            <li key={purpose}>
              <span className="font-semibold">
                {t(`purposes.${messageKey(purpose)}`)}
              </span>
              {': '}
              {ceiling(purpose)}
            </li>
          ))}
        </ul>
      </Card>
    );
  return (
    <FormCard
      title={t('title')}
      section={section}
      rules={(path) =>
        /^uploads\.purposes\.[a-z_]+$/.test(path) || path === 'uploads.purposes'
          ? t('ceilingRule')
          : undefined
      }
    >
      <SetupTasks missing={data.readiness.images.missingFields} />
      {IMAGE_PURPOSES.map((purpose) => {
        const row = form[purpose];
        if (!row) return null;
        const prefix = `uploads.purposes.${purpose}`;
        const set = (patch: Partial<Row>) =>
          section.change((current) => {
            const existing = current[purpose];
            return existing
              ? { ...current, [purpose]: { ...existing, ...patch } }
              : current;
          });
        return (
          <fieldset
            key={purpose}
            className="grid gap-3 rounded-md border border-border p-3 tablet:grid-cols-2"
          >
            <legend className="px-1 text-h4">
              {t(`purposes.${messageKey(purpose)}`)}
            </legend>
            <p className="text-small text-muted tablet:col-span-2">
              {ceiling(purpose)}
            </p>
            <Switch
              label={tf('enabled')}
              wrapperClassName="tablet:col-span-2"
              checked={row.enabled}
              onChange={(event) => set({ enabled: event.target.checked })}
            />
            {limits.map((limit) => (
              <Input
                key={limit}
                label={t(`limits.${limit}`)}
                inputMode="numeric"
                required
                value={row[limit]}
                error={
                  has(`${prefix}.${limit}`) || has(prefix)
                    ? tf('errors.field')
                    : undefined
                }
                onChange={(event) => set({ [limit]: event.target.value })}
              />
            ))}
          </fieldset>
        );
      })}
    </FormCard>
  );
}
