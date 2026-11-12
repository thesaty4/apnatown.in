'use client';

import { useTranslations } from 'next-intl';
import {
  PromotionKindSchema,
  type SettingValue,
  type SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { Checkbox, Switch } from '@apnatown/ui/primitives/Selection';
import {
  FormCard,
  SetupTasks,
  percentOf,
  rupees,
  toBps,
  toPaise,
  useSectionForm,
  type Issues,
  messageKey,
} from './form';

type Row = {
  isNew: boolean;
  code: string;
  nameEn: string;
  nameHi: string;
  price: string;
  enabled: boolean;
};
type PlanRow = Row & { commission: string; premium: boolean };
type PromoRow = Row & { kind: SettingValue<'promotion_fees'>[number]['kind'] };
type Form = {
  defaultPct: string;
  platformFee: string;
  plans: PlanRow[];
  promos: PromoRow[];
};
const keys = ['commission', 'plans', 'promotion_fees'] as const;

function toForm(values: {
  commission?: unknown;
  plans?: unknown;
  promotion_fees?: unknown;
}): Form {
  const commission = values.commission as SettingValue<'commission'> | null;
  const plans = (values.plans as SettingValue<'plans'> | null) ?? [];
  const promos =
    (values.promotion_fees as SettingValue<'promotion_fees'> | null) ?? [];
  return {
    defaultPct: percentOf(commission?.defaultBps),
    platformFee: rupees(commission?.platformFeePaise),
    plans: plans.map((plan) => ({
      isNew: false,
      code: plan.code,
      nameEn: plan.nameEn,
      nameHi: plan.nameHi,
      price: rupees(plan.pricePaise),
      commission: percentOf(plan.commissionBps),
      enabled: plan.enabled,
      premium: plan.premium,
    })),
    promos: promos.map((fee) => ({
      isNew: false,
      code: fee.code,
      nameEn: fee.nameEn,
      nameHi: fee.nameHi,
      price: rupees(fee.pricePaise),
      enabled: fee.enabled,
      kind: fee.kind,
    })),
  };
}

function toValues(form: Form, issues: Issues) {
  return {
    commission: {
      defaultBps: toBps(form.defaultPct, 'commission.defaultBps', issues),
      platformFeePaise: toPaise(
        form.platformFee,
        'commission.platformFeePaise',
        issues,
      ),
    },
    plans: form.plans.map((plan, index) => ({
      code: plan.code.trim(),
      nameEn: plan.nameEn,
      nameHi: plan.nameHi,
      pricePaise: toPaise(plan.price, `plans.${index}.pricePaise`, issues),
      commissionBps: toBps(
        plan.commission,
        `plans.${index}.commissionBps`,
        issues,
      ),
      enabled: plan.enabled,
      premium: plan.premium,
      // Fixed server term: calendar month, no auto-renew/proration.
      billingPeriodMonths: 1 as const,
    })),
    promotion_fees: form.promos.map((fee, index) => ({
      code: fee.code.trim(),
      nameEn: fee.nameEn,
      nameHi: fee.nameHi,
      pricePaise: toPaise(
        fee.price,
        `promotion_fees.${index}.pricePaise`,
        issues,
      ),
      enabled: fee.enabled,
      kind: fee.kind,
      // Fixed server term: 7 days.
      durationDays: 7 as const,
    })),
  };
}

const blankRow: Row = {
  isNew: true,
  code: '',
  nameEn: '',
  nameHi: '',
  price: '',
  enabled: false,
};

/** Default commission, plans and promotion fees: one atomic `commission_plans` save. */
export function MoneySettingsForm({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.money');
  const tf = useTranslations('superAdmin.settings');
  const section = useSectionForm({
    id: 'commission_plans',
    data,
    keys,
    group: 'commission_plans',
    toForm,
    toValues,
  });
  const { form, change, has } = section;
  const err = (path: string, key: 'field' | 'text' | 'code' = 'field') =>
    has(path) ? tf(`errors.${key}`) : undefined;
  const setPlan = (index: number, patch: Partial<PlanRow>) =>
    change((current) => ({
      ...current,
      plans: current.plans.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));
  const setPromo = (index: number, patch: Partial<PromoRow>) =>
    change((current) => ({
      ...current,
      promos: current.promos.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));
  const names = (
    row: Row,
    prefix: string,
    set: (patch: Partial<Row>) => void,
  ) => (
    <>
      <Input
        label={t('code')}
        hint={row.isNew ? t('codeHint') : undefined}
        value={row.code}
        readOnly={!row.isNew}
        required
        error={err(`${prefix}.code`, 'code')}
        onChange={(event) => set({ code: event.target.value })}
      />
      <Input
        label={t('nameEn')}
        lang="en"
        maxLength={60}
        value={row.nameEn}
        required
        error={err(`${prefix}.nameEn`, 'text')}
        onChange={(event) => set({ nameEn: event.target.value })}
      />
      <Input
        label={t('nameHi')}
        lang="hi"
        maxLength={60}
        value={row.nameHi}
        required
        error={err(`${prefix}.nameHi`, 'text')}
        onChange={(event) => set({ nameHi: event.target.value })}
      />
    </>
  );

  return (
    <FormCard
      title={tf('sections.commission')}
      section={section}
      rules={(path) => {
        if (/^plans\.\d+$/.test(path)) return t('premiumRule');
        if (/^promotion_fees\.\d+$/.test(path)) return t('promoPriceRule');
        if (path === 'plans' || path === 'promotion_fees')
          return t('uniqueCode');
        return undefined;
      }}
    >
      <div className="grid gap-3 tablet:grid-cols-2">
        <Input
          label={t('defaultCommission')}
          inputMode="decimal"
          value={form.defaultPct}
          required
          error={err('commission.defaultBps')}
          onChange={(event) =>
            change((current) => ({
              ...current,
              defaultPct: event.target.value,
            }))
          }
        />
        <Input
          label={t('platformFee')}
          inputMode="decimal"
          value={form.platformFee}
          required
          error={err('commission.platformFeePaise')}
          onChange={(event) =>
            change((current) => ({
              ...current,
              platformFee: event.target.value,
            }))
          }
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-h4">{t('plansTitle')}</legend>
        <p className="text-small text-muted">{t('plansTerm')}</p>
        <SetupTasks missing={data.readiness.plans.missingFields} />
        {form.plans.map((plan, index) => {
          const prefix = `plans.${index}`;
          return (
            <div
              key={index}
              role="group"
              aria-label={t('planRow', { row: index + 1 })}
              className="grid gap-3 rounded-md border border-border p-3 tablet:grid-cols-2"
            >
              {names(plan, prefix, (patch) => setPlan(index, patch))}
              <Input
                label={t('planPrice')}
                inputMode="decimal"
                value={plan.price}
                required
                error={err(`${prefix}.pricePaise`)}
                onChange={(event) =>
                  setPlan(index, { price: event.target.value })
                }
              />
              <Input
                label={t('planCommission')}
                inputMode="decimal"
                value={plan.commission}
                required
                error={err(`${prefix}.commissionBps`)}
                onChange={(event) =>
                  setPlan(index, { commission: event.target.value })
                }
              />
              <Checkbox
                label={t('premium')}
                description={t('premiumHint')}
                checked={plan.premium}
                onChange={(event) =>
                  setPlan(index, { premium: event.target.checked })
                }
              />
              <Switch
                label={tf('enabled')}
                checked={plan.enabled}
                onChange={(event) =>
                  setPlan(index, { enabled: event.target.checked })
                }
              />
              {plan.isNew && (
                <Button
                  type="button"
                  variant="text"
                  className="justify-self-start"
                  onClick={() =>
                    change((current) => ({
                      ...current,
                      plans: current.plans.filter((_, i) => i !== index),
                    }))
                  }
                >
                  {tf('remove')}
                </Button>
              )}
            </div>
          );
        })}
        {form.plans.length < 20 && (
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            onClick={() =>
              change((current) => ({
                ...current,
                plans: [
                  ...current.plans,
                  { ...blankRow, commission: '', premium: false },
                ],
              }))
            }
          >
            {t('addPlan')}
          </Button>
        )}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-h4">{t('promosTitle')}</legend>
        <p className="text-small text-muted">{t('promosTerm')}</p>
        <SetupTasks missing={data.readiness.promotions.missingFields} />
        {form.promos.map((fee, index) => {
          const prefix = `promotion_fees.${index}`;
          return (
            <div
              key={index}
              role="group"
              aria-label={t('promoRow', { row: index + 1 })}
              className="grid gap-3 rounded-md border border-border p-3 tablet:grid-cols-2"
            >
              {names(fee, prefix, (patch) => setPromo(index, patch))}
              <Select
                label={t('kind')}
                value={fee.kind}
                disabled={!fee.isNew}
                options={PromotionKindSchema.options.map((kind) => ({
                  value: kind,
                  label: t(`kinds.${messageKey(kind)}`),
                }))}
                onChange={(event) =>
                  setPromo(index, {
                    kind: PromotionKindSchema.parse(event.target.value),
                  })
                }
              />
              <Input
                label={t('promoPrice')}
                inputMode="decimal"
                value={fee.price}
                required
                error={err(`${prefix}.pricePaise`)}
                onChange={(event) =>
                  setPromo(index, { price: event.target.value })
                }
              />
              <Switch
                label={tf('enabled')}
                checked={fee.enabled}
                onChange={(event) =>
                  setPromo(index, { enabled: event.target.checked })
                }
              />
              {fee.isNew && (
                <Button
                  type="button"
                  variant="text"
                  className="justify-self-start"
                  onClick={() =>
                    change((current) => ({
                      ...current,
                      promos: current.promos.filter((_, i) => i !== index),
                    }))
                  }
                >
                  {tf('remove')}
                </Button>
              )}
            </div>
          );
        })}
        {form.promos.length < 20 && (
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            onClick={() =>
              change((current) => ({
                ...current,
                promos: [
                  ...current.promos,
                  { ...blankRow, kind: 'homepage_banner' },
                ],
              }))
            }
          >
            {t('addPromo')}
          </Button>
        )}
      </fieldset>
      <p className="text-small text-muted">{tf('newOrdersOnly')}</p>
    </FormCard>
  );
}
