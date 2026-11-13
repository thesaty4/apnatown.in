'use client';

import { useTranslations } from 'next-intl';
import {
  FEE_TAX_CODE_KEYS,
  SupplierTaxProfileSchema,
  TaxClassificationSchema,
  type SettingValue,
  type SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import {
  FormCard,
  SetupTasks,
  percentOf,
  toBps,
  useSectionForm,
  type Issues,
  messageKey,
} from './form';

type Tax = SettingValue<'tax'>;
type Mode = Tax['platformSupplier']['registrationMode'];
type Supply = Tax['classifications'][number]['supplyType'];
type FeeKey = (typeof FEE_TAX_CODE_KEYS)[number];
const modes = SupplierTaxProfileSchema.shape.registrationMode.options;
const supplies = TaxClassificationSchema.shape.supplyType.options;

type Supplier = {
  supplierRef: string;
  legalName: string;
  address: string;
  stateCode: string;
  registrationMode: Mode;
  gstin: string;
  requiresIrn: boolean;
  authorizedSignatoryRef: string;
};
type Classification = {
  code: string;
  hsnOrSac: string;
  unitCode: string;
  supplyType: Supply;
  gst: string;
  cess: string;
};
type Form = {
  supplier: Supplier;
  supplierVersion: number;
  supplierSnapshot: string;
  classifications: Classification[];
  fees: Record<FeeKey, string>;
  verified: boolean;
  verifiedAt: string;
  evidenceRef: string;
};

function toForm(values: { tax?: unknown }): Form {
  const tax = values.tax as Tax | null;
  const profile = tax?.platformSupplier;
  const supplier: Supplier = {
    supplierRef: profile?.supplierRef ?? '',
    legalName: profile?.legalName ?? '',
    address: profile?.address ?? '',
    stateCode: profile?.stateCode ?? '',
    registrationMode: profile?.registrationMode ?? 'regular',
    gstin: profile?.gstin ?? '',
    requiresIrn: profile?.requiresIrn ?? false,
    authorizedSignatoryRef: profile?.authorizedSignatoryRef ?? '',
  };
  return {
    supplier,
    supplierVersion: profile?.version ?? 0,
    supplierSnapshot: JSON.stringify(supplier),
    classifications:
      tax?.classifications.map((item) => ({
        code: item.code,
        hsnOrSac: item.hsnOrSac,
        unitCode: item.unitCode,
        supplyType: item.supplyType,
        gst: percentOf(item.gstRateBps),
        cess: percentOf(item.cessRateBps),
      })) ?? [],
    fees: Object.fromEntries(
      FEE_TAX_CODE_KEYS.map((key) => [key, tax?.feeTaxCodes[key] ?? '']),
    ) as Record<FeeKey, string>,
    verified: tax?.versionEvidence.verified ?? false,
    verifiedAt: tax?.versionEvidence.verifiedAt ?? '',
    evidenceRef: tax?.versionEvidence.evidenceRef ?? '',
  };
}

function toValues(form: Form, issues: Issues) {
  const { gstin, ...supplier } = form.supplier;
  const changed = JSON.stringify(form.supplier) !== form.supplierSnapshot;
  return {
    tax: {
      platformSupplier: {
        ...supplier,
        ...(gstin.trim() && { gstin: gstin.trim() }),
        // A changed supplier profile is a new profile version.
        version:
          form.supplierVersion === 0
            ? 1
            : form.supplierVersion + (changed ? 1 : 0),
      },
      classifications: form.classifications.map((item, index) => ({
        code: item.code.trim(),
        hsnOrSac: item.hsnOrSac.trim(),
        unitCode: item.unitCode.trim(),
        supplyType: item.supplyType,
        gstRateBps: toBps(
          item.gst,
          `tax.classifications.${index}.gstRateBps`,
          issues,
        ),
        cessRateBps: toBps(
          item.cess,
          `tax.classifications.${index}.cessRateBps`,
          issues,
        ),
      })),
      feeTaxCodes: form.fees,
      versionEvidence: {
        verified: form.verified,
        verifiedAt: form.verifiedAt,
        evidenceRef: form.evidenceRef.trim(),
      },
    },
  };
}

/** Versioned tax configuration (single key `tax`). Effective for new quotes
 * only; never infers a GST rate or treats a format check as verification. */
export function TaxSettingsCard({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.tax');
  const tf = useTranslations('superAdmin.settings');
  const section = useSectionForm({
    id: 'tax',
    data,
    keys: ['tax'],
    group: null,
    toForm,
    toValues,
  });
  const { form, has } = section;
  const err = (path: string) => (has(path) ? tf('errors.field') : undefined);
  // Any edit needs a fresh external-verification confirmation.
  const change = (update: (form: Form) => Form) =>
    section.change((current) => ({
      ...update(current),
      verified: false,
      verifiedAt: '',
    }));
  const setSupplier = (patch: Partial<Supplier>) =>
    change((current) => ({
      ...current,
      supplier: { ...current.supplier, ...patch },
    }));
  const setItem = (index: number, patch: Partial<Classification>) =>
    change((current) => ({
      ...current,
      classifications: current.classifications.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  const s = form.supplier;
  const sp = 'tax.platformSupplier';
  const codeOptions = [
    { value: '', label: t('chooseCode') },
    ...form.classifications
      .filter((item) => item.code.trim())
      .map((item) => ({ value: item.code.trim(), label: item.code.trim() })),
  ];

  return (
    <FormCard
      title={t('title')}
      section={section}
      rules={(path) => {
        if (path === sp) return t('gstinState');
        if (path === `${sp}.requiresIrn`) return t('irnUnavailable');
        if (/^tax\.classifications\.\d+$/.test(path)) return t('exemptZero');
        if (path === 'tax.classifications') return t('classificationsRule');
        if (path === 'tax') return t('feeCodesRule');
        if (path.startsWith('tax.versionEvidence')) return t('verifyRequired');
        return undefined;
      }}
    >
      <p className="text-small text-muted">{t('intro')}</p>
      <SetupTasks missing={data.readiness.tax.missingFields} />
      <fieldset className="grid gap-3 tablet:grid-cols-2">
        <legend className="mb-2 text-h4">{t('supplier')}</legend>
        <Input
          label={t('legalName')}
          maxLength={200}
          required
          value={s.legalName}
          error={err(`${sp}.legalName`)}
          onChange={(event) => setSupplier({ legalName: event.target.value })}
        />
        <Input
          label={t('stateCode')}
          inputMode="numeric"
          maxLength={2}
          required
          value={s.stateCode}
          error={err(`${sp}.stateCode`)}
          onChange={(event) => setSupplier({ stateCode: event.target.value })}
        />
        <TextArea
          label={t('address')}
          wrapperClassName="tablet:col-span-2"
          maxLength={500}
          rows={2}
          required
          value={s.address}
          error={err(`${sp}.address`)}
          onChange={(event) => setSupplier({ address: event.target.value })}
        />
        <Select
          label={t('registrationMode')}
          value={s.registrationMode}
          options={modes.map((mode) => ({
            value: mode,
            label: t(`modes.${mode}`),
          }))}
          onChange={(event) =>
            setSupplier({
              registrationMode:
                modes.find((mode) => mode === event.target.value) ??
                s.registrationMode,
            })
          }
        />
        <Input
          label={t('gstin')}
          hint={t('gstinHint')}
          maxLength={15}
          value={s.gstin}
          error={err(`${sp}.gstin`)}
          onChange={(event) =>
            setSupplier({ gstin: event.target.value.toUpperCase() })
          }
        />
        <Input
          label={t('supplierRef')}
          required
          value={s.supplierRef}
          error={err(`${sp}.supplierRef`)}
          onChange={(event) => setSupplier({ supplierRef: event.target.value })}
        />
        <Input
          label={t('signatoryRef')}
          required
          value={s.authorizedSignatoryRef}
          error={err(`${sp}.authorizedSignatoryRef`)}
          onChange={(event) =>
            setSupplier({ authorizedSignatoryRef: event.target.value })
          }
        />
        <Checkbox
          label={t('requiresIrn')}
          description={t('requiresIrnHint')}
          checked={s.requiresIrn}
          {...(has(`${sp}.requiresIrn`) ? { error: t('irnUnavailable') } : {})}
          onChange={(event) =>
            setSupplier({ requiresIrn: event.target.checked })
          }
        />
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-h4">{t('classifications')}</legend>
        {form.classifications.map((item, index) => {
          const prefix = `tax.classifications.${index}`;
          return (
            <div
              key={index}
              role="group"
              aria-label={t('classificationRow', { row: index + 1 })}
              className="grid gap-3 rounded-md border border-border p-3 tablet:grid-cols-3"
            >
              <Input
                label={t('code')}
                required
                value={item.code}
                error={err(`${prefix}.code`)}
                onChange={(event) =>
                  setItem(index, { code: event.target.value })
                }
              />
              <Input
                label={t('hsnOrSac')}
                inputMode="numeric"
                required
                value={item.hsnOrSac}
                error={err(`${prefix}.hsnOrSac`)}
                onChange={(event) =>
                  setItem(index, { hsnOrSac: event.target.value })
                }
              />
              <Input
                label={t('unitCode')}
                maxLength={3}
                required
                value={item.unitCode}
                error={err(`${prefix}.unitCode`)}
                onChange={(event) =>
                  setItem(index, { unitCode: event.target.value.toUpperCase() })
                }
              />
              <Select
                label={t('supplyType')}
                value={item.supplyType}
                options={supplies.map((supply) => ({
                  value: supply,
                  label: t(`supplies.${messageKey(supply)}`),
                }))}
                onChange={(event) =>
                  setItem(index, {
                    supplyType:
                      supplies.find(
                        (supply) => supply === event.target.value,
                      ) ?? item.supplyType,
                  })
                }
              />
              <Input
                label={t('gstRate')}
                inputMode="decimal"
                required
                value={item.gst}
                error={err(`${prefix}.gstRateBps`)}
                onChange={(event) =>
                  setItem(index, { gst: event.target.value })
                }
              />
              <Input
                label={t('cessRate')}
                inputMode="decimal"
                required
                value={item.cess}
                error={err(`${prefix}.cessRateBps`)}
                onChange={(event) =>
                  setItem(index, { cess: event.target.value })
                }
              />
              <Button
                type="button"
                variant="text"
                className="justify-self-start"
                onClick={() =>
                  change((current) => ({
                    ...current,
                    classifications: current.classifications.filter(
                      (_, i) => i !== index,
                    ),
                  }))
                }
              >
                {tf('remove')}
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          onClick={() =>
            change((current) => ({
              ...current,
              // No rate is inferred: every new row starts blank.
              classifications: [
                ...current.classifications,
                {
                  code: '',
                  hsnOrSac: '',
                  unitCode: '',
                  supplyType: 'taxable',
                  gst: '',
                  cess: '',
                },
              ],
            }))
          }
        >
          {t('addClassification')}
        </Button>
      </fieldset>

      <fieldset className="grid gap-3 tablet:grid-cols-2">
        <legend className="mb-2 text-h4">{t('feeCodes')}</legend>
        {FEE_TAX_CODE_KEYS.map((key) => (
          <Select
            key={key}
            label={t(`fees.${key}`)}
            value={form.fees[key]}
            required
            error={err(`tax.feeTaxCodes.${key}`)}
            options={
              codeOptions.some((option) => option.value === form.fees[key])
                ? codeOptions
                : [
                    ...codeOptions,
                    { value: form.fees[key], label: form.fees[key] },
                  ]
            }
            onChange={(event) =>
              change((current) => ({
                ...current,
                fees: { ...current.fees, [key]: event.target.value },
              }))
            }
          />
        ))}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-h4">{t('evidence')}</legend>
        <Input
          label={t('evidenceRef')}
          required
          value={form.evidenceRef}
          error={err('tax.versionEvidence.evidenceRef')}
          onChange={(event) =>
            change((current) => ({
              ...current,
              evidenceRef: event.target.value,
            }))
          }
        />
        <Checkbox
          label={t('verified')}
          checked={form.verified}
          {...(has('tax.versionEvidence.verified') ||
          has('tax.versionEvidence.verifiedAt')
            ? { error: t('verifyRequired') }
            : {})}
          onChange={(event) =>
            section.change((current) => ({
              ...current,
              verified: event.target.checked,
              verifiedAt: event.target.checked ? new Date().toISOString() : '',
            }))
          }
        />
      </fieldset>
      <p className="text-small text-muted">{t('newQuotesOnly')}</p>
    </FormCard>
  );
}
