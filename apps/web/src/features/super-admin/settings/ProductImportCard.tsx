'use client';

import { useTranslations } from 'next-intl';
import {
  PRODUCT_IMPORT_MAX_BYTES,
  PRODUCT_IMPORT_MAX_ROWS,
} from '@apnatown/shared/products';
import type {
  SettingValue,
  SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Input } from '@apnatown/ui/primitives/Input';
import { Switch } from '@apnatown/ui/primitives/Selection';
import {
  ConfiguredBadge,
  FormCard,
  textOf,
  toNumber,
  useSectionForm,
  type Issues,
} from './form';

const KIB = 1024;
const maxKib = PRODUCT_IMPORT_MAX_BYTES / KIB;
type Form = { enabled: boolean; maxRows: string; maxKib: string };

function toForm(values: { product_import?: unknown }): Form {
  const policy = values.product_import as SettingValue<'product_import'> | null;
  return {
    enabled: policy?.enabled ?? false,
    maxRows: textOf(policy?.maxRows),
    maxKib: policy ? String(Math.floor(policy.maxBytes / KIB)) : '',
  };
}

function toValues(form: Form, issues: Issues) {
  return {
    product_import: {
      enabled: form.enabled,
      maxRows: toNumber(form.maxRows, 'product_import.maxRows', issues),
      maxBytes:
        toNumber(form.maxKib, 'product_import.maxBytes', issues) * KIB,
    },
  };
}

/** Q-47 owner CSV/XLSX import caps (single key `product_import`). Import stays
 * off until a Super Admin saves limits within the shared hard ceilings. */
export function ProductImportCard({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.productImport');
  const tf = useTranslations('superAdmin.settings');
  const section = useSectionForm({
    id: 'product_import',
    data,
    keys: ['product_import'],
    group: null,
    toForm,
    toValues,
  });
  const { form, has } = section;
  const configured = data.settings.some(
    (entry) => entry.key === 'product_import' && entry.value !== null,
  );
  const set = (patch: Partial<Form>) =>
    section.change((current) => ({ ...current, ...patch }));
  return (
    <FormCard
      title={t('title')}
      section={section}
      status={<ConfiguredBadge configured={configured} />}
    >
      <p className="text-small text-text-2">
        {t('intro', { rows: PRODUCT_IMPORT_MAX_ROWS, kb: maxKib })}
      </p>
      <Switch
        label={t('enabled')}
        checked={form.enabled}
        onChange={(event) => set({ enabled: event.target.checked })}
      />
      <div className="grid gap-3 tablet:grid-cols-2">
        <Input
          label={t('maxRows')}
          hint={t('maxRowsHint', { max: PRODUCT_IMPORT_MAX_ROWS })}
          inputMode="numeric"
          required
          value={form.maxRows}
          error={has('product_import.maxRows') ? tf('errors.field') : undefined}
          onChange={(event) => set({ maxRows: event.target.value })}
        />
        <Input
          label={t('maxKib')}
          hint={t('maxKibHint', { max: maxKib })}
          inputMode="numeric"
          required
          value={form.maxKib}
          error={
            has('product_import.maxBytes') ? tf('errors.field') : undefined
          }
          onChange={(event) => set({ maxKib: event.target.value })}
        />
      </div>
    </FormCard>
  );
}
